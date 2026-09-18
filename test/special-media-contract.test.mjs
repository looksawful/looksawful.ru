import assert from "node:assert/strict";
import test from "node:test";

import * as jestei from "../src/data/content/jestei-pool.ts";
import * as styx from "../src/data/content/styx.ts";
import * as sensetique from "../src/data/content/sensetique.ts";
import * as shootings from "../src/data/content/shootings.ts";

const expectedExports = [
  [jestei, "jesteiBrandSystemGroup"],
  [jestei, "jesteiInterfaceGroup"],
  [styx, "styxProductionMediaGroup"],
  [styx, "styxGiftCertificateSlider"],
  [sensetique, "sensetiqueStudioJustifiedGallery"],
  [sensetique, "sensetiqueHarshLightSlider"],
  [sensetique, "sensetiqueKrasotaDressVideo"],
  [sensetique, "sensetiqueOlovoBackstageVideo"],
  [shootings, "shootingsObladaetPairGroup"],
  [shootings, "shootingsEvashaPairFigure"],
];

test("special media content is owned by typed production modules", () => {
  for (const [module, name] of expectedExports) {
    assert.notEqual(module[name], undefined, name);
  }
});
