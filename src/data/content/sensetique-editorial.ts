import source from "../../content/editorial/cases/sensetique.json" with { type: "json" };

import {
  expectAllowedKeys,
  expectArray,
  expectKnownId,
  expectRecord,
  normalizeById,
  readEditorialText,
  readEditorialTextList,
} from "./editorial-validation.ts";
import { resolveCaseIntroIdentity } from "./case-intro-identity.ts";

export const SENSETIQUE_SECTION_IDS = ["studio", "production"] as const;
export const SENSETIQUE_CREDIT_IDS = [
  "buro247",
  "olovo-booklet",
  "tatiana-nikishina",
  "katya-knyazeva",
  "yuri-ivanov",
  "harsh-light",
  "raputo-editorial",
  "young-pioneer-sequence",
  "krasota-dress",
  "olovo-campaign",
  "olovo-lookbook-2016",
  "olovo-lookbook-2018",
  "inna-honour",
  "olovo-architecture",
  "chapurin",
  "young-pioneer-strip",
  "daniil-korotechenkov",
  "tatiana-nikishina-supplemental",
  "wood-metal-panic",
  "ivan-krushinsky",
  "editorial-production",
  "digital-fear",
] as const;
export const SENSETIQUE_NOTE_IDS = ["buro247", "olovo-lookbook-2016"] as const;

export type SensetiqueSectionId = (typeof SENSETIQUE_SECTION_IDS)[number];
export type SensetiqueCreditId = (typeof SENSETIQUE_CREDIT_IDS)[number];
export type SensetiqueNoteId = (typeof SENSETIQUE_NOTE_IDS)[number];

export interface SensetiqueEditorialSourceIntro {
  lead: string;
}

export interface SensetiqueEditorialIntro extends SensetiqueEditorialSourceIntro {
  role: string;
  period: string;
}

export interface SensetiqueEditorialSection {
  id: SensetiqueSectionId;
  title: string;
  paragraphs: readonly string[];
}

export interface SensetiqueEditorialCredit {
  id: SensetiqueCreditId;
  title: string;
  lines: readonly string[];
}

export interface SensetiqueEditorialNote {
  id: SensetiqueNoteId;
  text: string;
}

export interface SensetiqueEditorialSourceContent {
  intro: SensetiqueEditorialSourceIntro;
  sections: readonly SensetiqueEditorialSection[];
  credits: readonly SensetiqueEditorialCredit[];
  notes: readonly SensetiqueEditorialNote[];
}

export interface SensetiqueEditorialContent extends Omit<SensetiqueEditorialSourceContent, "intro"> {
  intro: SensetiqueEditorialIntro;
}

function parseSection(value: unknown, index: number): SensetiqueEditorialSection {
  const label = `Sensetique sections[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "paragraphs"], ["id"], label);
  return {
    id: expectKnownId(record.id, SENSETIQUE_SECTION_IDS, `${label}.id`),
    title: readEditorialText(record.title, `${label}.title`),
    paragraphs: readEditorialTextList(record.paragraphs, `${label}.paragraphs`),
  };
}

function parseCredit(value: unknown, index: number): SensetiqueEditorialCredit {
  const label = `Sensetique credits[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "lines"], ["id"], label);
  return {
    id: expectKnownId(record.id, SENSETIQUE_CREDIT_IDS, `${label}.id`),
    title: readEditorialText(record.title, `${label}.title`),
    lines: readEditorialTextList(record.lines, `${label}.lines`),
  };
}

function parseNote(value: unknown, index: number): SensetiqueEditorialNote {
  const label = `Sensetique notes[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "text"], ["id"], label);
  return {
    id: expectKnownId(record.id, SENSETIQUE_NOTE_IDS, `${label}.id`),
    text: readEditorialText(record.text, `${label}.text`),
  };
}

export function parseSensetiqueEditorialContent(value: unknown): SensetiqueEditorialSourceContent {
  const record = expectRecord(value, "Sensetique editorial content");
  expectAllowedKeys(
    record,
    ["intro", "sections", "credits", "notes"],
    ["intro", "sections", "credits", "notes"],
    "Sensetique editorial content",
  );

  const intro = expectRecord(record.intro, "Sensetique intro");
  expectAllowedKeys(intro, ["lead"], [], "Sensetique intro");

  return {
    intro: {
      lead: readEditorialText(intro.lead, "Sensetique intro.lead"),
    },
    sections: normalizeById(expectArray(record.sections, "Sensetique sections").map(parseSection), SENSETIQUE_SECTION_IDS, "Sensetique sections"),
    credits: normalizeById(expectArray(record.credits, "Sensetique credits").map(parseCredit), SENSETIQUE_CREDIT_IDS, "Sensetique credits"),
    notes: normalizeById(expectArray(record.notes, "Sensetique notes").map(parseNote), SENSETIQUE_NOTE_IDS, "Sensetique notes"),
  };
}

const parsedSensetiqueEditorialContent = parseSensetiqueEditorialContent(source);

export const sensetiqueEditorialContent: SensetiqueEditorialContent = {
  ...parsedSensetiqueEditorialContent,
  intro: {
    ...resolveCaseIntroIdentity("sensetique"),
    ...parsedSensetiqueEditorialContent.intro,
  },
};

export function getSensetiqueEditorialSection(id: SensetiqueSectionId): SensetiqueEditorialSection {
  const value = sensetiqueEditorialContent.sections.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing normalized Sensetique section "${id}"`);
  return value;
}

export function getSensetiqueEditorialCredit(id: SensetiqueCreditId): SensetiqueEditorialCredit {
  const value = sensetiqueEditorialContent.credits.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing normalized Sensetique credit "${id}"`);
  return value;
}

export function getSensetiqueEditorialNote(id: SensetiqueNoteId): SensetiqueEditorialNote {
  const value = sensetiqueEditorialContent.notes.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing normalized Sensetique note "${id}"`);
  return value;
}
