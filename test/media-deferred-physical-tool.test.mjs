import assert from "node:assert/strict";
import test from "node:test";

import {
  publicUrlForPhysicalPath,
  rewriteAssetDimensions,
} from "../tools/media/apply-deferred-physical-dedupe.mjs";

test("public physical paths convert to stable public URLs", () => {
  assert.equal(
    publicUrlForPhysicalPath("public/pets/awful-cases/assets/atlas.png"),
    "/pets/awful-cases/assets/atlas.png",
  );
  assert.equal(
    publicUrlForPhysicalPath("public/media/interactive/awful-cases-atlas.png"),
    "/media/interactive/awful-cases-atlas.png",
  );
});

test("quality promotion updates only the selected MediaAsset dimensions", () => {
  const source = `export const assets = [\n  { id: "target", type: "image", src: "/a.webp", width: 10, height: 20 },\n  { id: "other", type: "image", src: "/b.webp", width: 30, height: 40 },\n];\n`;
  const result = rewriteAssetDimensions(source, "fixture.ts", "target", 3264, 4896);

  assert.equal(result.matchCount, 1);
  assert.match(result.source, /id: "target"[\s\S]*width: 3264[\s\S]*height: 4896/);
  assert.match(result.source, /id: "other"[\s\S]*width: 30[\s\S]*height: 40/);
});
