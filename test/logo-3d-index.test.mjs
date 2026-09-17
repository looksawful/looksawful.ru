import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile(new URL("../tools/logo-3d/logo-3d-manifest.json", import.meta.url), "utf8"));
const index = JSON.parse(await readFile(new URL("../public/media/logo-3d/index.json", import.meta.url), "utf8"));

test("3D logo public index covers every ready vector-backed pack", () => {
  const expected = manifest.targets.filter((target) => target.sourceType === "vector-svg" && target.status === "ready");
  assert.equal(index.items.length, expected.length);
  assert.deepEqual(new Set(index.items.map((item) => item.id)), new Set(expected.map((item) => item.id)));
});

test("3D logo public index exposes portable files, preview and provenance", () => {
  for (const item of index.items) {
    assert.deepEqual(Object.keys(item.files).sort(), ["fbx", "glb", "obj", "stl"].sort());
    assert.ok(!("blend" in item.files), "Blender masters must stay outside the public index");
    assert.match(item.preview, /\.png$/);
    assert.match(item.metadata, /\.json$/);
    assert.ok(item.source);
  }
});