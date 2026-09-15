import assert from "node:assert/strict";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

function cookieValue(setCookie) {
  return setCookie.split(";", 1)[0];
}

async function testEnv() {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash(
      "secret",
      new Uint8Array(16).fill(9),
      210_000,
    ),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    ASSETS: {
      async fetch(request) {
        return new Response(`asset:${new URL(request.url).pathname}`, {
          headers: { "content-type": "text/plain" },
        });
      },
    },
  };
}

test("remote Media Desk protects static assets before ASSETS fetch", async () => {
  const env = await testEnv();
  const response = await worker.fetch(
    new Request("https://media.looksawful.ru/tools/media-desk/"),
    env,
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
});

test("remote Media Desk login issues a strict secure HttpOnly session", async () => {
  const env = await testEnv();
  const login = await worker.fetch(
    new Request("https://media.looksawful.ru/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://media.looksawful.ru",
      },
      body: JSON.stringify({ password: "secret" }),
    }),
    env,
  );

  assert.equal(login.status, 204);
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /__Host-media_desk_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\//i);

  const authenticated = await worker.fetch(
    new Request("https://media.looksawful.ru/tools/media-desk/", {
      headers: { cookie: cookieValue(setCookie) },
    }),
    env,
  );

  assert.equal(authenticated.status, 200);
  assert.equal(await authenticated.text(), "asset:/tools/media-desk/");
  assert.equal(authenticated.headers.get("cache-control"), "private, no-store");
  assert.match(authenticated.headers.get("x-robots-tag") ?? "", /noindex/);
});

test("remote Media Desk rejects invalid credentials and cross-origin mutations", async () => {
  const env = await testEnv();

  const badLogin = await worker.fetch(
    new Request("https://media.looksawful.ru/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://media.looksawful.ru",
      },
      body: JSON.stringify({ password: "wrong" }),
    }),
    env,
  );
  assert.equal(badLogin.status, 401);

  const crossOrigin = await worker.fetch(
    new Request("https://media.looksawful.ru/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      body: JSON.stringify({ password: "secret" }),
    }),
    env,
  );
  assert.equal(crossOrigin.status, 403);
});
