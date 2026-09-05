import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkExternalLinks } from "../tools/check-external-links.mjs";

async function createFixture(hrefs) {
  const root = await mkdtemp(path.join(os.tmpdir(), "external-links-"));
  const distDir = path.join(root, "dist");
  const outputDir = path.join(root, "artifacts");
  await mkdir(distDir, { recursive: true });
  await writeFile(
    path.join(distDir, "index.html"),
    `${hrefs.map((href) => `<a href="${href}">link</a>`).join("\n")}\n`,
    "utf8",
  );
  return { root, distDir, outputDir };
}

test("failed HEAD falls back to an ordinary GET without a Range header", async () => {
  const fixture = await createFixture(["https://example.test/live"]);
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
    const report = await checkExternalLinks({ distDir: fixture.distDir, outputDir: fixture.outputDir });
    assert.equal(report.summary.broken, 0);
    assert.equal(report.summary.ok, 1);
    assert.deepEqual(calls, [
      { method: "HEAD", range: null },
      { method: "GET", range: null },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("only exact known GitHub-runner false 404 URLs are warnings", async () => {
  const jestei = "https://jesteipool.ru/event/playlist/ochag";
  const characterCount = "https://www.charactercountonline.com/ru/";
  const actuallyMissing = "https://example.test/missing";
  const fixture = await createFixture([jestei, characterCount, actuallyMissing]);
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(null, { status: 404 });

  try {
    const report = await checkExternalLinks({ distDir: fixture.distDir, outputDir: fixture.outputDir });
    assert.equal(report.summary.warnings, 2);
    assert.equal(report.summary.broken, 1);

    const byUrl = new Map(report.results.map((item) => [item.url, item]));
    for (const url of [jestei, characterCount]) {
      assert.equal(byUrl.get(url)?.classification, "runner-false-404");
      assert.equal(byUrl.get(url)?.severity, "warning");
    }
    assert.equal(byUrl.get(actuallyMissing)?.classification, "broken");
    assert.equal(byUrl.get(actuallyMissing)?.severity, "broken");
  } finally {
    globalThis.fetch = originalFetch;
    await rm(fixture.root, { recursive: true, force: true });
  }
});
