import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const story = readFileSync(new URL("../src/lab/stories/model-viewer-awful-studio-devices.stories.js", import.meta.url), "utf8");
const assets = [
  "iphone-17-v30.glb",
  "ipad-pro-11-m5-v6.glb",
  "ipad-pro-13-m5-v6.glb",
  "macbook-pro-14-m5-v1.glb",
  "profoto-d1-500-air.glb",
  "profoto-magnum-100624.glb",
  "studio-sandbag-01.glb",
  "studio-support-cstand-01.glb",
].map((name) => `public/media/projects/awful-studio/model-viewer/${name}`);

test("AWFUL Studio Storybook exposes exactly the eight current web 3D assets", () => {
  assets.forEach((path) => assert.equal(existsSync(new URL(path, root)), true, path));
  assert.equal(existsSync(new URL("public/media/projects/awful-studio/device-viewer/iphone-17.glb", root)), false);
});

test("AWFUL Studio 3D stories identify the final device revisions and studio rig", () => {
  assert.match(story, /iPhone 17 · v30/);
  assert.match(story, /iPad Pro 11 M5 · v6/);
  assert.match(story, /MacBook Pro 14 M5 · v1/);
  assert.match(story, /Profoto D1 500 Air/);
  assert.match(story, /C-Stand/);
  assert.doesNotMatch(story, /v21|v29/);
});
