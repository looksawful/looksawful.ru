import { retiredMediaAssetIds } from "../asset-aliases.ts";

import { awfulCasesMediaAssets } from "./awful-cases.ts";
import { behanceShootingMediaAssets } from "./behance-shootings.ts";
import { berryMediaAssets } from "./berry.ts";
import { berserkTimerMediaAssets } from "./berserk-timer.ts";
import { esmiMediaAssets } from "./esmi.ts";
import { evashaMediaAssets } from "./evasha.ts";
import { heroMediaAssets } from "./hero.ts";
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

/**
 * Complete legacy registry. Low-level catalog migration/validation may still
 * read retired records until the one-shot source cleanup removes them.
 */
export const registeredMediaAssets = [
  ...awfulCasesMediaAssets,
  ...behanceShootingMediaAssets,
  ...berryMediaAssets,
  ...berserkTimerMediaAssets,
  ...esmiMediaAssets,
  ...evashaMediaAssets,
  ...heroMediaAssets,
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

export type RegisteredMediaAsset = (typeof registeredMediaAssets)[number];
export type RegisteredMediaAssetId = RegisteredMediaAsset["id"];

/** Canonical runtime registry with reviewed duplicate identities removed. */
export const canonicalRegisteredMediaAssets = registeredMediaAssets.filter(
  (asset) => !retiredMediaAssetIds.has(asset.id),
) as readonly RegisteredMediaAsset[];
