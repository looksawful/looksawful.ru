import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  MAX_URLS_PER_SITEMAP,
  buildSitemapFiles,
  collectIndexableCanonicals,
  renderUrlset,
} from "../tools/generate-sitemap.mjs";

const page = (canonical, robots = "index,follow,max-image-preview:large") => `<!doctype html><html><head><title>x</title><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"></head><body>x</body></html>`;

async function withDist(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "sitemap-test-"));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

async function put(root, relative, content) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

test("sitemap discovers one root HTML URL", () => withDist(async (dir) => {
  await put(dir, "index.html", page("https://www.looksawful.ru/"));
  assert.deepEqual(await collectIndexableCanonicals(dir), ["https://www.looksawful.ru/"]);
}));

test("sitemap discovers nested index and .html pages", () => withDist(async (dir) => {
  await put(dir, "foo/index.html", page("https://www.looksawful.ru/foo/"));
  await put(dir, "foo/bar.html", page("https://www.looksawful.ru/foo/bar.html"));
  assert.deepEqual(await collectIndexableCanonicals(dir), [
    "https://www.looksawful.ru/foo/",
    "https://www.looksawful.ru/foo/bar.html",
  ]);
}));

test("sitemap excludes noindex and 404", () => withDist(async (dir) => {
  await put(dir, "index.html", page("https://www.looksawful.ru/"));
  await put(dir, "private/index.html", page("https://www.looksawful.ru/private/", "noindex,follow"));
  await put(dir, "404.html", "<!doctype html><title>404</title>");
  assert.deepEqual(await collectIndexableCanonicals(dir), ["https://www.looksawful.ru/"]);
}));

for (const [name, canonical, pattern] of [
  ["missing canonical", null, /missing production canonical/],
  ["wrong origin", "https://looksawful.ru/foo/", /origin must be/],
  ["canonical query", "https://www.looksawful.ru/foo/?x=1", /query or hash/],
  ["canonical hash", "https://www.looksawful.ru/foo/#x", /query or hash/],
]) {
  test(`sitemap fails on ${name}`, () => withDist(async (dir) => {
    const html = canonical ? page(canonical) : "<!doctype html><html><head><meta name=\"robots\" content=\"index,follow\"><title>x</title></head></html>";
    await put(dir, "index.html", html);
    await assert.rejects(() => collectIndexableCanonicals(dir), pattern);
  }));
}

test("sitemap fails on duplicate canonical", () => withDist(async (dir) => {
  await put(dir, "index.html", page("https://www.looksawful.ru/"));
  await put(dir, "copy.html", page("https://www.looksawful.ru/"));
  await assert.rejects(() => collectIndexableCanonicals(dir), /duplicate canonical/);
}));

test("sitemap XML escapes reserved characters", () => {
  const xml = renderUrlset(["https://www.looksawful.ru/a&b<'\""]);
  assert.match(xml, /&amp;/);
  assert.match(xml, /&lt;/);
  assert.match(xml, /&apos;/);
  assert.match(xml, /&quot;/);
});

test("45,000 URLs stay in one sitemap", () => {
  const urls = Array.from({ length: MAX_URLS_PER_SITEMAP }, (_, index) => `https://www.looksawful.ru/p/${index}/`);
  const files = buildSitemapFiles(urls);
  assert.deepEqual([...files.keys()], ["sitemap.xml"]);
  assert.match(files.get("sitemap.xml"), /<urlset/);
});

test("45,001 URLs produce sitemap index and chunks", () => {
  const urls = Array.from({ length: MAX_URLS_PER_SITEMAP + 1 }, (_, index) => `https://www.looksawful.ru/p/${index}/`);
  const files = buildSitemapFiles(urls);
  assert.deepEqual([...files.keys()], ["sitemap.xml", "sitemap-1.xml", "sitemap-2.xml"]);
  assert.match(files.get("sitemap.xml"), /<sitemapindex/);
  assert.match(files.get("sitemap-2.xml"), /<urlset/);
});
