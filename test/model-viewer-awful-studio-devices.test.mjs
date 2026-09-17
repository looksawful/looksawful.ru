import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const story = readFileSync(new URL("../src/lab/stories/model-viewer-awful-studio-devices.stories.js", import.meta.url), "utf8");
const assetNames = [
  "iphone-17-v30.glb",
  "ipad-pro-11-m5-v6.glb",
  "ipad-pro-13-m5-v6.glb",
  "macbook-pro-14-m5-v1.glb",
  "profoto-d1-500-air.glb",
  "profoto-magnum-100624.glb",
  "studio-sandbag-01.glb",
  "studio-support-cstand-01.glb",
  "white-studio-v2.glb",
  "dark-neon-v2.glb",
  "loft-daylight-v2.glb",
];
const assets = assetNames.map((name) => `public/media/projects/awful-studio/model-viewer/${name}`);

test("AWFUL Studio Storybook exposes exactly the eleven canonical web 3D assets", () => {
  assets.forEach((path) => assert.equal(existsSync(new URL(path, root)), true, path));
  const actualGlbs = readdirSync(new URL("../public/media/projects/awful-studio/model-viewer/", import.meta.url))
    .filter((name) => name.endsWith(".glb"))
    .sort();
  assert.deepEqual(actualGlbs, [...assetNames].sort());
  assert.equal(existsSync(new URL("public/media/projects/awful-studio/device-viewer/iphone-17.glb", root)), false);
  assert.equal(existsSync(new URL("docs/awful-studio-device-viewer-v21.md", root)), false);
});

test("AWFUL Studio 3D stories identify final devices, studio rig and Scene Lab v2", () => {
  assert.match(story, /iPhone 17/);
  assert.match(story, /v30/);
  assert.match(story, /iPad Pro 11 M5/);
  assert.match(story, /MacBook Pro 14 M5/);
  assert.match(story, /Profoto D1 500 Air/);
  assert.match(story, /C-Stand/);
  assert.match(story, /MeshoptDecoder/);
  assert.match(story, /setMeshoptDecoder\(MeshoptDecoder\)/);
  assert.match(story, /White Studio/);
  assert.match(story, /Dark Neon/);
  assert.match(story, /Loft Daylight/);
  assert.doesNotMatch(story, /v21|v29/);
});
