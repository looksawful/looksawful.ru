import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("shared runtime services have one canonical namespace boundary", () => {
  const source = readFileSync("src/components/runtime/index.ts", "utf8");

  for (const runtime of [
    "motion-preference",
    "infinite-reel",
    "media-deck",
    "media-lightbox",
    "media-caption-numbering",
  ]) {
    assert.match(source, new RegExp(`../${runtime}\\.ts`));
  }

  assert.doesNotMatch(source, /awful-cases-game/);
  assert.doesNotMatch(source, /animated-canvas-gallery/);
  assert.doesNotMatch(source, /jestei-theme-organism/);
});
