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

test("private Admin uses GitHub OAuth instead of Basic Auth", async () => {
  const middleware = await read("lab/functions/_middleware.js");

  assert.doesNotMatch(middleware, /LAB_PASSWORD|WWW-Authenticate|\bBasic\b/);
  assert.match(middleware, /github-oauth\.js/);

  const auth = await import("../lab/functions/github-oauth.js");
  assert.equal(typeof auth.handleGitHubOAuth, "function");
  assert.equal(typeof auth.verifyAdminSession, "function");
});

test("OAuth start requests no broad GitHub scopes and stores state only in a secure server cookie", async () => {
  const { handleGitHubOAuth } = await import("../lab/functions/github-oauth.js");
  const request = new Request("https://admin.looksawful.ru/auth/github");

  const response = await handleGitHubOAuth({
    request,
    env: env(),
    fetch: async () => new Response("unexpected", { status: 500 }),
  });

  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location"));
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
  assert.doesNotMatch(source, /scope[^\n]*(?:repo|workflow|write:)/i);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /access_token[^\n]*(?:cookie|Set-Cookie)/i);
});
