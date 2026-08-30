import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesBlogFilter,
  normalizeBlogSearch,
  parseBlogFilterState,
  serializeBlogFilterState,
} from "../src/components/blog-filter.ts";

test("blog search normalizes NFKC, surrounding whitespace and Russian casing", () => {
  assert.equal(normalizeBlogSearch("  СОМFYUI  "), "сомfyui");
  assert.equal(normalizeBlogSearch("ＡＩ"), "ai");
});

test("blog filter state accepts known kinds and falls back safely for unknown kinds", () => {
  assert.deepEqual(parseBlogFilterState("?type=tool&q=ComfyUI"), {
    kind: "tool",
    query: "ComfyUI",
  });

  assert.deepEqual(parseBlogFilterState("?type=unknown&q=%20AI%20"), {
    kind: "all",
    query: "AI",
  });
});

test("blog filter state serializes only meaningful URL parameters", () => {
  assert.equal(serializeBlogFilterState({ kind: "all", query: "" }), "");
  assert.equal(
    serializeBlogFilterState({ kind: "course", query: "CSS Grid" }),
    "type=course&q=CSS+Grid",
  );
});

test("blog cards match the category and normalized query as an intersection", () => {
  const candidate = {
    kind: "tool",
    searchText: "ComfyUI Ноды AI image generation",
  };

  assert.equal(matchesBlogFilter(candidate, { kind: "tool", query: "НОДЫ" }), true);
  assert.equal(matchesBlogFilter(candidate, { kind: "course", query: "ноды" }), false);
  assert.equal(matchesBlogFilter(candidate, { kind: "all", query: "video" }), false);
});
