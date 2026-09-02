import overviewSource from "../../content/collections/shootings.json" with { type: "json" };
import ankaModelTestsSource from "../../content/shootings/shootings-behance-anka-model-tests.json" with { type: "json" };
import chooseYourCharacterSource from "../../content/shootings/shootings-behance-choose-your-character.json" with { type: "json" };
import cinemaStillsSource from "../../content/shootings/shootings-behance-cinema-stills-2.json" with { type: "json" };
import ecobasikSource from "../../content/shootings/shootings-behance-ecobasik.json" with { type: "json" };
import editorialPhotographySource from "../../content/shootings/shootings-behance-editorial-photography.json" with { type: "json" };
import offmiSource from "../../content/shootings/shootings-behance-offmi.json" with { type: "json" };
import berryEditorialSource from "../../content/shootings/shootings-berry-editorial.json" with { type: "json" };
import berryLookbookSource from "../../content/shootings/shootings-berry-lookbook.json" with { type: "json" };
import berryModelTestsSource from "../../content/shootings/shootings-berry-model-tests.json" with { type: "json" };
import berryProductSource from "../../content/shootings/shootings-berry-product.json" with { type: "json" };
import esmiSource from "../../content/shootings/shootings-esmi.json" with { type: "json" };
import evashaSource from "../../content/shootings/shootings-evasha.json" with { type: "json" };
import hypressionSource from "../../content/shootings/shootings-hypression.json" with { type: "json" };
import igguanaSource from "../../content/shootings/shootings-igguana.json" with { type: "json" };
import obladaetSource from "../../content/shootings/shootings-obladaet.json" with { type: "json" };
import ofeliaSource from "../../content/shootings/shootings-ofelia.json" with { type: "json" };

import {
  expectAllowedKeys,
  expectKnownId,
  expectRecord,
  readEditorialText,
} from "./editorial-validation.ts";

export const SHOOTING_RECORD_IDS = [
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-berry-model-tests",
  "shootings-berry-editorial",
  "shootings-berry-lookbook",
  "shootings-berry-product",
  "shootings-behance-ecobasik",
  "shootings-behance-offmi",
  "shootings-behance-cinema-stills-2",
  "shootings-behance-anka-model-tests",
  "shootings-behance-choose-your-character",
  "shootings-behance-editorial-photography",
] as const;

export type ShootingRecordId = (typeof SHOOTING_RECORD_IDS)[number];

export interface ShootingsOverview {
  head: string;
  title: string;
  role: string;
  summary: string;
  lead: string;
}

export interface ShootingEditorialRecord {
  id: ShootingRecordId;
  title: string;
  date: string;
  description: string;
}

export function parseShootingsOverview(value: unknown): ShootingsOverview {
  const label = "Shootings overview";
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["head", "title", "role", "summary", "lead"], [], label);

  return {
    head: readEditorialText(record.head, `${label}.head`),
    title: readEditorialText(record.title, `${label}.title`),
    role: readEditorialText(record.role, `${label}.role`),
    summary: readEditorialText(record.summary, `${label}.summary`),
    lead: readEditorialText(record.lead, `${label}.lead`),
  };
}

export function parseShootingEditorialRecord(value: unknown): ShootingEditorialRecord {
  const label = "Shooting editorial record";
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "date", "description"], ["id"], label);
  const id = expectKnownId(record.id, SHOOTING_RECORD_IDS, `${label}.id`);

  return {
    id,
    title: readEditorialText(record.title, `${label}.title`),
    date: readEditorialText(record.date, `${label}.date`),
    description: readEditorialText(record.description, `${label}.description`),
  };
}

function normalizeRecords(values: readonly unknown[]): readonly ShootingEditorialRecord[] {
  const byId = new Map<ShootingRecordId, ShootingEditorialRecord>();
  for (const value of values) {
    const record = parseShootingEditorialRecord(value);
    if (byId.has(record.id)) {
      throw new Error(`Shootings editorial records contain duplicate id "${record.id}"`);
    }
    byId.set(record.id, record);
  }

  for (const id of SHOOTING_RECORD_IDS) {
    if (!byId.has(id)) {
      throw new Error(`Shootings editorial records are missing id "${id}"`);
    }
  }
  if (byId.size !== SHOOTING_RECORD_IDS.length) {
    throw new Error("Shootings editorial records contain unexpected entries");
  }

  return SHOOTING_RECORD_IDS.map((id) => byId.get(id) as ShootingEditorialRecord);
}

export const shootingsOverview = parseShootingsOverview(overviewSource);

export const shootingsEditorialRecords = normalizeRecords([
  obladaetSource,
  evashaSource,
  igguanaSource,
  esmiSource,
  hypressionSource,
  ofeliaSource,
  berryModelTestsSource,
  berryEditorialSource,
  berryLookbookSource,
  berryProductSource,
  ecobasikSource,
  offmiSource,
  cinemaStillsSource,
  ankaModelTestsSource,
  chooseYourCharacterSource,
  editorialPhotographySource,
]);

export function getShootingEditorialRecord(id: ShootingRecordId): ShootingEditorialRecord {
  const record = shootingsEditorialRecords.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing normalized shooting editorial record "${id}"`);
  return record;
}
