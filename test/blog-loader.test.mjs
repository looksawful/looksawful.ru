import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  getPublishedBlogEntries,
  loadBlogEntries,
  parseBlogDocument,
} from "../src/site/blog/loader.ts";
import { renderBlogMarkdown } from "../src/site/blog/markdown.ts";

const validSource = `---
title: Test tool
summary: Test summary
kind: tool
published: true
publishedAt: 2026-08-30
tags:
  - css
---

## Heading

Body with **strong** text.
`;

test("blog loader parses YAML frontmatter and derives the route slug from filename", () => {
  const entry = parseBlogDocument({
    filePath: "src/content/blog/test-tool.md",
    source: validSource,
  });

  assert.equal(entry.slug, "test-tool");
  assert.equal(entry.title, "Test tool");
  assert.equal(entry.body.startsWith("## Heading"), true);
});

test("blog loader is deterministic and published entries are newest first", async () => {
  const directory = await mkdtemp(join(tmpdir(), "blog-loader-"));

  try {
    await writeFile(
      join(directory, "older.md"),
      validSource.replace("Test tool", "Older").replace("2026-08-30", "2026-08-29"),
    );
    await writeFile(join(directory, "newer.md"), validSource.replace("Test tool", "Newer"));
    await writeFile(
      join(directory, "draft.md"),
      validSource.replace("Test tool", "Draft").replace("published: true", "published: false"),
    );

    const entries = await loadBlogEntries(directory);

    assert.deepEqual(entries.map((entry) => entry.slug), ["draft", "newer", "older"]);
    assert.deepEqual(
      getPublishedBlogEntries(entries).map((entry) => entry.slug),
      ["newer", "older"],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("frontmatter cannot author a slug because the filename owns routing", () => {
  assert.throws(
    () => parseBlogDocument({
      filePath: "src/content/blog/test-tool.md",
      source: validSource.replace(
        "title: Test tool",
        "slug: other-route\ntitle: Test tool",
      ),
    }),
    /\[blog\].*slug.*frontmatter/i,
  );
});

test("blog Markdown renders semantic content and rejects raw HTML", () => {
  const html = renderBlogMarkdown("## Heading\n\nText with `code` and **strong**.");

  assert.match(html, /<h2>Heading<\/h2>/);
  assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<strong>strong<\/strong>/);
  assert.throws(
    () => renderBlogMarkdown("<script>alert(1)</script>"),
    /raw html/i,
  );
});
