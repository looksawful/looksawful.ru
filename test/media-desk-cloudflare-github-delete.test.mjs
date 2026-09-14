import assert from "node:assert/strict";
import test from "node:test";

import { commitRepositoryFiles } from "../tools/cloudflare/media-desk/github.mjs";

const API = "https://api.github.com/repos/looksawful/looksawful.ru";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("remote Media Desk deletes files through the same atomic content/text-cms commit", async () => {
  const calls = [];
  let refReads = 0;
  const fetchImpl = async (url, init = {}) => {
    const request = {
      url: String(url),
      method: init.method ?? "GET",
      body: init.body ? JSON.parse(init.body) : undefined,
    };
    calls.push(request);

    if (request.url === `${API}/git/ref/heads/content/text-cms`) {
      refReads += 1;
      return json({ object: { sha: "head-a" } });
    }
    if (request.url === `${API}/git/commits/head-a`) return json({ tree: { sha: "tree-a" } });
    if (request.url === `${API}/git/trees` && request.method === "POST") return json({ sha: "tree-b" }, 201);
    if (request.url === `${API}/git/commits` && request.method === "POST") return json({ sha: "commit-b" }, 201);
    if (request.url === `${API}/git/refs/heads/content/text-cms` && request.method === "PATCH") {
      return json({ object: { sha: "commit-b" } });
    }
    throw new Error(`unexpected request: ${request.method} ${request.url}`);
  };

  const result = await commitRepositoryFiles({
    token: "test-token",
    expectedHead: "head-a",
    files: [
      { path: "public/media/uploads/asset-a.webp", delete: true },
      { path: "src/content/media-catalog/uploads/asset-a.json", delete: true },
    ],
    message: "media(media-desk): delete asset-a",
    fetchImpl,
  });

  assert.deepEqual(result, { commitSha: "commit-b", branchHead: "commit-b" });
  assert.equal(refReads, 2);
  assert.equal(calls.some(({ url }) => url === `${API}/git/blobs`), false);
  const treeCall = calls.find(({ url, method }) => url === `${API}/git/trees` && method === "POST");
  assert.deepEqual(treeCall?.body.tree, [
    { path: "public/media/uploads/asset-a.webp", mode: "100644", type: "blob", sha: null },
    { path: "src/content/media-catalog/uploads/asset-a.json", mode: "100644", type: "blob", sha: null },
  ]);
});
