import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function env(overrides = {}) {
  return {
    ADMIN_GITHUB_CLIENT_ID: "test-client-id",
    ADMIN_GITHUB_CLIENT_SECRET: "test-client-secret",
    ADMIN_SESSION_SECRET: "test-session-secret-that-is-long-enough",
    ...overrides,
  };
}

async function begin(auth) {
  const response = await auth.handleGitHubOAuth({
    request: new Request("https://admin.looksawful.ru/auth/github"),
    env: env(),
    fetch: async () => new Response("unexpected", { status: 500 }),
  });
  const location = new URL(response.headers.get("Location"));
  const state = location.searchParams.get("state");
  const stateCookie = (response.headers.get("Set-Cookie") ?? "").split(";", 1)[0];
  return { response, location, state, stateCookie };
}

function callbackRequest(state, stateCookie) {
  return new Request(
    `https://admin.looksawful.ru/auth/github/callback?code=test-code&state=${encodeURIComponent(state)}`,
    { headers: { Cookie: stateCookie } },
  );
}

test("private Admin uses GitHub OAuth instead of Basic Auth", async () => {
  const middleware = await read("lab/functions/_middleware.js");

  assert.doesNotMatch(middleware, /LAB_PASSWORD|WWW-Authenticate|\bBasic\b/);
  assert.match(middleware, /github-oauth\.js/);

  const auth = await import("../lab/functions/github-oauth.js");
  assert.equal(typeof auth.handleGitHubOAuth, "function");
  assert.equal(typeof auth.verifyAdminSession, "function");
});

test("OAuth start requests no broad GitHub scopes and stores state only in a secure server cookie", async () => {
  const auth = await import("../lab/functions/github-oauth.js");
  const { response, location } = await begin(auth);

  assert.equal(response.status, 302);
  assert.equal(location.origin, "https://github.com");
  assert.equal(location.pathname, "/login/oauth/authorize");
  assert.equal(location.searchParams.get("client_id"), "test-client-id");
  assert.equal(
    location.searchParams.get("redirect_uri"),
    "https://admin.looksawful.ru/auth/github/callback",
  );
  assert.equal(location.searchParams.get("scope"), null);
  assert.ok(location.searchParams.get("state"));

  const cookie = response.headers.get("Set-Cookie") ?? "";
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /test-client-secret|test-session-secret/);
});

test("OAuth callback verifies the authenticated GitHub user directly and creates only a signed app session", async () => {
  const auth = await import("../lab/functions/github-oauth.js");
  const { state, stateCookie } = await begin(auth);
  const calls = [];

  const response = await auth.handleGitHubOAuth({
    request: callbackRequest(state, stateCookie),
    env: env(),
    fetch: async (url) => {
      calls.push(String(url));
      if (String(url) === "https://github.com/login/oauth/access_token") {
        return Response.json({ access_token: "server-only-token", scope: "" });
      }
      if (String(url) === "https://api.github.com/user") {
        return Response.json({ login: "looksawful" });
      }
      throw new Error(`unexpected OAuth fetch: ${url}`);
    },
  });

  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("Location")).pathname, "/lab/");
  assert.deepEqual(calls, [
    "https://github.com/login/oauth/access_token",
    "https://api.github.com/user",
  ]);
  const cookies = response.headers.get("Set-Cookie") ?? "";
  assert.match(cookies, /looksawful-admin=/);
  assert.doesNotMatch(cookies, /server-only-token/);
});

test("OAuth callback rejects a different GitHub identity and inherited broad scopes", async () => {
  const auth = await import("../lab/functions/github-oauth.js");

  const unauthorizedStart = await begin(auth);
  const unauthorized = await auth.handleGitHubOAuth({
    request: callbackRequest(unauthorizedStart.state, unauthorizedStart.stateCookie),
    env: env(),
    fetch: async (url) => {
      if (String(url) === "https://github.com/login/oauth/access_token") {
        return Response.json({ access_token: "other-token", scope: "" });
      }
      if (String(url) === "https://api.github.com/user") {
        return Response.json({ login: "someone-else" });
      }
      throw new Error(`unexpected OAuth fetch: ${url}`);
    },
  });
  assert.equal(unauthorized.status, 403);

  const broadStart = await begin(auth);
  let identityRequested = false;
  const broad = await auth.handleGitHubOAuth({
    request: callbackRequest(broadStart.state, broadStart.stateCookie),
    env: env(),
    fetch: async (url) => {
      if (String(url) === "https://github.com/login/oauth/access_token") {
        return Response.json({ access_token: "overprivileged-token", scope: "repo" });
      }
      identityRequested = true;
      return Response.json({ login: "looksawful" });
    },
  });
  assert.equal(broad.status, 403);
  assert.equal(identityRequested, false);
});

test("session verifier rejects unsigned or expired cookies", async () => {
  const { verifyAdminSession } = await import("../lab/functions/github-oauth.js");
  const unsigned = new Request("https://admin.looksawful.ru/lab/", {
    headers: { Cookie: "__Host-looksawful-admin=unsigned" },
  });

  assert.equal(await verifyAdminSession(unsigned, env()), null);
});

test("OAuth implementation never exposes GitHub access tokens or broad repository authority", async () => {
  const source = await read("lab/functions/github-oauth.js");

  assert.match(source, /ADMIN_GITHUB_CLIENT_ID/);
  assert.match(source, /ADMIN_GITHUB_CLIENT_SECRET/);
  assert.match(source, /ADMIN_SESSION_SECRET/);
  assert.match(source, /looksawful\/looksawful\.ru/);
  assert.match(source, /https:\/\/api\.github\.com\/user/);
  assert.doesNotMatch(source, /\/user\/repos/);
  assert.doesNotMatch(source, /scope[^\n]*(?:repo|workflow|write:)/i);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /access_token[^\n]*(?:cookie|Set-Cookie)/i);
});
