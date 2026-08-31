import source from "../../content/cases/styx.json" with { type: "json" };

import {
  expectAllowedKeys,
  expectArray,
  expectKnownId,
  expectRecord,
  normalizeById,
  readEditorialText,
  readEditorialTextList,
} from "./editorial-validation.ts";

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
  role: string;
  period: string;
  lead: string;
  sections: readonly StyxEditorialSection[];
  credits: readonly StyxEditorialCredit[];
}

function parseSection(value: unknown, index: number): StyxEditorialSection {
  const label = `Styx sections[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "paragraphs"], ["id"], label);

  return {
    id: expectKnownId(record.id, STYX_SECTION_IDS, `${label}.id`),
    title: readEditorialText(record.title, `${label}.title`),
    paragraphs: readEditorialTextList(record.paragraphs, `${label}.paragraphs`),
  };
}

function parseCredit(value: unknown, index: number): StyxEditorialCredit {
  const label = `Styx credits[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title"], ["id"], label);

  return {
    id: expectKnownId(record.id, STYX_CREDIT_IDS, `${label}.id`),
    title: readEditorialText(record.title, `${label}.title`),
  };
}

export function parseStyxEditorialContent(value: unknown): StyxEditorialContent {
  const record = expectRecord(value, "Styx editorial content");
  expectAllowedKeys(
    record,
    ["role", "period", "lead", "sections", "credits"],
    ["sections", "credits"],
    "Styx editorial content",
  );

  const sections = expectArray(record.sections, "Styx sections").map(parseSection);
  const credits = expectArray(record.credits, "Styx credits").map(parseCredit);

  return {
    role: readEditorialText(record.role, "Styx role"),
    period: readEditorialText(record.period, "Styx period"),
    lead: readEditorialText(record.lead, "Styx lead"),
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
