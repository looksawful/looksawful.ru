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

export const mediaEntries = [
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

export type MediaEntryRecord = (typeof mediaEntries)[number];
export type MediaEntryId = MediaEntryRecord["id"];
