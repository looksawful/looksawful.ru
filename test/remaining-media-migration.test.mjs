import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  jesteiInstagramPlayerStrip,
  jesteiPromoSequence,
} from "../src/data/content/jestei-pool.ts";
import {
  portfolioScanographyStrip,
  styxBrandLookbookReel,
  styxLookbook2025Reel,
  styxLookbookMasonryGroup,
  styxScanographyStrip,
} from "../src/data/content/styx.ts";
import {
  portfolioSensetiqueStrip,
  sensetiqueChapurinBentoGroup,
  sensetiqueDaniilKorotechenkovSequence,
  sensetiqueEditorialProductionReel,
  sensetiqueHarshLightStrip,
  sensetiqueInnaHonourReel,
  sensetiqueIvanKrushinskyEditorialStrip,
  sensetiqueKrasotaDressStrip,
  sensetiqueOlovoArchitectureStrip,
  sensetiqueOlovoCampaignStrip,
  sensetiqueOlovoLookbook2016Reel,
  sensetiqueOlovoLookbook2018Reel,
  sensetiqueRaputoEditorialStrip,
  sensetiqueStudioInfiniteStrip,
  sensetiqueTatianaNikishinaSupplementalReel,
  sensetiqueWoodMetalPanicStrip,
  sensetiqueYoungPioneerSequence,
  sensetiqueYoungPioneerStrip,
} from "../src/data/content/sensetique.ts";
import {
  portfolioShootingsStrip,
  shootingsEvashaCoverReel,
  shootingsEvashaPortraitReel,
  shootingsIgguanaMasonryGroup,
  shootingsObladaetCollageReel,
  shootingsObladaetMixedMediaReel,
  shootingsOfeliaStrip,
} from "../src/data/content/shootings.ts";
import { sandsLookbookStrip } from "../src/data/content/sands.ts";

const groups = [
  portfolioShootingsStrip,
  portfolioSensetiqueStrip,
  portfolioScanographyStrip,
  jesteiInstagramPlayerStrip,
  jesteiPromoSequence,
  styxBrandLookbookReel,
  styxLookbookMasonryGroup,
  styxScanographyStrip,
  styxLookbook2025Reel,
  sensetiqueStudioInfiniteStrip,
  sensetiqueRaputoEditorialStrip,
  sensetiqueKrasotaDressStrip,
  sensetiqueOlovoCampaignStrip,
  sensetiqueOlovoLookbook2016Reel,
  sensetiqueOlovoLookbook2018Reel,
  sensetiqueOlovoArchitectureStrip,
  sensetiqueChapurinBentoGroup,
  sensetiqueTatianaNikishinaSupplementalReel,
  sensetiqueIvanKrushinskyEditorialStrip,
  sensetiqueEditorialProductionReel,
  sensetiqueHarshLightStrip,
  sensetiqueYoungPioneerSequence,
  sensetiqueInnaHonourReel,
  sensetiqueYoungPioneerStrip,
  sensetiqueDaniilKorotechenkovSequence,
  sensetiqueWoodMetalPanicStrip,
  shootingsObladaetCollageReel,
  shootingsObladaetMixedMediaReel,
  shootingsEvashaPortraitReel,
  shootingsEvashaCoverReel,
  shootingsIgguanaMasonryGroup,
  shootingsOfeliaStrip,
  sandsLookbookStrip,
];

const expectedSlots = [
  "PORTFOLIO_SHOOTINGS_STRIP",
  "PORTFOLIO_SENSETIQUE_STRIP",
  "PORTFOLIO_SCANOGRAPHY_STRIP",
  "JESTEI_INSTAGRAM_PLAYER_STRIP",
  "JESTEI_PROMO_SEQUENCE",
  "STYX_BRAND_LOOKBOOK_REEL",
  "STYX_LOOKBOOK_MASONRY_GROUP",
  "STYX_SCANOGRAPHY_STRIP",
  "STYX_LOOKBOOK2025_REEL",
  "SENSETIQUE_STUDIO_INFINITE_STRIP",
  "SENSETIQUE_RAPUTO_EDITORIAL_STRIP",
  "SENSETIQUE_KRASOTA_DRESS_STRIP",
  "SENSETIQUE_OLOVO_CAMPAIGN_STRIP",
  "SENSETIQUE_OLOVO_LOOKBOOK2016_REEL",
  "SENSETIQUE_OLOVO_LOOKBOOK2018_REEL",
  "SENSETIQUE_OLOVO_ARCHITECTURE_STRIP",
  "SENSETIQUE_CHAPURIN_BENTO_GROUP",
  "SENSETIQUE_TATIANA_NIKISHINA_SUPPLEMENTAL_REEL",
  "SENSETIQUE_IVAN_KRUSHINSKY_EDITORIAL_STRIP",
  "SENSETIQUE_EDITORIAL_PRODUCTION_REEL",
  "SENSETIQUE_HARSH_LIGHT_STRIP",
  "SENSETIQUE_YOUNG_PIONEER_SEQUENCE",
  "SENSETIQUE_INNA_HONOUR_REEL",
  "SENSETIQUE_YOUNG_PIONEER_STRIP",
  "SENSETIQUE_DANIIL_KOROTECHENKOV_SEQUENCE",
  "SENSETIQUE_WOOD_METAL_PANIC_STRIP",
  "SHOOTINGS_OBLADAET_COLLAGE_REEL",
  "SHOOTINGS_OBLADAET_MIXED_MEDIA_REEL",
  "SHOOTINGS_EVASHA_PORTRAIT_REEL",
  "SHOOTINGS_EVASHA_COVER_REEL",
  "SHOOTINGS_IGGUANA_MASONRY_GROUP",
  "SHOOTINGS_OFELIA_STRIP",
  "SANDS_LOOKBOOK_STRIP",
];

test("remaining ordinary media groups are owned by typed content modules", () => {
  assert.equal(groups.length, 33);
  assert.equal(groups.every((group) => typeof group.layout === "string"), true);
});

test("index contains exactly one slot for every migrated group", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  for (const slot of expectedSlots) {
    const marker = `<!-- ${slot} -->`;
    assert.equal(html.split(marker).length - 1, 1, marker);
  }
});

test("temporary figure replacement bridge is gone after Jestei strip migration", async () => {
  const vite = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(vite, /replaceFigureContainingMedia/);
  assert.doesNotMatch(vite, /jesteiStoryMedia/);
});
