import assert from "node:assert/strict";
import test from "node:test";

async function loadAuth() {
  try {
    return await import("../tools/preview/runtime/functions/_lib/auth.js");
  } catch (error) {
    assert.fail(`preview auth library must be importable: ${error.message}`);
  }
}

async function loadHandler(relativePath) {
  try {
    return await import(`../tools/preview/runtime/functions/${relativePath}.js`);
  } catch (error) {
    assert.fail(`preview handler ${relativePath} must be importable: ${error.message}`);
  }
}

async function makeEnv() {
  const { hashSecretForProvisioning } = await loadAuth();
  return {
    PREVIEW_PASSWORD_HASH: await hashSecretForProvisioning("correct-private-preview-password"),
    PREVIEW_SESSION_SECRET: "session-secret-with-at-least-32-bytes-1234567890",
    PREVIEW_CI_TOKEN_HASH: await hashSecretForProvisioning("ci-token-with-high-entropy-for-tests"),
  };
}

test("preview auth config fails closed when any required binding is absent", async () => {
  const { requireAuthConfig } = await loadAuth();
  const env = await makeEnv();

  for (const field of Object.keys(env)) {
    const broken = { ...env };
    delete broken[field];
    assert.throws(() => requireAuthConfig(broken), new RegExp(field));
  }
});

test("password verifier is deterministic and constant-contract fail closed", async () => {
  const { hashSecretForProvisioning, verifyHashedSecret } = await loadAuth();
  const verifier = await hashSecretForProvisioning("private-password");

  assert.match(verifier, /^sha256:[A-Za-z0-9_-]{43}$/);
  assert.equal(await verifyHashedSecret("private-password", verifier), true);
  assert.equal(await verifyHashedSecret("wrong-password", verifier), false);
  assert.equal(await verifyHashedSecret("private-password", "broken"), false);
});

test("session tokens are host-bound, expiring and tamper-evident", async () => {
  const { createSessionToken, verifySessionToken } = await loadAuth();
  const secret = "session-secret-with-at-least-32-bytes-1234567890";
  const now = 1_800_000_000;
  const token = await createSessionToken({
    host: "pr-801.example.pages.dev",
    secret,
    now,
    ttlSeconds: 600,
  });

  assert.ok(await verifySessionToken(token, {
    host: "pr-801.example.pages.dev",
    secret,
    now: now + 599,
  }));
  assert.equal(await verifySessionToken(token, {
    host: "other.example.pages.dev",
    secret,
    now: now + 10,
  }), null);
  assert.equal(await verifySessionToken(token, {
    host: "pr-801.example.pages.dev",
    secret,
    now: now + 601,
  }), null);

  const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
  assert.equal(await verifySessionToken(tampered, {
    host: "pr-801.example.pages.dev",
    secret,
    now: now + 10,
  }), null);
});

test("human login requires same-origin POST and issues a hardened host-only cookie", async () => {
  const { onRequest } = await loadHandler("__preview/login");
  const env = await makeEnv();
  const origin = "https://pr-801.example.pages.dev";

  const crossOrigin = await onRequest({
    request: new Request(`${origin}/__preview/login`, {
      method: "POST",
      headers: {
        origin: "https://attacker.invalid",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "password=correct-private-preview-password",
    }),
    env,
  });
  assert.equal(crossOrigin.status, 403);

  const response = await onRequest({
    request: new Request(`${origin}/__preview/login`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "password=correct-private-preview-password&next=%2Fgallery%2F",
    }),
    env,
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/gallery/");
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /^__Host-preview_session=/);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=43200/i);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.doesNotMatch(cookie, /correct-private-preview-password/);
});

test("invalid human password returns 401 without creating a session", async () => {
  const { onRequest } = await loadHandler("__preview/login");
  const env = await makeEnv();
  const origin = "https://pr-801.example.pages.dev";
  const response = await onRequest({
    request: new Request(`${origin}/__preview/login`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "password=wrong",
    }),
    env,
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.has("set-cookie"), false);
});

test("CI endpoint exchanges only a valid bearer secret for a short-lived HttpOnly session", async () => {
  const { onRequest } = await loadHandler("__preview/ci-session");
  const env = await makeEnv();
  const url = "https://pr-801.example.pages.dev/__preview/ci-session";

  const denied = await onRequest({
    request: new Request(url, { method: "POST", headers: { authorization: "Bearer wrong" } }),
    env,
  });
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.has("set-cookie"), false);

  const allowed = await onRequest({
    request: new Request(url, {
      method: "POST",
      headers: { authorization: "Bearer ci-token-with-high-entropy-for-tests" },
    }),
    env,
  });
  assert.equal(allowed.status, 204);
  const cookie = allowed.headers.get("set-cookie") ?? "";
  assert.match(cookie, /^__Host-preview_session=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Max-Age=1800/i);
  assert.doesNotMatch(cookie, /ci-token-with-high-entropy-for-tests/);
});

test("middleware redirects unauthenticated requests and decorates authenticated responses", async () => {
  const { onRequest } = await loadHandler("_middleware");
  const { createSessionToken, cookieHeader } = await loadAuth();
  const env = await makeEnv();
  const origin = "https://pr-801.example.pages.dev";

  let nextCalls = 0;
  const unauthenticated = await onRequest({
    request: new Request(`${origin}/gallery/?mode=test`),
    env,
    next: async () => {
      nextCalls += 1;
      return new Response("candidate");
    },
  });
  assert.equal(unauthenticated.status, 303);
  assert.equal(nextCalls, 0);
  assert.equal(unauthenticated.headers.get("location"), "/__preview/login?next=%2Fgallery%2F%3Fmode%3Dtest");

  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    host: "pr-801.example.pages.dev",
    secret: env.PREVIEW_SESSION_SECRET,
    now,
    ttlSeconds: 600,
  });
  const authenticated = await onRequest({
    request: new Request(`${origin}/gallery/`, { headers: { cookie: cookieHeader(token) } }),
    env,
    next: async () => {
      nextCalls += 1;
      return new Response("candidate", { status: 200, headers: { "content-type": "text/html" } });
    },
  });

  assert.equal(authenticated.status, 200);
  assert.equal(await authenticated.text(), "candidate");
  assert.equal(nextCalls, 1);
  assert.equal(authenticated.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(authenticated.headers.get("cache-control"), "private, no-store");
  assert.equal(authenticated.headers.get("x-content-type-options"), "nosniff");
  assert.equal(authenticated.headers.get("referrer-policy"), "no-referrer");
  assert.equal(authenticated.headers.get("x-frame-options"), "DENY");
  assert.match(authenticated.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
});

test("middleware returns 503 instead of exposing the candidate when auth config is broken", async () => {
  const { onRequest } = await loadHandler("_middleware");
  let nextCalls = 0;
  const response = await onRequest({
    request: new Request("https://pr-801.example.pages.dev/"),
    env: {},
    next: async () => {
      nextCalls += 1;
      return new Response("candidate");
    },
  });

  assert.equal(response.status, 503);
  assert.equal(nextCalls, 0);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
