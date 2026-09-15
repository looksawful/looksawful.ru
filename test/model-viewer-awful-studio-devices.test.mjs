import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const story = readFileSync(new URL("../src/lab/stories/model-viewer-awful-studio-devices.stories.js", import.meta.url), "utf8");
const assets = [
  "public/media/projects/awful-studio/device-viewer/iphone-17.glb",
  "public/media/projects/awful-studio/device-viewer/ipad-pro-11.glb",
  "public/media/projects/awful-studio/device-viewer/ipad-pro-13.glb",
  "public/media/projects/awful-studio/device-viewer/macbook-pro-14.glb",
];

test("AWFUL Studio device viewer ships four local GLB assets", () => {
  assets.forEach((path) => assert.equal(existsSync(new URL(path, root)), true, path));
});

test("AWFUL Studio device stories use the ordinary media shell and event-driven rendering", () => {
  assert.match(story, /className = "media mv-device-story"/);
  assert.match(story, /data-device-canvas/);
  assert.match(story, /ensureEdges/);
  assert.match(story, /RoomEnvironment/);
  assert.doesNotMatch(story, /HDRLoader|white-studio-04|requestAnimationFrame/);
});
