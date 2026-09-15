import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const story = readFileSync(new URL("../src/lab/stories/model-viewer-controls.stories.mjs", import.meta.url), "utf8");

test("model viewer lab prototype is presented as ordinary site media", () => {
  assert.match(story, /class="media mv-media"/);
  assert.match(story, /class="media__surface mv-stage"/);
});

test("model viewer lab prototype uses one neutral cube instead of demo sculpture", () => {
  assert.match(story, /new THREE\.BoxGeometry\(/);
  assert.doesNotMatch(story, /IcosahedronGeometry|TorusGeometry|CylinderGeometry/);
});
