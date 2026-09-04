import { retiredMediaAssetIds } from "../asset-aliases.ts";

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

/**
 * Physical assets that predate the CMS media catalog.
 *
 * Their TypeScript modules remain authoritative for source paths and technical
 * identity. Retired duplicate identities are filtered by the reviewed alias map
 * until the one-shot source cleanup removes the obsolete declarations.
 */
const registeredMediaAssetSources = [
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

export type RegisteredMediaAssetSource = (typeof registeredMediaAssetSources)[number];

export const registeredMediaAssets = registeredMediaAssetSources.filter(
  (asset) => !retiredMediaAssetIds.has(asset.id),
) as readonly RegisteredMediaAssetSource[];

export type RegisteredMediaAsset = (typeof registeredMediaAssets)[number];
export type RegisteredMediaAssetId = RegisteredMediaAsset["id"];
