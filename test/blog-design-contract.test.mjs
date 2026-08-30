import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderBlogCard } from "../src/site/renderers/blog/blog-card.ts";
import { renderBlogIndexPage } from "../src/site/renderers/blog/blog-index.ts";
import { renderBlogPostPage } from "../src/site/renderers/blog/blog-post.ts";

const blogIndexPage = sitePages.find((page) => page.id === "blog");
assert.ok(blogIndexPage, "blog index page must exist");

const baseEntry = {
  slug: "editorial-test",
  title: "Editorial test",
  summary: "A compact summary for the editorial design contract.",
  kind: "tutorial",
  published: true,
  publishedAt: "2026-08-30",
  featured: false,
  tags: ["design", "workflow"],
  body: "## Reading layer\n\nLong-form body.",
};

const cover = {
  src: "/media/blog/editorial-test.webp",
  alt: "Editorial test cover",
  width: 1600,
  height: 1000,
};

const video = {
  provider: "youtube",
  id: "dQw4w9WgXcQ",
  title: "Editorial test video",
};

test("video posts use the cover as the video poster instead of rendering two hero media blocks", () => {
  const html = renderBlogPostPage({ ...baseEntry, cover, video });

  assert.doesNotMatch(html, /class="blog-post__cover/);
  assert.match(html, /class="blog-video__poster"/);
  assert.match(html, /src="\/media\/blog\/editorial-test\.webp"/);
  assert.equal((html.match(/data-blog-video\b/g) ?? []).length >= 1, true);
});

test("non-video posts keep their standalone cover", () => {
  const html = renderBlogPostPage({ ...baseEntry, cover });
  assert.match(html, /class="blog-post__cover/);
});

test("article title stays in the site sans while the reading layer remains serif", async () => {
  const css = await readFile(new URL("../src/styles/blog.css", import.meta.url), "utf8");
  const titleRule = css.match(/\.blog-post__title\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const proseRule = css.match(/\.blog-prose\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(titleRule, /font-family:\s*var\(--ff-primary\)/);
  assert.match(proseRule, /font-family:\s*var\(--blog-serif\)/);
});

test("only the first featured entry receives the featured feed treatment", () => {
  const entries = [
    { ...baseEntry, slug: "featured-one", featured: true, cover },
    { ...baseEntry, slug: "featured-two", title: "Second featured", featured: true, cover },
    { ...baseEntry, slug: "ordinary", title: "Ordinary", kind: "note", featured: false },
  ];
  const html = renderBlogIndexPage(blogIndexPage, entries);

  assert.equal((html.match(/blog-card--featured/g) ?? []).length, 1);
  assert.match(html, /href="\/blog\/featured-one\/"[^>]*class="[^"]*blog-card--featured|class="[^"]*blog-card--featured[^"]*"[^>]*href="\/blog\/featured-one\/"/);
});

test("feed cards expose explicit media and text-only variants", () => {
  const mediaCard = renderBlogCard({ ...baseEntry, cover });
  const textCard = renderBlogCard({ ...baseEntry, slug: "text-only", kind: "note" });

  assert.match(mediaCard, /class="[^"]*blog-card--media/);
  assert.match(textCard, /class="[^"]*blog-card--text/);
});

test("blog index intro is pinned to the right half of the six-column editorial grid", async () => {
  const css = await readFile(new URL("../src/styles/blog.css", import.meta.url), "utf8");
  const introRule = css.match(/\.blog-index__intro\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(introRule, /grid-column:\s*4\s*\/\s*-1/);
});

test("editorial media, code and tables use Grid tracks to break out beyond the reading column", async () => {
  const css = await readFile(new URL("../src/styles/blog.css", import.meta.url), "utf8");
  const proseRule = css.match(/\.blog-prose\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const breakoutRule = css.match(/\.blog-prose\s*>\s*:is\([^)]*\.blog-figure[^)]*\.blog-table[^)]*\.blog-code[^)]*\)\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(proseRule, /grid-column:\s*1\s*\/\s*-1/);
  assert.match(proseRule, /grid-template-columns:\s*subgrid/);
  assert.match(breakoutRule, /grid-column:\s*1\s*\/\s*-1/);
  assert.match(breakoutRule, /inline-size:\s*100%/);
  assert.doesNotMatch(breakoutRule, /margin-inline:\s*calc/);
});
