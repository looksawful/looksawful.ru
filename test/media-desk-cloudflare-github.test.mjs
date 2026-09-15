import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDIA_DESK_AUTHORING_BRANCH,
  commitRepositoryFiles,
  readRepositoryFile,
} from "../tools/cloudflare/media-desk/github.mjs";

const REPOSITORY_API = "https://api.github.com/repos/looksawful/looksawful.ru";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("remote Media Desk authoring branch is permanently content/text-cms", () => {
  assert.equal(MEDIA_DESK_AUTHORING_BRANCH, "content/text-cms");
});

test("remote Media Desk reads exact content/text-cms bytes with source revision", async () => {
  const calls = [];
  const source = '{"title":"hello"}\n';
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? "GET" });
    if (String(url).includes("/git/ref/heads/content/text-cms")) {
      return json({ object: { sha: "head-a" } });
    }
    if (String(url).includes("/contents/")) {
      return json({
        sha: "blob-a",
        encoding: "base64",
        content: Buffer.from(source, "utf8").toString("base64"),
      });
    }
    throw new Error(`unexpected request: ${url}`);
  };

  const result = await readRepositoryFile({
    token: "test-token",
    path: "src/content/projects.json",
    fetchImpl,
  });

  assert.equal(result.text, source);
  assert.equal(result.blobSha, "blob-a");
  assert.equal(result.branchHead, "head-a");
  assert.match(result.revision, /^[a-f0-9]{64}$/);
  assert.ok(calls.every(({ url }) => !url.includes("/heads/dev") && !url.includes("/heads/prod")));
});

test("remote Media Desk rejects repository paths outside the media/content allowlist before network access", async () => {
  for (const path of [
    "../secrets.txt",
    ".github/workflows/pages.yml",
    "tools/ci/run-tests.mjs",
    "src/devtools/media-desk/main.ts",
  ]) {
    let calls = 0;
    await assert.rejects(
      () => commitRepositoryFiles({
        token: "test-token",
        expectedHead: "head-a",
        files: [{ path, content: "nope" }],
        message: "blocked",
        fetchImpl: async () => {
          calls += 1;
          throw new Error("network should not be reached");
        },
      }),
      /path.*not allowed|not allowed.*path/i,
    );
    assert.equal(calls, 0, `unsafe path reached network: ${path}`);
  }
});

test("remote Media Desk fails closed when content/text-cms head is stale", async () => {
  const calls = [];
  await assert.rejects(
    () => commitRepositoryFiles({
      token: "test-token",
      expectedHead: "head-a",
      files: [{ path: "src/content/projects.json", content: "{}\n" }],
      message: "content(media-desk): update navigation",
      fetchImpl: async (url, init = {}) => {
        calls.push({ url: String(url), method: init.method ?? "GET" });
        return json({ object: { sha: "head-b" } });
      },
    }),
    /stale branch head/i,
  );
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/git\/ref\/heads\/content\/text-cms$/);
});

test("remote Media Desk creates one fast-forward commit only on content/text-cms", async () => {
  const calls = [];
  let refReads = 0;
  const fetchImpl = async (url, init = {}) => {
    const request = {
      url: String(url),
      method: init.method ?? "GET",
      body: init.body ? JSON.parse(init.body) : undefined,
    };
    calls.push(request);

    if (request.url === `${REPOSITORY_API}/git/ref/heads/content/text-cms`) {
      refReads += 1;
      return json({ object: { sha: "head-a" } });
    }
    if (request.url === `${REPOSITORY_API}/git/commits/head-a`) {
      return json({ tree: { sha: "tree-a" } });
    }
    if (request.url === `${REPOSITORY_API}/git/blobs` && request.method === "POST") {
      return json({ sha: `blob-${calls.length}` }, 201);
    }
    if (request.url === `${REPOSITORY_API}/git/trees` && request.method === "POST") {
      return json({ sha: "tree-b" }, 201);
    }
    if (request.url === `${REPOSITORY_API}/git/commits` && request.method === "POST") {
      return json({ sha: "commit-b" }, 201);
    }
    if (request.url === `${REPOSITORY_API}/git/refs/heads/content/text-cms` && request.method === "PATCH") {
      return json({ object: { sha: "commit-b" } });
    }
    throw new Error(`unexpected request: ${request.method} ${request.url}`);
  };

  const result = await commitRepositoryFiles({
    token: "test-token",
    expectedHead: "head-a",
    files: [
      { path: "src/content/projects.json", content: '{"title":"next"}\n' },
      { path: "public/media/catalog/test.webp", content: new TextEncoder().encode("asset") },
    ],
    message: "content(media-desk): atomic update",
    fetchImpl,
  });

  assert.deepEqual(result, { commitSha: "commit-b", branchHead: "commit-b" });
  assert.equal(refReads, 2);
  assert.ok(calls.every(({ url }) => !url.includes("/heads/dev") && !url.includes("/heads/prod")));
  const patch = calls.find(({ method }) => method === "PATCH");
  assert.deepEqual(patch?.body, { sha: "commit-b", force: false });
});

test("remote writes are limited to CMS uploads, catalog binaries, and fixed cover sources", async () => {
  const forbidden = [
    "src/data/media/assets/index.ts",
    "src/content/navigation.json",
    "src/content/media-catalog/registered/a.json",
    "public/pets/awful-cases/a.webp",
  ];
  for (const path of forbidden) {
    let calls = 0;
    await assert.rejects(
      () => commitRepositoryFiles({
        token: "test-token",
        expectedHead: "head-a",
        files: [{ path, content: "nope" }],
        message: "blocked",
        fetchImpl: async () => { calls += 1; throw new Error("network should not be reached"); },
      }),
      /path.*not allowed|not allowed.*path/i,
    );
    assert.equal(calls, 0, path);
  }
});

test("exact-head reads pin content to immutable expected authoring SHA", async () => {
  assert.equal(typeof (await import("../tools/cloudflare/media-desk/github.mjs")).readRepositoryFileAtHead, "function");
  const { readRepositoryFileAtHead } = await import("../tools/cloudflare/media-desk/github.mjs");
  const calls = [];
  const result = await readRepositoryFileAtHead({
    token: "test-token",
    path: "src/content/projects.json",
    expectedHead: "head-a",
    fetchImpl: async (url) => {
      const target = String(url); calls.push(target);
      if (target.endsWith("/git/ref/heads/content/text-cms")) return json({ object: { sha: "head-a" } });
      if (target.includes("/contents/src/content/projects.json?ref=head-a")) return json({ sha: "blob-a", encoding: "base64", content: Buffer.from("[]\n").toString("base64") });
      throw new Error(`unexpected request: ${target}`);
    },
  });
  assert.equal(result.branchHead, "head-a");
  assert.ok(calls.some((url) => url.includes("?ref=head-a")));
  assert.ok(calls.every((url) => !url.includes("?ref=content%2Ftext-cms")));
});