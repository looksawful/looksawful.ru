import source from "../../content/cases/sensetique.json" with { type: "json" };

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

export interface SensetiqueEditorialIntro {
  role: string;
  period: string;
  lead: string;
}

export interface SensetiqueEditorialSection {
  id: SensetiqueSectionId;
  title: string;
  paragraphs: readonly string[];
}

export interface SensetiqueEditorialCredit {
  id: SensetiqueCreditId;
  title?: string;
  lines?: readonly string[];
}

export interface SensetiqueEditorialNote {
  id: SensetiqueNoteId;
  text: string;
}

export interface SensetiqueEditorialContent {
  intro: SensetiqueEditorialIntro;
  sections: readonly SensetiqueEditorialSection[];
  credits: readonly SensetiqueEditorialCredit[];
  notes: readonly SensetiqueEditorialNote[];
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectExactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const allowed = new Set(expected);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }
  for (const key of expected) {
    if (!(key in record)) throw new Error(`${label} is missing field "${key}"`);
  }
}

function expectAllowedKeys(record: Record<string, unknown>, allowedKeys: readonly string[], requiredKeys: readonly string[], label: string): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }
  for (const key of requiredKeys) {
    if (!(key in record)) throw new Error(`${label} is missing field "${key}"`);
  }
}

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function expectArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function expectKnownId<const T extends readonly string[]>(value: unknown, ids: T, label: string): T[number] {
  const id = expectNonEmptyString(value, label);
  if (!ids.some((candidate) => candidate === id)) throw new Error(`${label} has unknown id "${id}"`);
  return id as T[number];
}

function parseStringList(value: unknown, label: string): readonly string[] {
  const values = expectArray(value, label);
  if (values.length === 0) throw new Error(`${label} must contain at least one non-empty string`);
  return values.map((item, index) => expectNonEmptyString(item, `${label}[${index}]`));
}

function parseSection(value: unknown, index: number): SensetiqueEditorialSection {
  const label = `Sensetique sections[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "title", "paragraphs"], label);
  return {
    id: expectKnownId(record.id, SENSETIQUE_SECTION_IDS, `${label}.id`),
    title: expectNonEmptyString(record.title, `${label}.title`),
    paragraphs: parseStringList(record.paragraphs, `${label}.paragraphs`),
  };
}

function parseCredit(value: unknown, index: number): SensetiqueEditorialCredit {
  const label = `Sensetique credits[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "lines"], ["id"], label);
  const title = record.title === undefined ? undefined : expectNonEmptyString(record.title, `${label}.title`);
  const lines = record.lines === undefined ? undefined : parseStringList(record.lines, `${label}.lines`);
  if (!title && !lines) throw new Error(`${label} must include title or lines`);
  return {
    id: expectKnownId(record.id, SENSETIQUE_CREDIT_IDS, `${label}.id`),
    ...(title ? { title } : {}),
    ...(lines ? { lines } : {}),
  };
}

function parseNote(value: unknown, index: number): SensetiqueEditorialNote {
  const label = `Sensetique notes[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "text"], label);
  return {
    id: expectKnownId(record.id, SENSETIQUE_NOTE_IDS, `${label}.id`),
    text: expectNonEmptyString(record.text, `${label}.text`),
  };
}

function normalizeById<T extends { id: string }>(values: readonly T[], expectedIds: readonly string[], label: string): readonly T[] {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.id)) throw new Error(`${label} contains duplicate id "${value.id}"`);
    byId.set(value.id, value);
  }
  for (const id of expectedIds) {
    if (!byId.has(id)) throw new Error(`${label} is missing id "${id}"`);
  }
  if (byId.size !== expectedIds.length) throw new Error(`${label} contains unexpected entries`);
  return expectedIds.map((id) => byId.get(id) as T);
}

export function parseSensetiqueEditorialContent(value: unknown): SensetiqueEditorialContent {
  const record = expectRecord(value, "Sensetique editorial content");
  expectExactKeys(record, ["intro", "sections", "credits", "notes"], "Sensetique editorial content");

  const intro = expectRecord(record.intro, "Sensetique intro");
  expectExactKeys(intro, ["role", "period", "lead"], "Sensetique intro");

  return {
    intro: {
      role: expectNonEmptyString(intro.role, "Sensetique intro.role"),
      period: expectNonEmptyString(intro.period, "Sensetique intro.period"),
      lead: expectNonEmptyString(intro.lead, "Sensetique intro.lead"),
    },
    sections: normalizeById(expectArray(record.sections, "Sensetique sections").map(parseSection), SENSETIQUE_SECTION_IDS, "Sensetique sections"),
    credits: normalizeById(expectArray(record.credits, "Sensetique credits").map(parseCredit), SENSETIQUE_CREDIT_IDS, "Sensetique credits"),
    notes: normalizeById(expectArray(record.notes, "Sensetique notes").map(parseNote), SENSETIQUE_NOTE_IDS, "Sensetique notes"),
  };
}

export const sensetiqueEditorialContent = parseSensetiqueEditorialContent(source);

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
