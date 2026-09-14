import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

const API = "https://api.github.com/repos/looksawful/looksawful.ru";
const ORIGIN = "https://media.looksawful.ru";
const projects = [
  { id: "jestei", visible: true, cover: { src: "/media/a.webp", width: 100, height: 100 } },
  { id: "styx", visible: true, cover: { src: "/media/b.webp", width: 200, height: 200 } },
];
const source = `${JSON.stringify(projects, null, 2)}\n`;
const revision = createHash("sha256").update(source).digest("hex");

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }
async function envWith(githubFetch) {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(4), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    MEDIA_DESK_GITHUB_FETCH: githubFetch,
    ASSETS: { async fetch() { return new Response("asset"); } },
  };
}
async function login(env) {
  const response = await worker.fetch(new Request(`${ORIGIN}/login`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ password: "secret" }) }), env);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

test("project-cover assignment changes one owner and commits only projects.json", async () => {
  const calls = [];
  const githubFetch = async (url, init = {}) => {
    const request = { url: String(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(request);
    if (request.url === `${API}/git/ref/heads/content/text-cms`) return json({ object: { sha: "head-a" } });
    if (request.url.startsWith(`${API}/contents/src/content/projects.json?`)) return json({ sha: "blob-a", encoding: "base64", content: Buffer.from(source).toString("base64") });
    if (request.url === `${API}/git/commits/head-a`) return json({ tree: { sha: "tree-a" } });
    if (request.url === `${API}/git/blobs` && request.method === "POST") return json({ sha: "blob-b" }, 201);
    if (request.url === `${API}/git/trees` && request.method === "POST") return json({ sha: "tree-b" }, 201);
    if (request.url === `${API}/git/commits` && request.method === "POST") return json({ sha: "commit-b" }, 201);
    if (request.url === `${API}/git/refs/heads/content/text-cms` && request.method === "PATCH") return json({ object: { sha: "commit-b" } });
    throw new Error(`unexpected request: ${request.method} ${request.url}`);
  };
  const env = await envWith(githubFetch);
  const cookie = await login(env);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/media/assign`, {
    method: "POST",
    headers: { origin: ORIGIN, cookie, "content-type": "application/json" },
    body: JSON.stringify({
      target: { kind: "project-cover", ownerId: "jestei" },
      asset: { id: "next", type: "image", src: "/media/next.webp", width: 1580, height: 1360 },
      expectedRevision: revision,
      expectedHead: "head-a",
    }),
  }), env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, target: { kind: "project-cover", ownerId: "jestei" }, branchHead: "commit-b", commitSha: "commit-b" });
  const blobCall = calls.find(({ url, method }) => url === `${API}/git/blobs` && method === "POST");
  const candidate = JSON.parse(Buffer.from(blobCall.body.content, "base64").toString("utf8"));
  assert.deepEqual(candidate[0].cover, { src: "/media/next.webp", width: 1580, height: 1360 });
  assert.deepEqual(candidate[1], projects[1]);
  const treeCall = calls.find(({ url, method }) => url === `${API}/git/trees` && method === "POST");
  assert.deepEqual(treeCall.body.tree.map(({ path }) => path), ["src/content/projects.json"]);
});
