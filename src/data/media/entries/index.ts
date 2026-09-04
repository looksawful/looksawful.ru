import type { MediaEntryData } from "../../../types/media.ts";
import type { ProjectId } from "../../catalog/projects/index.ts";
import { canonicalMediaAssetId } from "../asset-aliases.ts";
import type { MediaAssetId } from "../assets/index.ts";
import { mediaCatalogItems } from "../catalog.ts";
import {
  dedupeMediaUsageRecords,
  mediaUsageMetadataByEntryId,
} from "../usage-records.ts";

import { awfulCasesMediaEntries } from "./awful-cases.ts";
import { behanceShootingMediaEntries } from "./behance-shootings.ts";
import { berryMediaEntries } from "./berry.ts";
import { berserkTimerMediaEntries } from "./berserk-timer.ts";
import { esmiMediaEntries } from "./esmi.ts";
import { evashaMediaEntries } from "./evasha.ts";
import { hypressionMediaEntries } from "./hypression.ts";
import { igguanaMediaEntries } from "./igguana.ts";
import { jesteiMediaEntries } from "./jestei.ts";
import { movesAwfulMediaEntries } from "./moves-awful.ts";
import { obladaetMediaEntries } from "./obladaet.ts";
import { ofeliaMediaEntries } from "./ofelia.ts";
import { sandsMediaEntries } from "./sands.ts";
import { normalizeSensetiqueCaption } from "./sensetique-normalization.ts";
import { sensetiqueMediaEntries } from "./sensetique.ts";
import { normalizeStyxCaption } from "./styx-normalization.ts";
import { styxMediaEntries } from "./styx.ts";
import { unassignedMediaEntries } from "./unassigned.ts";

const rawMediaEntries = [
  ...awfulCasesMediaEntries,
  ...behanceShootingMediaEntries,
  ...berryMediaEntries,
  ...berserkTimerMediaEntries,
  ...esmiMediaEntries,
  ...evashaMediaEntries,
  ...hypressionMediaEntries,
  ...igguanaMediaEntries,
  ...jesteiMediaEntries,
  ...movesAwfulMediaEntries,
  ...obladaetMediaEntries,
  ...ofeliaMediaEntries,
  ...sandsMediaEntries,
  ...sensetiqueMediaEntries.map(normalizeSensetiqueCaption),
  ...styxMediaEntries.map(normalizeStyxCaption),
  ...unassignedMediaEntries,
] as const;

export type MediaEntryId = (typeof rawMediaEntries)[number]["id"];

export type MediaEntryRecord = MediaEntryData<MediaAssetId, ProjectId> & {
  id: MediaEntryId;
};

const assignableMediaEntries = rawMediaEntries as readonly MediaEntryData<
  MediaAssetId,
  string
>[];

const rawEntryById = new Map<string, MediaEntryData<MediaAssetId, string>>(
  assignableMediaEntries.map((entry) => [entry.id, entry] as const),
);

for (const record of dedupeMediaUsageRecords) {
  const entry = rawEntryById.get(record.entryId);
  if (!entry) {
    throw new Error(
      `Dedupe usage metadata references unknown MediaEntry "${record.entryId}"`,
    );
  }
  if (entry.assetId !== record.fromAssetId && entry.assetId !== record.toAssetId) {
    throw new Error(
      `Dedupe usage metadata for "${record.entryId}" expected asset "${record.fromAssetId}" or "${record.toAssetId}", got "${entry.assetId}"`,
    );
  }
}

const projectIdsByAssetId = new Map<string, readonly ProjectId[]>(
  mediaCatalogItems.map((item) => [item.asset.id, item.projectIds] as const),
);

export const mediaEntries = assignableMediaEntries.map((entry) => {
  const usageMetadata = mediaUsageMetadataByEntryId.get(entry.id);
  const assetId = canonicalMediaAssetId(entry.assetId) as MediaAssetId;

  const projectIds =
    usageMetadata?.projectIds !== undefined
      ? usageMetadata.projectIds
      : entry.projectIds !== undefined
        ? entry.projectIds
        : projectIdsByAssetId.get(assetId);

  const enrichedEntry = usageMetadata
    ? { ...entry, ...usageMetadata, assetId }
    : { ...entry, assetId };

  return projectIds !== undefined
    ? { ...enrichedEntry, projectIds }
    : enrichedEntry;
}) as readonly MediaEntryRecord[];
