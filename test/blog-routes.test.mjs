import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createSiteInputs } from "../src/site/build/inputs.ts";
import { createBlogPageDefinitions } from "../src/site/blog/page-registry.ts";
import { prepareBlogEntryStubs } from "../tools/prepare-blog-entries.mjs";

const entry = (slug, published = true) => ({
  slug,
  title: slug,
  summary: `${slug} summary`,
  kind: "tool",
  published,
  publishedAt: "2026-08-30",
  tags: ["test"],
  body: "## Body",
});

test("blog page registry exposes only published content-derived routes", () => {
  const pages = createBlogPageDefinitions([entry("published"), entry("draft", false)]);
  assert.deepEqual(pages.map(({ id, type, path }) => ({ id, type, path })), [
    { id: "blog:published", type: "blog-post", path: "/blog/published/" },
  ]);
  assert.equal(pages[0].discovery.indexable, true);
});

test("blog entry preparation creates published Vite stubs and removes only stale owned stubs", async () => {
  const root = await mkdtemp(join(tmpdir(), "blog-routes-"));
  try {
    await mkdir(join(root, "blog", "unowned"), { recursive: true });
    await writeFile(join(root, "blog", "unowned", "index.html"), "<!doctype html><title>keep</title>");

    await prepareBlogEntryStubs(root, [entry("alpha"), entry("draft", false)]);
    const alpha = await readFile(join(root, "blog", "alpha", "index.html"), "utf8");
    assert.match(alpha, /GENERATED BLOG ENTRY/);
    await assert.rejects(access(join(root, "blog", "draft", "index.html")));

    const inputs = createSiteInputs(root);
    assert.equal(inputs["blog:alpha"], join(root, "blog", "alpha", "index.html"));

    await prepareBlogEntryStubs(root, [entry("beta")]);
    await assert.rejects(access(join(root, "blog", "alpha", "index.html")));
    assert.equal(await readFile(join(root, "blog", "unowned", "index.html"), "utf8"), "<!doctype html><title>keep</title>");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
