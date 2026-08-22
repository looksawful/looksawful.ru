import { awfulCasesMediaAssets } from "./awful-cases.ts";
import { berryMediaAssets } from "./berry.ts";
import { esmiMediaAssets } from "./esmi.ts";
import { evashaMediaAssets } from "./evasha.ts";
import { hypressionMediaAssets } from "./hypression.ts";
import { igguanaMediaAssets } from "./igguana.ts";
import { jesteiMediaAssets } from "./jestei.ts";
import { obladaetMediaAssets } from "./obladaet.ts";
import { ofeliaMediaAssets } from "./ofelia.ts";
import { sandsMediaAssets } from "./sands.ts";
import { sensetiqueMediaAssets } from "./sensetique.ts";
import { styxMediaAssets } from "./styx.ts";
import { unassignedMediaAssets } from "./unassigned.ts";

export const mediaAssets = [
  ...awfulCasesMediaAssets,
  ...berryMediaAssets,
  ...esmiMediaAssets,
  ...evashaMediaAssets,
  ...hypressionMediaAssets,
  ...igguanaMediaAssets,
  ...jesteiMediaAssets,
  ...obladaetMediaAssets,
  ...ofeliaMediaAssets,
  ...sandsMediaAssets,
  ...sensetiqueMediaAssets,
  ...styxMediaAssets,
  ...unassignedMediaAssets,
] as const;

export type MediaAssetRecord = (typeof mediaAssets)[number];
export type MediaAssetId = MediaAssetRecord["id"];
