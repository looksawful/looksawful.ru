import { awfulCasesMediaAssets } from "./awful-cases.ts";
import { behanceShootingMediaAssets } from "./behance-shootings.ts";
import { berryMediaAssets } from "./berry.ts";
import { berserkTimerMediaAssets } from "./berserk-timer.ts";
import { esmiMediaAssets } from "./esmi.ts";
import { evashaMediaAssets } from "./evasha.ts";
import { hypressionMediaAssets } from "./hypression.ts";
import { igguanaMediaAssets } from "./igguana.ts";
import { jesteiMediaAssets } from "./jestei.ts";
import { obladaetMediaAssets } from "./obladaet.ts";
import { ofeliaMediaAssets } from "./ofelia.ts";
import { projectIndexMediaAssets } from "./project-index.ts";
import { sandsMediaAssets } from "./sands.ts";
import { sensetiqueMediaAssets } from "./sensetique.ts";
import { styxMediaAssets } from "./styx.ts";
import { unassignedMediaAssets } from "./unassigned.ts";

export const mediaAssets = [
  ...awfulCasesMediaAssets,
  ...behanceShootingMediaAssets,
  ...berryMediaAssets,
  ...berserkTimerMediaAssets,
  ...esmiMediaAssets,
  ...evashaMediaAssets,
  ...hypressionMediaAssets,
  ...igguanaMediaAssets,
  ...jesteiMediaAssets,
  ...obladaetMediaAssets,
  ...ofeliaMediaAssets,
  ...projectIndexMediaAssets,
  ...sandsMediaAssets,
  ...sensetiqueMediaAssets,
  ...styxMediaAssets,
  ...unassignedMediaAssets,
] as const;

export type MediaAssetRecord = (typeof mediaAssets)[number];
export type MediaAssetId = MediaAssetRecord["id"];
