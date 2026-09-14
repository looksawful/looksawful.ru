import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

const API = "https://api.github.com/repos/looksawful/looksawful.ru";
const ORIGIN = "https://media.looksawful.ru";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function cookieValue(setCookie) {
  return setCookie.split(";", 1)[0];
}

async function testEnv(githubFetch) {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(7), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    ...(githubFetch ? { MEDIA_DESK_GITHUB_FETCH: githubFetch } : {}),
    ASSETS: { async fetch() { return new Response("asset"); } },
  };
}

async function login(env) {
  const response = await worker.fetch(new Request(`${ORIGIN}/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ password: "secret" }),
  }), env);
  assert.equal(response.status, 204);
  return cookieValue(response.headers.get("set-cookie") ?? "");
}

function mutationRequest(path, cookie, init = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { origin: ORIGIN, cookie, ...(init.headers ?? {}) },
    ...(init.body === undefined ? {} : { body: init.body }),
  });
}

test("mutation endpoints stay auth and same-origin gated", async () => {
  const env = await testEnv();
  const unauthenticated = await worker.fetch(new Request(`${ORIGIN}/api/media/delete`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: "{}",
  }), env);
  assert.equal(unauthenticated.status, 401);

  const cookie = await login(env);
  const crossOrigin = await worker.fetch(new Request(`${ORIGIN}/api/media/delete`, {
    method: "POST",
    headers: { origin: "https://evil.example", cookie, "content-type": "application/json" },
    body: "{}",
  }), env);
  assert.equal(crossOrigin.status, 403);
});

test("upload and assign routes are explicit API endpoints instead of falling through to 405", async () => {
  const env = await testEnv();
  const cookie = await login(env);
  for (const path of ["/api/media/upload", "/api/media/assign"]) {
    const response = await worker.fetch(mutationRequest(path, cookie, {
      headers: { "content-type": "application/json" },
      body: "{}",
    }), env);
    assert.notEqual(response.status, 405, path);
    assert.equal(response.status, 400, path);
  }
});
