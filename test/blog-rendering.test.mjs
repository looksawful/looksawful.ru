import assert from "node:assert/strict";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderBlogIndexPage } from "../src/site/renderers/blog/blog-index.ts";
import { renderBlogPostPage } from "../src/site/renderers/blog/blog-post.ts";

const blogIndexPage = sitePages.find((page) => page.id === "blog");
assert.ok(blogIndexPage, "blog index page must exist in the site manifest");

const fixture = {
  slug: "test-tool",
  title: "Test tool",
  summary: "A useful test tool.",
  kind: "tool",
  published: true,
  publishedAt: "2026-08-30",
  updatedAt: "2026-08-30",
  featured: false,
  tags: ["css", "workflow"],
  cover: { src: "/media/blog/test.webp", alt: "Test cover", width: 1600, height: 1000 },
  sourceName: "Example",
  externalUrl: "https://example.com/",
  video: { provider: "youtube", id: "dQw4w9WgXcQ", title: "Test video" },
  body: "## Heading\n\nBody with **strong text**.\n\n![Inline visual](/media/blog/inline.webp)\n\n| Name | Value |\n| --- | --- |\n| alpha | beta |",
};

test("blog index renders an editorial progressively-enhanced feed with isolated assets", () => {
  const html = renderBlogIndexPage(blogIndexPage, [fixture]);
  assert.match(html, /data-blog-index/);
  assert.match(html, /<ol class="blog-feed/);
  assert.match(html, /href="\/blog\/test-tool\/"/);
  assert.match(html, /data-blog-kind="tool"/);
  assert.match(html, /data-blog-search=/);
  assert.match(html, /data-blog-filter-kind="all"/);
  assert.match(html, /<label[^>]+for="blog-search"/);
  assert.match(html, /\/src\/styles\/blog-entry\.css/);
  assert.match(html, /\/src\/blog\.ts/);
  assert.doesNotMatch(html, /\/src\/main\.js/);
});

test("blog filter controls expose a semantic labelled group", () => {
  const html = renderBlogIndexPage(blogIndexPage, [fixture]);
  assert.match(html, /role="group" aria-label="Тип материала"/);
});

test("blog article renders metadata, video fallback and BlogPosting SEO", () => {
  const html = renderBlogPostPage(fixture);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<article class="blog-post"/);
  assert.match(html, /<time datetime="2026-08-30"/);
  assert.match(html, /<h2>Heading<\/h2>/);
  assert.match(html, /data-blog-video/);
  assert.match(html, /youtube\.com\/watch\?v=dQw4w9WgXcQ/);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /property="og:type" content="article"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.looksawful\.ru\/blog\/test-tool\/"/);
});

test("blog Markdown images render as editorial figures", () => {
  const html = renderBlogPostPage(fixture);
  assert.match(html, /<figure class="blog-figure"><img src="\/media\/blog\/inline\.webp" alt="Inline visual"><\/figure>/);
});

test("blog Markdown tables render inside a keyboard-scrollable wrapper", () => {
  const html = renderBlogPostPage(fixture);
  assert.match(html, /<div class="blog-table" tabindex="0"><table>/);
  assert.match(html, /<\/table><\/div>/);
});
