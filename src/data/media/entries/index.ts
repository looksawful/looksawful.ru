import type { ProjectId } from "../../catalog/projects/index.ts";
import { resolveAssignedProjectIds } from "../project-assignments.ts";

import { awfulCasesMediaEntries } from "./awful-cases.ts";
import { berryMediaEntries } from "./berry.ts";
import { esmiMediaEntries } from "./esmi.ts";
import { evashaMediaEntries } from "./evasha.ts";
import { hypressionMediaEntries } from "./hypression.ts";
import { igguanaMediaEntries } from "./igguana.ts";
import { jesteiMediaEntries } from "./jestei.ts";
import { movesAwfulMediaEntries } from "./moves-awful.ts";
import { obladaetMediaEntries } from "./obladaet.ts";
import { ofeliaMediaEntries } from "./ofelia.ts";
import { sandsMediaEntries } from "./sands.ts";
import { sensetiqueMediaEntries } from "./sensetique.ts";
import { styxMediaEntries } from "./styx.ts";
import { unassignedMediaEntries } from "./unassigned.ts";

const rawMediaEntries = [
  ...awfulCasesMediaEntries,
  ...berryMediaEntries,
  ...esmiMediaEntries,
  ...evashaMediaEntries,
  ...hypressionMediaEntries,
  ...igguanaMediaEntries,
  ...jesteiMediaEntries,
  ...movesAwfulMediaEntries,
  ...obladaetMediaEntries,
  ...ofeliaMediaEntries,
  ...sandsMediaEntries,
  ...sensetiqueMediaEntries,
  ...styxMediaEntries,
  ...unassignedMediaEntries,
] as const;

export type MediaEntryId = (typeof rawMediaEntries)[number]["id"];
export type MediaEntryRecord = (typeof rawMediaEntries)[number] & {
  readonly projectIds?: readonly ProjectId[];
};

export const mediaEntries = rawMediaEntries.map((entry) => {
  const projectIds = resolveAssignedProjectIds(entry);

  return projectIds
    ? { ...entry, projectIds }
    : entry;
}) as readonly MediaEntryRecord[];
