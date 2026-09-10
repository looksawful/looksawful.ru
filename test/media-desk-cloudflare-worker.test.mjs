import assert from "node:assert/strict";
import test from "node:test";

import { handleRequest } from "../tools/cloudflare/media-desk/worker.mjs";

const env = {
  MEDIA_DESK_USERNAME: "looksawful",
  MEDIA_DESK_PASSWORD_SHA256: "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
  MEDIA_DESK_SESSION_SECRET: "test-session-secret-that-is-long-enough",
  MEDIA_DESK_GITHUB_TOKEN: "test-token",
  MEDIA_DESK_REPOSITORY: "looksawful/looksawful.ru",
  MEDIA_DESK_BRANCH: "dev",
  MEDIA_DESK_MEDIA_ORIGIN: "https://www.looksawful.ru",
  LOGIN_RATE_LIMITER: {
    limit: async () => ({ success: true }),
  },
  ASSETS: {
    fetch: async () => new Response("asset"),
  },
};

test("Cloudflare Media Desk redirects unauthenticated browser requests to login", async () => {
  const response = await handleRequest(new Request("https://media.looksawful.ru/tools/media-desk/"), env);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/tools/media-desk/login/");
});

test("Cloudflare Media Desk serves its login form without authentication", async () => {
  const response = await handleRequest(new Request("https://media.looksawful.ru/tools/media-desk/login/"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Media Desk/);
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
});

test("Cloudflare Media Desk rejects unauthenticated write API requests", async () => {
  const response = await handleRequest(new Request("https://media.looksawful.ru/__media-desk/metadata", {
    method: "POST",
  }), env);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { ok: false, error: "Authentication required" });
});

test("Cloudflare Media Desk rejects login attempts when the native limiter is exhausted", async () => {
  const limitedEnv = {
    ...env,
    LOGIN_RATE_LIMITER: {
      limit: async ({ key }) => {
        assert.equal(key, "login:looksawful");
        return { success: false };
      },
    },
  };

  const response = await handleRequest(new Request("https://media.looksawful.ru/__media-desk/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://media.looksawful.ru",
    },
    body: "username=looksawful&password=secret",
  }), limitedEnv);

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
});
