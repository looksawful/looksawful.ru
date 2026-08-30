import source from "../../content/cases/styx.json" with { type: "json" };

export const STYX_SECTION_IDS = ["brand", "production", "scanography", "shootings", "lookbook"] as const;
export const STYX_CREDIT_IDS = ["brand-lookbook-2023", "scanography-2021", "lookbook-2025"] as const;

export type StyxSectionId = (typeof STYX_SECTION_IDS)[number];
export type StyxCreditId = (typeof STYX_CREDIT_IDS)[number];

export interface StyxEditorialSection {
  id: StyxSectionId;
  title: string;
  paragraphs: readonly string[];
}

export interface StyxEditorialCredit {
  id: StyxCreditId;
  title: string;
}

export interface StyxEditorialContent {
  lead: string;
  sections: readonly StyxEditorialSection[];
  credits: readonly StyxEditorialCredit[];
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
    if (!allowed.has(key)) {
      throw new Error(`${label} has unexpected field "${key}"`);
    }
  }
  for (const key of expected) {
    if (!(key in record)) {
      throw new Error(`${label} is missing field "${key}"`);
    }
  }
}

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function expectArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }
  return value;
}

function parseSection(value: unknown, index: number): StyxEditorialSection {
  const label = `Styx sections[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "title", "paragraphs"], label);

  const id = expectNonEmptyString(record.id, `${label}.id`);
  if (!STYX_SECTION_IDS.some((candidate) => candidate === id)) {
    throw new Error(`${label} has unknown id "${id}"`);
  }

  const paragraphs = expectArray(record.paragraphs, `${label}.paragraphs`);
  if (paragraphs.length === 0) {
    throw new Error(`${label}.paragraphs must contain at least one non-empty string`);
  }

  return {
    id: id as StyxSectionId,
    title: expectNonEmptyString(record.title, `${label}.title`),
    paragraphs: paragraphs.map((paragraph, paragraphIndex) =>
      expectNonEmptyString(paragraph, `${label}.paragraphs[${paragraphIndex}]`),
    ),
  };
}

function parseCredit(value: unknown, index: number): StyxEditorialCredit {
  const label = `Styx credits[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "title"], label);

  const id = expectNonEmptyString(record.id, `${label}.id`);
  if (!STYX_CREDIT_IDS.some((candidate) => candidate === id)) {
    throw new Error(`${label} has unknown id "${id}"`);
  }

  return {
    id: id as StyxCreditId,
    title: expectNonEmptyString(record.title, `${label}.title`),
  };
}

function normalizeById<T extends { id: string }>(
  values: readonly T[],
  expectedIds: readonly string[],
  label: string,
): readonly T[] {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.id)) {
      throw new Error(`${label} contains duplicate id "${value.id}"`);
    }
    byId.set(value.id, value);
  }

  for (const id of expectedIds) {
    if (!byId.has(id)) {
      throw new Error(`${label} is missing id "${id}"`);
    }
  }

  if (byId.size !== expectedIds.length) {
    throw new Error(`${label} contains unexpected entries`);
  }

  return expectedIds.map((id) => byId.get(id) as T);
}

export function parseStyxEditorialContent(value: unknown): StyxEditorialContent {
  const record = expectRecord(value, "Styx editorial content");
  expectExactKeys(record, ["lead", "sections", "credits"], "Styx editorial content");

  const sections = expectArray(record.sections, "Styx sections").map(parseSection);
  const credits = expectArray(record.credits, "Styx credits").map(parseCredit);

  return {
    lead: expectNonEmptyString(record.lead, "Styx lead"),
    sections: normalizeById(sections, STYX_SECTION_IDS, "Styx sections"),
    credits: normalizeById(credits, STYX_CREDIT_IDS, "Styx credits"),
  };
}

export const styxEditorialContent = parseStyxEditorialContent(source);

export function getStyxEditorialSection(id: StyxSectionId): StyxEditorialSection {
  const section = styxEditorialContent.sections.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`Missing normalized Styx section "${id}"`);
  return section;
}

export function getStyxEditorialCredit(id: StyxCreditId): StyxEditorialCredit {
  const credit = styxEditorialContent.credits.find((candidate) => candidate.id === id);
  if (!credit) throw new Error(`Missing normalized Styx credit "${id}"`);
  return credit;
}
