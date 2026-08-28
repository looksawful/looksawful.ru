import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkLocalLinks } from "../tools/check-local-links.mjs";

async function withDist(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "local-links-test-"));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

async function put(root, relative, content = "x") {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

const html = (body) => `<!doctype html><html><head><title>x</title></head><body>${body}</body></html>`;

test("existing relative and root-relative images pass", () => withDist(async (dir) => {
  await put(dir, "assets/a.webp");
  await put(dir, "nested/b.webp");
  await put(dir, "nested/index.html", html('<img src="../assets/a.webp"><img src="/nested/b.webp">'));
  await checkLocalLinks({ distDir: dir });
}));

test("missing image fails with source, attribute, URL and expected path", () => withDist(async (dir) => {
  await put(dir, "index.html", html('<img src="/missing.webp">'));
  await assert.rejects(() => checkLocalLinks({ distDir: dir }), /index\.html \| src \| \/missing\.webp \| expected missing\.webp/);
}));

test("directory index, same-origin absolute URL, query and hash pass", () => withDist(async (dir) => {
  await put(dir, "foo/index.html", html('<div id="target">ok</div>'));
  await put(dir, "index.html", html('<a href="/foo/">a</a><a href="https://www.looksawful.ru/foo/index.html?x=1#target">b</a>'));
  await checkLocalLinks({ distDir: dir });
}));

test("existing hash anchor passes and missing hash anchor fails", () => withDist(async (dir) => {
  await put(dir, "index.html", html('<a href="#exists">ok</a><div id="exists"></div>'));
  await checkLocalLinks({ distDir: dir });
  await put(dir, "index.html", html('<a href="#missing">bad</a>'));
  await assert.rejects(() => checkLocalLinks({ distDir: dir }), /missing anchor #missing/);
}));

test("srcset 1x/2x and width descriptors pass", () => withDist(async (dir) => {
  for (const name of ["a.webp", "a@2.webp", "b480.webp", "b960.webp"]) await put(dir, `img/${name}`);
  await put(dir, "index.html", html('<img src="/img/a.webp" srcset="/img/a.webp 1x, /img/a@2.webp 2x"><img src="/img/b480.webp" srcset="/img/b480.webp 480w, /img/b960.webp 960w">'));
  await checkLocalLinks({ distDir: dir });
}));

test("query/hash assets resolve before filesystem checks", () => withDist(async (dir) => {
  await put(dir, "asset.js");
  await put(dir, "index.html", html('<script src="/asset.js?v=1#x"></script>'));
  await checkLocalLinks({ distDir: dir });
}));

test("mailto and external URLs are ignored", () => withDist(async (dir) => {
  await put(dir, "index.html", html('<a href="mailto:i@example.com">mail</a><a href="https://example.com/missing">external</a>'));
  await checkLocalLinks({ distDir: dir });
}));
