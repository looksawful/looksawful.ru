import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

const expectedSlots = [
  "JESTEI_BRAND_SYSTEM_GROUP",
  "JESTEI_INTERFACE_GROUP",
  "STYX_PRODUCTION_MEDIA_GROUP",
  "STYX_GIFT_CERTIFICATE_SLIDER",
  "SENSETIQUE_STUDIO_JUSTIFIED_GALLERY",
  "SENSETIQUE_HARSH_LIGHT_SLIDER",
  "SENSETIQUE_KRASOTA_DRESS_VIDEO",
  "SENSETIQUE_OLOVO_BACKSTAGE_VIDEO",
  "SHOOTINGS_OBLADAET_PAIR_GROUP",
  "SHOOTINGS_EVASHA_PAIR_FIGURE",
];

test("special media content is owned by typed production modules", () => {
  for (const [module, name] of expectedExports) {
    assert.notEqual(module[name], undefined, name);
  }
});

test("index uses one production slot for every migrated special media component", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  for (const slot of expectedSlots) {
    const marker = `<!-- ${slot} -->`;
    assert.equal(html.split(marker).length - 1, 1, marker);
  }
});

test("site composition renders every migrated special media slot", async () => {
  const composition = await readFile(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );

  for (const slot of expectedSlots) {
    const marker = `<!-- ${slot} -->`;
    assert.equal(composition.split(marker).length - 1, 1, marker);
  }

  assert.match(composition, /renderMediaSlider/);
  assert.match(composition, /renderJustifiedGallery/);
});
