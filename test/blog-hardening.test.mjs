import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderBlogMarkdown } from "../src/site/blog/markdown.ts";
import { validateBlogEntry } from "../src/site/blog/validation.ts";

const validFrontmatter = {
  title: "Media path test",
  summary: "Regression fixture.",
  kind: "tool",
  published: true,
  publishedAt: "2026-08-30",
  featured: false,
  tags: [],
};

function inputWithCover(src) {
  return {
    filePath: "src/content/blog/media-path-test.md",
    slug: "media-path-test",
    frontmatter: {
      ...validFrontmatter,
      cover: {
        src,
        alt: "Test image",
        width: 1600,
        height: 1000,
      },
    },
    body: "## Body\n\nText.",
  };
}

for (const escapedPath of [
  "/media/blog/../outside.webp",
  "/media/blog/%2e%2e/outside.webp",
  "/media/blog/%2E%2E/outside.webp",
]) {
  test(`cover rejects media path escaping blog directory: ${escapedPath}`, () => {
    assert.throws(
      () => validateBlogEntry(inputWithCover(escapedPath)),
      /\[blog\].*cover\.src.*media\/blog/i,
    );
  });

  test(`Markdown image rejects media path escaping blog directory: ${escapedPath}`, () => {
    assert.throws(
      () => renderBlogMarkdown(`![Test image](${escapedPath})`),
      /\[blog\].*image.*media\/blog/i,
    );
  });
}

test("short blog filter labels keep a 44px minimum inline hit target", async () => {
  const css = await readFile(new URL("../src/styles/blog.css", import.meta.url), "utf8");
  const rule = css.match(/\.blog-filter__button\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  assert.match(rule, /min-inline-size:\s*2\.75rem\s*;/);
});
