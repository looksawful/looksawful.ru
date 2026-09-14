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

test("delete endpoint returns dependency conflicts before any GitHub write", async () => {
  let calls = 0;
  const env = await testEnv(async () => {
    calls += 1;
    throw new Error("GitHub must not be reached");
  });
  const cookie = await login(env);
  const response = await worker.fetch(mutationRequest("/api/media/delete", cookie, {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      record: {
        id: "asset-a",
        filePath: "public/media/catalog/asset-a.webp",
        catalogPath: "src/content/media-catalog/uploads/asset-a.json",
        usages: [{ kind: "gallery", ownerId: "asset-a", blockingDelete: true }],
      },
      expectedRevision: "rev-a",
      expectedHead: "head-a",
    }),
  }), env);

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.blockingUsages.length, 1);
  assert.equal(calls, 0);
});

test("replace endpoint verifies source revision and commits through the fixed authoring branch", async () => {
  const currentBytes = Buffer.from([9, 8, 7]);
  const expectedRevision = createHash("sha256").update(currentBytes).digest("hex");
  const calls = [];
  const githubFetch = async (url, init = {}) => {
    const request = { url: String(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(request);
    if (request.url === `${API}/git/ref/heads/content/text-cms`) return json({ object: { sha: "head-a" } });
    if (request.url.startsWith(`${API}/contents/public/media/catalog/asset-a.webp?`)) {
      return json({ sha: "blob-a", encoding: "base64", content: currentBytes.toString("base64") });
    }
    if (request.url === `${API}/git/commits/head-a`) return json({ tree: { sha: "tree-a" } });
    if (request.url === `${API}/git/blobs` && request.method === "POST") return json({ sha: "blob-b" }, 201);
    if (request.url === `${API}/git/trees` && request.method === "POST") return json({ sha: "tree-b" }, 201);
    if (request.url === `${API}/git/commits` && request.method === "POST") return json({ sha: "commit-b" }, 201);
    if (request.url === `${API}/git/refs/heads/content/text-cms` && request.method === "PATCH") {
      return json({ object: { sha: "commit-b" } });
    }
    throw new Error(`unexpected request: ${request.method} ${request.url}`);
  };
  const env = await testEnv(githubFetch);
  const cookie = await login(env);
  const form = new FormData();
  form.set("metadata", JSON.stringify({
    asset: { id: "asset-a", filePath: "public/media/catalog/asset-a.webp" },
    expectedRevision,
    expectedHead: "head-a",
  }));
  form.set("file", new File([new Uint8Array([1, 2, 3])], "asset-a.webp", { type: "image/webp" }));

  const response = await worker.fetch(mutationRequest("/api/media/replace", cookie, { body: form }), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.assetId, "asset-a");
  assert.equal(body.branchHead, "commit-b");
  assert.ok(calls.every(({ url }) => !url.includes("/heads/dev") && !url.includes("/heads/prod")));
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
