import source from "../../content/cases/jestei-pool.json" with { type: "json" };

import {
  expectAllowedKeys,
  expectArray,
  expectKnownId,
  expectRecord,
  normalizeById,
  readEditorialText,
  readEditorialTextList,
  readEditorialTextSlots,
} from "./editorial-validation.ts";

export const JESTEI_SECTION_IDS = ["home", "brand", "interface", "editorial", "event", "landings", "promo"] as const;
export const JESTEI_OVERLAY_IDS = [
  "logo-geometry",
  "product-color",
  "logo-variants",
  "design-system",
  "display-type",
  "audiences",
] as const;

export type JesteiSectionId = (typeof JESTEI_SECTION_IDS)[number];
export type JesteiOverlayId = (typeof JESTEI_OVERLAY_IDS)[number];

const JESTEI_FIXED_PARAGRAPH_COUNTS: Partial<Record<JesteiSectionId, number>> = {
  interface: 3,
  event: 4,
};

export interface JesteiEditorialSection {
  id: JesteiSectionId;
  title: string;
  paragraphs: readonly string[];
}

export interface JesteiEditorialOverlay {
  id: JesteiOverlayId;
  text: string;
}

export interface JesteiEditorialContent {
  role: string;
  period: string;
  lead: string;
  sections: readonly JesteiEditorialSection[];
  overlays: readonly JesteiEditorialOverlay[];
}

function parseSection(value: unknown, index: number): JesteiEditorialSection {
  const label = `Jestei sections[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "title", "paragraphs"], ["id"], label);
  const sectionId = expectKnownId(record.id, JESTEI_SECTION_IDS, `${label}.id`);
  const expectedParagraphCount = JESTEI_FIXED_PARAGRAPH_COUNTS[sectionId];
  const parsedParagraphs = expectedParagraphCount
    ? readEditorialTextSlots(record.paragraphs, `${label}.paragraphs`)
    : readEditorialTextList(record.paragraphs, `${label}.paragraphs`);
  const paragraphs = expectedParagraphCount && parsedParagraphs.length === 0
    ? Array.from({ length: expectedParagraphCount }, () => "")
    : parsedParagraphs;
  if (expectedParagraphCount && paragraphs.length !== expectedParagraphCount) {
    throw new Error(
      `${label}.paragraphs count must remain ${expectedParagraphCount}; got ${paragraphs.length}`,
    );
  }

  return {
    id: sectionId,
    title: readEditorialText(record.title, `${label}.title`),
    paragraphs,
  };
}

function parseOverlay(value: unknown, index: number): JesteiEditorialOverlay {
  const label = `Jestei overlays[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "text"], ["id"], label);

  return {
    id: expectKnownId(record.id, JESTEI_OVERLAY_IDS, `${label}.id`),
    text: readEditorialText(record.text, `${label}.text`),
  };
}

export function parseJesteiEditorialContent(value: unknown): JesteiEditorialContent {
  const record = expectRecord(value, "Jestei editorial content");
  expectAllowedKeys(
    record,
    ["role", "period", "lead", "sections", "overlays"],
    ["sections", "overlays"],
    "Jestei editorial content",
  );

  const sections = expectArray(record.sections, "Jestei sections").map(parseSection);
  const overlays = expectArray(record.overlays, "Jestei overlays").map(parseOverlay);

  return {
    role: readEditorialText(record.role, "Jestei role"),
    period: readEditorialText(record.period, "Jestei period"),
    lead: readEditorialText(record.lead, "Jestei lead"),
    sections: normalizeById(sections, JESTEI_SECTION_IDS, "Jestei sections"),
    overlays: normalizeById(overlays, JESTEI_OVERLAY_IDS, "Jestei overlays"),
  };
}

export const jesteiEditorialContent = parseJesteiEditorialContent(source);

export function getJesteiEditorialSection(id: JesteiSectionId): JesteiEditorialSection {
  const section = jesteiEditorialContent.sections.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`Missing normalized Jestei section "${id}"`);
  return section;
}

export function getJesteiEditorialOverlay(id: JesteiOverlayId): JesteiEditorialOverlay {
  const overlay = jesteiEditorialContent.overlays.find((candidate) => candidate.id === id);
  if (!overlay) throw new Error(`Missing normalized Jestei overlay "${id}"`);
  return overlay;
}
