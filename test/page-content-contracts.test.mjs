import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTENT_BLOCK_TYPES,
  SECTION_TYPES,
} from "../src/content/contracts/index.ts";

test("PageContent contracts expose the canonical closed vocabularies", () => {
  assert.deepEqual(CONTENT_BLOCK_TYPES, [
    "media-figure",
    "media-group",
    "media-slider",
    "mockup",
    "mockup-deck",
    "justified-gallery",
    "before-after",
    "page-flip",
    "animated-canvas-gallery",
    "jestei-theme",
  ]);

  assert.deepEqual(SECTION_TYPES, [
    "content",
    "project",
    "project-group",
    "specialized",
  ]);

  assert.equal(CONTENT_BLOCK_TYPES.includes("custom"), false);
  assert.equal(SECTION_TYPES.includes("custom"), false);
});
