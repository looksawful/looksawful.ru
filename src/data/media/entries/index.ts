import type { MediaEntryData } from "../../../types/media.ts";
import type { ProjectId } from "../../catalog/projects/index.ts";
import type { MediaAssetId } from "../assets/index.ts";
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

export type MediaEntryRecord = MediaEntryData<MediaAssetId, ProjectId> & {
  id: MediaEntryId;
};

const assignableMediaEntries = rawMediaEntries as readonly MediaEntryData<
  MediaAssetId,
  string
>[];

const sensetiqueGenericCaptionPrefixes = [
  "эдиториал",
  "лукбук",
  "кампейн",
  "фотосъемка",
  "спецпроект",
] as const;

function normalizeSensetiqueCaption(
  entry: MediaEntryData<MediaAssetId, string>,
): MediaEntryData<MediaAssetId, string> {
  if (!entry.id.startsWith("sensetique-") || !entry.caption?.title) {
    return entry;
  }

  const title = entry.caption.title;
  const normalizedTitle = title.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");

  let namedShootTitle: string | undefined;

  if (normalizedTitle.includes("harshlight") || normalizedTitle.includes("harsh light")) {
    namedShootTitle = "HARSH LIGHT";
  } else if (normalizedTitle.includes("young-pioneer")) {
    namedShootTitle = "Young-pioneer";
  } else if (normalizedTitle.includes("wood.metal.panic!")) {
    namedShootTitle = "Wood.Metal.PANIC!";
  } else if (
    normalizedTitle.includes("digital-fear-of-love")
    || normalizedTitle.includes("digital fear of love")
  ) {
    namedShootTitle = "Digital Fear of Love";
  }

  if (namedShootTitle) {
    return namedShootTitle === title
      ? entry
      : { ...entry, caption: { ...entry.caption, title: namedShootTitle } };
  }

  if (sensetiqueGenericCaptionPrefixes.some((prefix) => normalizedTitle.startsWith(prefix))) {
    const { title: _title, ...caption } = entry.caption;
    return { ...entry, caption };
  }

  return entry;
}

export const mediaEntries = assignableMediaEntries.map((entry) => {
  const normalizedEntry = normalizeSensetiqueCaption(entry);
  const projectIds = resolveAssignedProjectIds(normalizedEntry);

  return projectIds
    ? { ...normalizedEntry, projectIds }
    : normalizedEntry;
}) as readonly MediaEntryRecord[];