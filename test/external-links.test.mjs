import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkExternalLinks } from "../tools/check-external-links.mjs";

test("external link checker confirms a HEAD/Range 404 with a normal GET before declaring a link broken", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "external-links-"));
  const distDir = path.join(root, "dist");
  const outputDir = path.join(root, "artifacts");
  await mkdir(distDir, { recursive: true });
  await writeFile(
    path.join(distDir, "index.html"),
    '<a href="https://example.test/live">live</a>\n',
    "utf8",
  );

  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (_url, options = {}) => {
    const method = options.method ?? "GET";
    const headers = new Headers(options.headers);
    const range = headers.get("Range");
    calls.push({ method, range });

    if (method === "HEAD") return new Response(null, { status: 404 });
    if (range) return new Response(null, { status: 404 });
    return new Response("ok", { status: 200 });
  };

  try {
    const report = await checkExternalLinks({ distDir, outputDir });
    assert.equal(report.summary.broken, 0);
    assert.equal(report.summary.ok, 1);
    assert.deepEqual(calls, [
      { method: "HEAD", range: null },
      { method: "GET", range: null },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});
