import test from "node:test";
import assert from "node:assert/strict";

import { logo3dCatalog, logo3dMaterials } from "../src/lab/data/logo-3d-catalog.mjs";

test("3D logo catalog covers the required logo families and Styx variants", () => {
  const ids = new Set(logo3dCatalog.map((entry) => entry.id));
  for (const id of [
    "jestei-symbol-metal",
    "jestei-wordmark-metal",
    "jestei-lockup-metal",
    "styx-monogram-metal",
    "styx-wordmark-metal",
    "awfulface-metal",
    "sensetique-metal",
    "lyve-moscow-metal",
  ]) {
    assert.ok(ids.has(id), `missing required 3D logo: ${id}`);
  }
});

test("Jestei brand colorways use plastic material presets", () => {
  const expected = new Map([
    ["jestei-pear-plastic", "#B7E44A"],
    ["jestei-orange-plastic", "#FF5A1F"],
    ["jestei-blue-plastic", "#2357FF"],
    ["jestei-biloba-plastic", "#C7A6FF"],
  ]);

  for (const [id, color] of expected) {
    const material = logo3dMaterials[id];
    assert.ok(material, `missing material ${id}`);
    assert.equal(material.kind, "plastic");
    assert.equal(material.color.toUpperCase(), color);
    assert.ok(material.metalness <= 0.1);
    assert.ok(material.roughness >= 0.2);
  }
});
