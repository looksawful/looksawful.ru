import assert from "node:assert/strict";
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

test("remaining ordinary media groups are owned by typed content modules", () => {
  assert.equal(groups.length, 33);
  assert.equal(groups.every((group) => typeof group.layout === "string"), true);
});
