import type { MediaEntryData } from "../../../types/media.ts";
import type { ProjectId } from "../../catalog/projects/index.ts";
import type { MediaAssetId } from "../assets/index.ts";
import { resolveAssignedProjectIds } from "../project-assignments.ts";

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

export const mediaEntries = assignableMediaEntries.map((entry) => {
  const projectIds = resolveAssignedProjectIds(entry);

  return projectIds
    ? { ...entry, projectIds }
    : entry;
}) as readonly MediaEntryRecord[];
