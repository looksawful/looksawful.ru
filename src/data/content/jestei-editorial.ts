import source from "../../content/cases/jestei-pool.json" with { type: "json" };

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

const JESTEI_SECTION_MIN_PARAGRAPHS: Readonly<Record<JesteiSectionId, number>> = {
  home: 1,
  brand: 1,
  interface: 3,
  editorial: 1,
  event: 4,
  landings: 1,
  promo: 1,
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

function parseSection(value: unknown, index: number): JesteiEditorialSection {
  const label = `Jestei sections[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "title", "paragraphs"], label);

  const id = expectNonEmptyString(record.id, `${label}.id`);
  if (!JESTEI_SECTION_IDS.some((candidate) => candidate === id)) {
    throw new Error(`${label} has unknown id "${id}"`);
  }
  const sectionId = id as JesteiSectionId;

  const paragraphs = expectArray(record.paragraphs, `${label}.paragraphs`);
  const minimumParagraphs = JESTEI_SECTION_MIN_PARAGRAPHS[sectionId];
  if (paragraphs.length < minimumParagraphs) {
    throw new Error(
      `Jestei section "${sectionId}" paragraphs must contain at least ${minimumParagraphs} non-empty strings`,
    );
  }

  return {
    id: sectionId,
    title: expectNonEmptyString(record.title, `${label}.title`),
    paragraphs: paragraphs.map((paragraph, paragraphIndex) =>
      expectNonEmptyString(paragraph, `${label}.paragraphs[${paragraphIndex}]`),
    ),
  };
}

function parseOverlay(value: unknown, index: number): JesteiEditorialOverlay {
  const label = `Jestei overlays[${index}]`;
  const record = expectRecord(value, label);
  expectExactKeys(record, ["id", "text"], label);

  const id = expectNonEmptyString(record.id, `${label}.id`);
  if (!JESTEI_OVERLAY_IDS.some((candidate) => candidate === id)) {
    throw new Error(`${label} has unknown id "${id}"`);
  }

  return {
    id: id as JesteiOverlayId,
    text: expectNonEmptyString(record.text, `${label}.text`),
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

export function parseJesteiEditorialContent(value: unknown): JesteiEditorialContent {
  const record = expectRecord(value, "Jestei editorial content");
  expectExactKeys(record, ["role", "period", "lead", "sections", "overlays"], "Jestei editorial content");

  const sections = expectArray(record.sections, "Jestei sections").map(parseSection);
  const overlays = expectArray(record.overlays, "Jestei overlays").map(parseOverlay);

  return {
    role: expectNonEmptyString(record.role, "Jestei role"),
    period: expectNonEmptyString(record.period, "Jestei period"),
    lead: expectNonEmptyString(record.lead, "Jestei lead"),
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
