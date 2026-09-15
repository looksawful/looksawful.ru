import assert from "node:assert/strict";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

const API = "https://api.github.com/repos/looksawful/looksawful.ru";
const ORIGIN = "https://media.looksawful.ru";
const REMOTE_UPLOAD_LIMIT = 16 * 1024 * 1024;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

async function envWith(githubFetch) {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(5), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    ...(githubFetch ? { MEDIA_DESK_GITHUB_FETCH: githubFetch } : {}),
    ASSETS: { async fetch() { return new Response("asset"); } },
  };
}

async function login(env) {
  const response = await worker.fetch(new Request(`${ORIGIN}/login`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ password: "secret" }),
  }), env);
  assert.equal(response.status, 204);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

test("remote upload creates binary and canonical CMS record in one authoring commit", async () => {
  const calls = [];
  const githubFetch = async (url, init = {}) => {
    const request = { url: String(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(request);
    if (request.url === `${API}/git/ref/heads/content/text-cms`) return json({ object: { sha: "head-a" } });
    if (request.url === `${API}/git/commits/head-a`) return json({ tree: { sha: "tree-a" } });
    if (request.url === `${API}/git/blobs` && request.method === "POST") return json({ sha: `blob-${calls.length}` }, 201);
    if (request.url === `${API}/git/trees` && request.method === "POST") return json({ sha: "tree-b" }, 201);
    if (request.url === `${API}/git/commits` && request.method === "POST") return json({ sha: "commit-b" }, 201);
    if (request.url === `${API}/git/refs/heads/content/text-cms` && request.method === "PATCH") return json({ object: { sha: "commit-b" } });
    throw new Error(`unexpected request: ${request.method} ${request.url}`);
  };
  const env = await envWith(githubFetch);
  const cookie = await login(env);
  const form = new FormData();
  form.set("metadata", JSON.stringify({
    mediaType: "image",
    width: 1200,
    height: 1600,
    title: "Portrait",
    expectedRevision: "catalog-rev-a",
    expectedHead: "head-a",
  }));
  form.set("file", new File([new Uint8Array([1, 2, 3, 4])], "portrait.webp", { type: "image/webp" }));

  const response = await worker.fetch(new Request(`${ORIGIN}/api/media/upload`, {
    method: "POST",
    headers: { origin: ORIGIN, cookie },
    body: form,
  }), env);

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.match(body.assetId, /^cms-[0-9a-f-]{36}$/i);
  assert.equal(body.branchHead, "commit-b");
  const treeCall = calls.find(({ url, method }) => url === `${API}/git/trees` && method === "POST");
  assert.equal(treeCall.body.tree.length, 2);
  assert.match(treeCall.body.tree[0].path, /^public\/media\/catalog\/[0-9a-f-]{36}\.webp$/i);
  assert.match(treeCall.body.tree[1].path, /^src\/content\/media-catalog\/uploads\/[0-9a-f-]{36}\.json$/i);
  assert.ok(calls.every(({ url }) => !url.includes("/heads/dev") && !url.includes("/heads/prod")));
});

test("remote upload rejects oversized transport bodies before parsing multipart data", async () => {
  let calls = 0;
  const env = await envWith(async () => {
    calls += 1;
    throw new Error("GitHub must not be reached");
  });
  const cookie = await login(env);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/media/upload`, {
    method: "POST",
    headers: {
      origin: ORIGIN,
      cookie,
      "content-type": "multipart/form-data; boundary=test",
      "content-length": String(REMOTE_UPLOAD_LIMIT + 1),
    },
    body: "--test--\r\n",
  }), env);

  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /remote media transport.*16 mib/i);
  assert.equal(calls, 0);
});
