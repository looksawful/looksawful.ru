import jesteiVisibilityJson from "../../content/visibility/jestei-pool.json" with { type: "json" };
import sensetiqueVisibilityJson from "../../content/visibility/sensetique.json" with { type: "json" };
import shootingsVisibilityJson from "../../content/visibility/shootings.json" with { type: "json" };
import styxVisibilityJson from "../../content/visibility/styx.json" with { type: "json" };
import type { EntityPageContent } from "../../content/contracts/page-content.ts";
import type { Section } from "../../content/contracts/sections.ts";

export interface BlockVisibilityRecord {
  readonly id: string;
  readonly visible: boolean;
}

export interface SectionVisibilityRecord {
  readonly id: string;
  readonly visible: boolean;
  readonly blocks: readonly BlockVisibilityRecord[];
}

export interface EntityPageVisibility {
  readonly pageId: EntityPageContent["pageId"];
  readonly sections: readonly SectionVisibilityRecord[];
}

type VisibilitySource = Readonly<{ sections: unknown }>;

const visibilitySources = Object.freeze({
  "case:jestei-pool": jesteiVisibilityJson,
  "case:styx": styxVisibilityJson,
  "case:sensetique": sensetiqueVisibilityJson,
  "collection:music-photography": shootingsVisibilityJson,
} satisfies Partial<Record<EntityPageContent["pageId"], VisibilitySource>>);

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectOnlyKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  const allowed = new Set(keys);
  const unsupported = Object.keys(record).filter((key) => !allowed.has(key));
  if (unsupported.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unsupported.join(", ")}`);
  }
  for (const key of keys) {
    if (!(key in record)) throw new Error(`${label} is missing required field: ${key}`);
  }
}

function expectId(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function expectVisible(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function blocksForSection(section: Section): readonly { readonly type: string }[] {
  return "blocks" in section && Array.isArray(section.blocks) ? section.blocks : [];
}

function expectedBlockIds(section: Section): readonly string[] {
  const ids = blocksForSection(section).map((block) => `${section.id}:${block.type}`);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`canonical block visibility ids must be unique for section: ${section.id}`);
  }
  return ids;
}

function parseBlockVisibility(
  value: unknown,
  sectionId: string,
  expectedIds: readonly string[],
  index: number,
): BlockVisibilityRecord {
  const label = `block visibility ${sectionId}[${index}]`;
  const record = expectRecord(value, label);
  expectOnlyKeys(record, ["id", "visible"], label);
  const id = expectId(record.id, `${label}.id`);
  if (!expectedIds.includes(id)) throw new Error(`unexpected block visibility id: ${id}`);
  return Object.freeze({ id, visible: expectVisible(record.visible, `${label}.visible`) });
}

function parseSectionVisibilityRecord(
  value: unknown,
  expected: Section,
  index: number,
): SectionVisibilityRecord {
  const label = `section visibility[${index}]`;
  const record = expectRecord(value, label);
  expectOnlyKeys(record, ["id", "visible", "blocks"], label);
  const id = expectId(record.id, `${label}.id`);
  if (id !== expected.id) throw new Error(`unexpected section visibility id: ${id}`);
  if (!Array.isArray(record.blocks)) throw new Error(`${label}.blocks must be an array`);

  const expectedIds = expectedBlockIds(expected);
  const seen = new Set<string>();
  const blocks = record.blocks.map((item, blockIndex) => {
    const block = parseBlockVisibility(item, id, expectedIds, blockIndex);
    if (seen.has(block.id)) throw new Error(`duplicate block visibility id: ${block.id}`);
    seen.add(block.id);
    return block;
  });
  for (const expectedId of expectedIds) {
    if (!seen.has(expectedId)) throw new Error(`missing block visibility id: ${expectedId}`);
  }

  return Object.freeze({
    id,
    visible: expectVisible(record.visible, `${label}.visible`),
    blocks: Object.freeze(blocks),
  });
}

export function getEntityPageVisibilitySource(pageId: string): unknown {
  const source = visibilitySources[pageId as keyof typeof visibilitySources];
  if (!source) throw new Error(`No CMS visibility source for page: ${pageId}`);
  return source;
}

export function parseEntityPageVisibility(
  value: unknown,
  content: EntityPageContent,
): EntityPageVisibility {
  const source = expectRecord(value, `page visibility ${content.pageId}`);
  expectOnlyKeys(source, ["sections"], `page visibility ${content.pageId}`);
  if (!Array.isArray(source.sections)) throw new Error("page visibility sections must be an array");

  const expectedById = new Map(content.sections.map((section) => [section.id, section]));
  const seen = new Set<string>();
  const sections = source.sections.map((item, index) => {
    const record = expectRecord(item, `section visibility[${index}]`);
    const id = expectId(record.id, `section visibility[${index}].id`);
    if (seen.has(id)) throw new Error(`duplicate section visibility id: ${id}`);
    seen.add(id);
    const expected = expectedById.get(id);
    if (!expected) throw new Error(`unexpected section visibility id: ${id}`);
    return parseSectionVisibilityRecord(item, expected, index);
  });
  for (const section of content.sections) {
    if (!seen.has(section.id)) throw new Error(`missing section visibility id: ${section.id}`);
  }

  return Object.freeze({
    pageId: content.pageId,
    sections: Object.freeze(sections),
  });
}

// Compatibility adapter for the original section-only boundary. Runtime rendering
// uses parseEntityPageVisibility so block IDs remain validated against PageContent.
export function parseSectionVisibility(
  value: unknown,
  expectedIds: readonly string[],
): readonly Readonly<{ id: string; visible: boolean }>[] {
  const records = Array.isArray(value)
    ? value
    : expectRecord(value, "section visibility content").sections;
  if (!Array.isArray(records)) throw new Error("section visibility content must be an array");

  const expected = new Set(expectedIds);
  if (expected.size !== expectedIds.length) {
    throw new Error("expected section visibility ids must be unique");
  }

  const seen = new Set<string>();
  const parsed = records.map((item, index) => {
    const record = expectRecord(item, `section visibility record ${index}`);
    const id = expectId(record.id, `section visibility record ${index}.id`);
    const visible = expectVisible(record.visible, `section visibility record ${id}.visible`);
    if (seen.has(id)) throw new Error(`duplicate section visibility id: ${id}`);
    seen.add(id);
    if (!expected.has(id)) throw new Error(`unexpected section visibility id: ${id}`);
    return Object.freeze({ id, visible });
  });

  for (const id of expectedIds) {
    if (!seen.has(id)) throw new Error(`missing section visibility id: ${id}`);
  }

  return Object.freeze(parsed);
}

function sectionHasRenderableNonBlockContent(section: Section): boolean {
  if (section.type === "specialized" || section.type === "project-group") return true;
  return Boolean(section.intro || section.heading || section.credits || section.note || section.resources);
}

export function applyEntityPageVisibility(
  content: EntityPageContent,
  visibility: EntityPageVisibility,
): EntityPageContent {
  if (visibility.pageId !== content.pageId) {
    throw new Error(`Visibility page mismatch: ${visibility.pageId} != ${content.pageId}`);
  }
  const changed = visibility.sections.some(
    (section) => !section.visible || section.blocks.some((block) => !block.visible),
  );
  if (!changed) return content;

  const visibilityById = new Map(visibility.sections.map((section) => [section.id, section]));
  const sections: Section[] = [];
  for (const section of content.sections) {
    const state = visibilityById.get(section.id);
    if (!state) throw new Error(`missing section visibility id: ${section.id}`);
    if (!state.visible) continue;

    if (!("blocks" in section) || !Array.isArray(section.blocks)) {
      sections.push(section);
      continue;
    }

    const blockState = new Map(state.blocks.map((block) => [block.id, block.visible]));
    const blocks = section.blocks.filter((block) => blockState.get(`${section.id}:${block.type}`) !== false);
    if (blocks.length === section.blocks.length) {
      sections.push(section);
      continue;
    }
    if (blocks.length === 0 && !sectionHasRenderableNonBlockContent(section)) continue;
    sections.push({ ...section, blocks } as Section);
  }

  return { ...content, sections };
}

export function resolveEntityPageContentVisibility(content: EntityPageContent): EntityPageContent {
  const source = getEntityPageVisibilitySource(content.pageId);
  return applyEntityPageVisibility(content, parseEntityPageVisibility(source, content));
}
