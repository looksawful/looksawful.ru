import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

const API = "https://api.github.com/repos/looksawful/looksawful.ru";
const ORIGIN = "https://media.looksawful.ru";
const UUID = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
const ASSET_ID = `cms-${UUID}`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
function b64(value) { return Buffer.from(value).toString("base64"); }
function cookieValue(setCookie) { return setCookie.split(";", 1)[0]; }
async function runtime(githubFetch) {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(7), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    MEDIA_DESK_GITHUB_FETCH: githubFetch,
    ASSETS: { fetch: async () => new Response("asset") },
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
function request(path, cookie, body) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { origin: ORIGIN, cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
function uploadRecord(overrides = {}) {
  return {
    id: UUID, mediaType: "image", src: `/media/catalog/${UUID}.png`, deliverySrc: "", posterSrc: "",
    width: 2, height: 3, durationSeconds: 0, mimeType: "image/png", byteLength: 32,
    title: "x", alt: "", description: "", date: "", projectIds: [], workAreaIds: [],
    projectTypeIds: [], deliverableIds: [], tags: [], credits: [], showInCatalog: false,
    reusable: false, archived: false, ...overrides,
  };
}
function snapshotFetch({ record = uploadRecord(), sourceBytes = Buffer.from("png"), calls = [] } = {}) {
  const catalogSource = `${JSON.stringify(record, null, 2)}\n`;
  const fixed = new Map([
    [`src/content/media-catalog/uploads/${UUID}.json`, catalogSource],
    ["src/content/projects.json", "[]\n"],
    ["src/content/subproject-card-covers.json", "{}\n"],
    ["src/data/media/page-usage.generated.json", '{"records":[],"unresolved":[]}\n'],
    ["src/data/media/static-usage.generated.json", '{"bindings":[],"petCards":[]}\n'],
  ]);
  const fetchImpl = async (url, init = {}) => {
    const target = String(url); const method = init.method ?? "GET";
    calls.push({ target, method, body: init.body ? JSON.parse(init.body) : undefined });
    if (target === `${API}/git/ref/heads/content/text-cms`) return json({ object: { sha: "head-a" } });
    for (const [path, text] of fixed) {
      const encoded = path.split("/").map(encodeURIComponent).join("/");
      if (target.startsWith(`${API}/contents/${encoded}?ref=`)) return json({ sha: `blob-${path}`, encoding: "base64", content: b64(text) });
    }
    if (target.startsWith(`${API}/contents/public/media/catalog/${UUID}.png?ref=`)) {
      return json({ sha: "blob-source", encoding: "base64", content: sourceBytes.toString("base64") });
    }    if (target === `${API}/git/commits/head-a`) return json({ tree: { sha: "tree-a" } });
    if (target === `${API}/git/blobs` && method === "POST") return json({ sha: `blob-${calls.length}` }, 201);
    if (target === `${API}/git/trees` && method === "POST") return json({ sha: "tree-b" }, 201);
    if (target === `${API}/git/commits` && method === "POST") return json({ sha: "commit-b" }, 201);
    if (target === `${API}/git/refs/heads/content/text-cms` && method === "PATCH") {
      return json({ object: { sha: "commit-b" } });
    }
    throw new Error(`unexpected request: ${method} ${target}`);
  };
  return { fetchImpl, catalogSource, calls };
}

test("registered destructive identity is rejected before GitHub access", async () => {
  let calls = 0;
  const env = await runtime(async () => { calls += 1; throw new Error("GitHub must not be reached"); });
  const cookie = await login(env);
  const response = await worker.fetch(request("/api/media/delete", cookie, {
    assetId: "registered-a", expectedRevision: "r".repeat(64), expectedHead: "head-a",
  }), env);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /cms-owned|cms.*uuid/i);
  assert.equal(calls, 0);
});
test("CMS delete recomputes current blockers and ignores client usages", async () => {
  const calls = [];
  const snapshot = snapshotFetch({ record: uploadRecord({ showInCatalog: true }), calls });
  const env = await runtime(snapshot.fetchImpl);
  const cookie = await login(env);
  const revision = createHash("sha256").update(snapshot.catalogSource).digest("hex");
  const response = await worker.fetch(request("/api/media/delete", cookie, {
    assetId: ASSET_ID,
    expectedRevision: revision,
    expectedHead: "head-a",
    record: {
      id: ASSET_ID,
      filePath: `public/media/catalog/${UUID}.png`,
      catalogPath: `src/content/media-catalog/uploads/${UUID}.json`,
      usages: [],
    },
    usages: [],
  }), env);
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.ok(body.blockingUsages.some(({ kind }) => kind === "gallery"));
  assert.equal(calls.some(({ method }) => method === "PATCH"), false);
});
function png(width, height) {
  const bytes = new Uint8Array(32);
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
  bytes.set([0,0,0,0x0d,0x49,0x48,0x44,0x52], 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width); view.setUint32(20, height);
  return bytes;
}

test("CMS replace ignores caller paths and commits canonical binary plus metadata", async () => {
  const calls = [];
  const currentBytes = Buffer.from([9,8,7]);
  const snapshot = snapshotFetch({ sourceBytes: currentBytes, calls });
  const env = await runtime(snapshot.fetchImpl);
  const cookie = await login(env);
  const form = new FormData();
  form.set("metadata", JSON.stringify({
    assetId: ASSET_ID,
    asset: { id: ASSET_ID, filePath: "src/data/media/assets/index.ts" },
    expectedRevision: createHash("sha256").update(currentBytes).digest("hex"),
    expectedHead: "head-a",
  }));
  form.set("file", new File([png(640, 360)], "replacement.png", { type: "image/png" }));
  const response = await worker.fetch(new Request(`${ORIGIN}/api/media/replace`, {
    method: "POST", headers: { origin: ORIGIN, cookie }, body: form,
  }), env);
  assert.equal(response.status, 200);
  assert.equal(calls.some(({ target }) => target.includes("src/data/media/assets/index.ts")), false);
  const treeCall = calls.find(({ target, method }) => target === `${API}/git/trees` && method === "POST");
  assert.ok(treeCall);
  assert.equal(treeCall.body.tree.length, 2);
});