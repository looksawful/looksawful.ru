import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { assembleTrustedPreviewRuntime } from "../tools/preview/assemble-trusted-runtime.mjs";

const REPOSITORY = "looksawful/looksawful.ru";
const SHA = "0123456789abcdef0123456789abcdef01234567";
const MEDIA_PATH = "media/projects/demo/master file.mov";
const EXPECTED_UPSTREAM = `https://raw.githubusercontent.com/looksawful/looksawful.ru/${SHA}/public/media/projects/demo/master%20file.mov`;

async function makeWorkspace(manifest) {
  const root = await mkdtemp(path.join(os.tmpdir(), "preview-media-proxy-"));
  const distDir = path.join(root, "dist");
  const trustedRuntimeDir = path.join(root, "runtime");
  const workspaceDir = path.join(root, "workspace");
  await mkdir(distDir, { recursive: true });
  await mkdir(path.join(trustedRuntimeDir, "functions", "_lib"), { recursive: true });
  await writeFile(path.join(distDir, "index.html"), "<!doctype html><title>preview</title>\n", "utf8");
  await writeFile(
    path.join(trustedRuntimeDir, "functions", "_middleware.js"),
    "export const onRequest = (context) => context.next();\n",
    "utf8",
  );
  await writeFile(
    path.join(trustedRuntimeDir, "functions", "_lib", "private-media-map.js"),
    "export const PRIVATE_MEDIA_UPSTREAMS = Object.freeze({});\n",
    "utf8",
  );
  if (manifest) {
    await writeFile(
      path.join(distDir, "preview-media-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
  }
  return { root, distDir, trustedRuntimeDir, workspaceDir };
}

test("trusted assembly ignores candidate upstream and rebuilds exact-SHA media allowlist", async () => {
  const { distDir, trustedRuntimeDir, workspaceDir } = await makeWorkspace({
    repository: REPOSITORY,
    headSha: SHA,
    limitBytes: 25 * 1024 * 1024,
    records: [
      {
        path: MEDIA_PATH,
        originalBytes: 30 * 1024 * 1024,
        handling: "authenticated-exact-sha-upstream",
        upstream: "https://evil.example/internal-metadata",
      },
      {
        path: "media/generated/video/demo/preview.mp4",
        originalBytes: 30 * 1024 * 1024,
        previewBytes: 12 * 1024 * 1024,
        handling: "preview-only-generated-video-surrogate",
      },
    ],
  });

  const result = await assembleTrustedPreviewRuntime({
    distDir,
    workspaceDir,
    trustedRuntimeDir,
    previewMetadata: { repository: REPOSITORY, sha: SHA },
  });

  const generated = await readFile(
    path.join(result.functionsDir, "_lib", "private-media-map.js"),
    "utf8",
  );
  assert.match(generated, /PRIVATE_MEDIA_UPSTREAMS/);
  assert.match(generated, /\/media\/projects\/demo\/master%20file\.mov/);
  assert.match(generated, new RegExp(EXPECTED_UPSTREAM.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(generated, /evil\.example/);
  assert.doesNotMatch(generated, /generated\/video\/demo\/preview/);
});

test("trusted assembly rejects media manifests for a different repository or SHA", async () => {
  for (const manifest of [
    { repository: "other/repository", headSha: SHA, limitBytes: 1, records: [] },
    { repository: REPOSITORY, headSha: "f".repeat(40), limitBytes: 1, records: [] },
  ]) {
    const { distDir, trustedRuntimeDir, workspaceDir } = await makeWorkspace(manifest);
    await assert.rejects(
      assembleTrustedPreviewRuntime({
        distDir,
        workspaceDir,
        trustedRuntimeDir,
        previewMetadata: { repository: REPOSITORY, sha: SHA },
      }),
      /media manifest.*mismatch/i,
    );
  }
});

test("private media proxy fetches only allowlisted exact path and forwards range safely", async () => {
  let proxyModule;
  try {
    proxyModule = await import("../tools/preview/runtime/functions/_lib/media-proxy.js");
  } catch (error) {
    assert.fail(`private media proxy helper must be importable: ${error.message}`);
  }

  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response("partial", {
      status: 206,
      headers: {
        "content-type": "video/quicktime",
        "content-range": "bytes 0-6/100",
        "accept-ranges": "bytes",
        "content-length": "7",
        etag: '"abc"',
        location: "https://evil.example/redirect",
        "set-cookie": "leak=1",
      },
    });
  };

  const request = new Request("https://v2-pr-801.example.test/media/projects/demo/master%20file.mov", {
    headers: {
      range: "bytes=0-6",
      cookie: "private=session",
      authorization: "Bearer should-not-forward",
    },
  });

  const response = await proxyModule.proxyPrivateMediaRequest({
    request,
    upstreams: { "/media/projects/demo/master%20file.mov": EXPECTED_UPSTREAM },
    fetchImpl,
  });

  assert.equal(response.status, 206);
  assert.equal(await response.text(), "partial");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, EXPECTED_UPSTREAM);
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(calls[0].init.headers.get("range"), "bytes=0-6");
  assert.equal(calls[0].init.headers.has("cookie"), false);
  assert.equal(calls[0].init.headers.has("authorization"), false);
  assert.equal(response.headers.get("content-range"), "bytes 0-6/100");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("location"), null);
});

test("private media proxy declines non-allowlisted paths without network access", async () => {
  let proxyModule;
  try {
    proxyModule = await import("../tools/preview/runtime/functions/_lib/media-proxy.js");
  } catch (error) {
    assert.fail(`private media proxy helper must be importable: ${error.message}`);
  }

  let fetched = false;
  const result = await proxyModule.proxyPrivateMediaRequest({
    request: new Request("https://v2-pr-801.example.test/media/projects/demo/not-allowed.mov"),
    upstreams: { "/media/projects/demo/master.mov": EXPECTED_UPSTREAM },
    fetchImpl: async () => {
      fetched = true;
      throw new Error("must not fetch");
    },
  });

  assert.equal(result, null);
  assert.equal(fetched, false);
});
