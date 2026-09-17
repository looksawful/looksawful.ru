import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const storyUrl = new URL("../src/lab/stories/model-viewer-jestei-logo.stories.js", import.meta.url);

test("3D logo Storybook viewer is catalog-driven", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /logo3dCatalog/);
  assert.match(source, /status === "ready"/);
  assert.match(source, /entry\.modelUrl/);
  assert.match(source, /data-logo-3d-select/);
  assert.doesNotMatch(source, /const MODEL_URL/);
});

test("shared logo viewer keeps the existing fit, wireframe and fullscreen controls", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /wireframe/);
  assert.match(source, /data-jestei-action="fit"/);
  assert.match(source, /data-jestei-action="fullscreen"/);
  assert.match(source, /HDRLoader/);
});