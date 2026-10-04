import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const stories = readFileSync(new URL("../src/lab/stories/layout-patterns.stories.mjs", import.meta.url), "utf8");

const primitives = [
  "wrapper",
  "prose",
  "text-pair",
  "stack",
  "cluster",
  "pile",
  "grid",
  "auto-grid",
  "split",
  "split-always",
  "editorial-grid",
  "reel",
];

test("every shared layout primitive has a canonical Storybook specimen", () => {
  for (const primitive of primitives) {
    assert.match(patterns, new RegExp(`\\.${primitive.replace("-", "\\-")}\\b`), `missing CSS primitive: ${primitive}`);
    assert.match(stories, new RegExp(`class="[^"]*\\b${primitive.replace("-", "\\-")}\\b[^"]*"`), `missing Storybook specimen: ${primitive}`);
  }
});

test("split-always story documents its non-prose boundary", () => {
  assert.match(stories, /Split Always is reserved for explicit two-part compositions/);
  assert.match(stories, /must never turn separate prose paragraphs into layout columns/);
});
