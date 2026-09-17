import test from "node:test";
import assert from "node:assert/strict";

import { logo3dCatalog, logo3dMaterials } from "../src/lab/data/logo-3d-catalog.mjs";

const byId = new Map(logo3dCatalog.map((entry) => [entry.id, entry]));

test("3D logo catalog covers every explicitly requested family", () => {
  for (const id of [
    "jestei-symbol-metal",
    "jestei-wordmark-metal",
    "jestei-lockup-metal",
    "styx-monogram-metal",
    "styx-wordmark-metal",
    "awfulface-metal",
    "sensetique-metal",
    "s-and-s-metal",
    "line-metal",
    "progress-tradition-metal",
    "illumihand-metal",
    "lyve-moscow-metal",
  ]) {
    assert.ok(byId.has(id), `missing required 3D logo: ${id}`);
  }
});

test("Jestei has symbol, wordmark and lockup for every brand colorway", () => {
  for (const colorway of ["pear", "orange", "blue", "biloba"]) {
    for (const variant of ["symbol", "wordmark", "lockup"]) {
      const item = byId.get(`jestei-${variant}-${colorway}`);
      assert.ok(item, `missing Jestei ${variant} ${colorway}`);
      assert.equal(logo3dMaterials[item.materialId]?.kind, "plastic");
    }
  }
});test("Jestei brand material values stay canonical", () => {
  const expected = new Map([
    ["jestei-pear-plastic", "#D1E231"],
    ["jestei-orange-plastic", "#F18200"],
    ["jestei-blue-plastic", "#147AFF"],
    ["jestei-biloba-plastic", "#B19FE9"],
  ]);
  for (const [id, color] of expected) {
    const material = logo3dMaterials[id];
    assert.equal(material.color.toUpperCase(), color);
    assert.equal(material.metalness, 0.05);
    assert.equal(material.roughness, 0.3);
  }
});

test("source blockers are explicit and Awfulface uses the canonical static SVG", () => {
  assert.equal(byId.get("awfulface-metal")?.sourceUrl, "/favicon.svg");
  assert.equal(byId.get("styx-wordmark-metal")?.status, "source-recovery-required");
  assert.equal(byId.get("line-metal")?.status, "source-recovery-required");
  assert.equal(byId.get("progress-tradition-metal")?.status, "source-recovery-required");
  assert.equal(byId.get("s-and-s-metal")?.status, "source-missing");
  assert.equal(byId.get("illumihand-metal")?.status, "source-missing");
});
test("ready Jestei symbol points at the production GLB that ships with Lab", () => {
  assert.equal(
    byId.get("jestei-symbol-metal")?.modelUrl,
    "/media/logo-3d/jestei/jestei-symbol-metal.glb",
  );
});
