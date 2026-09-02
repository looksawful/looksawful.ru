import projectStructureJson from "../content/projects.json" with { type: "json" };
import projectCopyJson from "../content/editorial/home-project-cards.json" with { type: "json" };
import type { CaseId } from "./catalog/cases.ts";
import type { CollectionId } from "./catalog/collections.ts";
import { getCase, getCollection, getRole } from "./catalog/lookup.ts";
import {
  expectAllowedKeys,
  expectBoolean,
  expectPositiveInteger,
  expectRecord,
  expectStructuralString,
  readEditorialText,
} from "./content/editorial-validation.ts";

export const PROJECT_CARD_PRESENTATION_DEFINITIONS = [
  { id: "jestei", pageId: "case:jestei-pool" },
  { id: "styx", pageId: "case:styx" },
  { id: "sensetique", pageId: "case:sensetique" },
  { id: "shootings", pageId: "collection:music-photography" },
] as const;

export type ProjectCardId = (typeof PROJECT_CARD_PRESENTATION_DEFINITIONS)[number]["id"];
export type ProjectCardPageId = (typeof PROJECT_CARD_PRESENTATION_DEFINITIONS)[number]["pageId"];

export interface ProjectCardPresentation {
  id: ProjectCardId;
  pageId: ProjectCardPageId;
  visible: boolean;
  title: string;
  focus: string;
  role?: string;
  period?: string;
  ariaLabel?: string;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

interface ProjectCardStructureSource {
  id: ProjectCardId;
  visible: boolean;
  cover: Omit<ProjectCardPresentation["cover"], "alt">;
}

interface ProjectCardCopySource {
  title?: string;
  focus: string;
  role?: string;
  period?: string;
  ariaLabel?: string;
  coverAlt: string;
}

interface CanonicalProjectCardCopy {
  title: string;
  role?: string;
  period?: string;
}

const rawProjectStructure: unknown = projectStructureJson;
const rawProjectCopy: unknown = projectCopyJson;

function optionalEditorialOverride(record: Record<string, unknown>, key: string, label: string): string | undefined {
  if (!(key in record) || record[key] === undefined || record[key] === null) return undefined;
  return readEditorialText(record[key], `${label}.${key}`);
}

function optionalEditorialText(record: Record<string, unknown>, key: string, label: string): string | undefined {
  const parsed = optionalEditorialOverride(record, key, label);
  return parsed || undefined;
}

function resolveRole(
  primaryRoleLabel: string | undefined,
  primaryRoleId: Parameters<typeof getRole>[0] | undefined,
): string | undefined {
  if (primaryRoleLabel) return primaryRoleLabel;
  return primaryRoleId ? getRole(primaryRoleId).name : undefined;
}

function resolveCanonicalProjectCardCopy(pageId: ProjectCardPageId): CanonicalProjectCardCopy {
  if (pageId.startsWith("case:")) {
    const entity = getCase(pageId.slice("case:".length) as CaseId);
    return {
      title: entity.name,
      role: resolveRole(entity.primaryRoleLabel, entity.primaryRoleId),
      period: entity.date,
    };
  }

  const entity = getCollection(pageId.slice("collection:".length) as CollectionId);
  return {
    title: entity.displayName || entity.name,
    role: resolveRole(entity.primaryRoleLabel, entity.primaryRoleId),
  };
}

function parseStructure(value: unknown, index: number): ProjectCardStructureSource {
  const label = `projectCardStructure[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "visible", "cover"], ["id", "visible", "cover"], label);

  const idValue = expectStructuralString(record.id, `${label}.id`);
  const definition = PROJECT_CARD_PRESENTATION_DEFINITIONS.find(({ id }) => id === idValue);
  if (!definition) throw new Error(`${label}.id is unexpected: ${idValue}`);

  const coverRecord = expectRecord(record.cover, `${label}.cover`);
  expectAllowedKeys(coverRecord, ["src", "width", "height"], ["src", "width", "height"], `${label}.cover`);

  return {
    id: definition.id,
    visible: expectBoolean(record.visible, `${label}.visible`),
    cover: {
      src: expectStructuralString(coverRecord.src, `${label}.cover.src`),
      width: expectPositiveInteger(coverRecord.width, `${label}.cover.width`),
      height: expectPositiveInteger(coverRecord.height, `${label}.cover.height`),
    },
  };
}

function parseCopy(value: unknown, id: ProjectCardId): ProjectCardCopySource {
  const label = `projectCardCopy.${id}`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["title", "focus", "role", "period", "ariaLabel", "coverAlt"], ["focus", "coverAlt"], label);

  return {
    title: optionalEditorialOverride(record, "title", label),
    focus: readEditorialText(record.focus, `${label}.focus`),
    role: optionalEditorialOverride(record, "role", label),
    period: optionalEditorialOverride(record, "period", label),
    ariaLabel: optionalEditorialText(record, "ariaLabel", label),
    coverAlt: readEditorialText(record.coverAlt, `${label}.coverAlt`),
  };
}

export function parseProjectCardPresentations(
  structureValue: unknown = rawProjectStructure,
  copyValue: unknown = rawProjectCopy,
): readonly ProjectCardPresentation[] {
  if (!Array.isArray(structureValue)) throw new Error("project-card structure must be an array");
  const copyRecord = expectRecord(copyValue, "projectCardCopy");
  expectAllowedKeys(
    copyRecord,
    PROJECT_CARD_PRESENTATION_DEFINITIONS.map(({ id }) => id),
    PROJECT_CARD_PRESENTATION_DEFINITIONS.map(({ id }) => id),
    "projectCardCopy",
  );

  const parsedStructure = structureValue.map(parseStructure);
  const structureById = new Map<ProjectCardId, ProjectCardStructureSource>();
  for (const card of parsedStructure) {
    if (structureById.has(card.id)) throw new Error(`duplicate project-card id: ${card.id}`);
    structureById.set(card.id, card);
  }
  if (parsedStructure.length !== PROJECT_CARD_PRESENTATION_DEFINITIONS.length) {
    throw new Error(`project-card count must remain ${PROJECT_CARD_PRESENTATION_DEFINITIONS.length}; got ${parsedStructure.length}`);
  }

  const resolved = PROJECT_CARD_PRESENTATION_DEFINITIONS.map((definition) => {
    const structure = structureById.get(definition.id);
    if (!structure) throw new Error(`missing required project-card id: ${definition.id}`);
    const copy = parseCopy(copyRecord[definition.id], definition.id);
    const canonical = resolveCanonicalProjectCardCopy(definition.pageId);

    return {
      id: definition.id,
      pageId: definition.pageId,
      visible: structure.visible,
      title: copy.title ?? canonical.title,
      focus: copy.focus,
      role: copy.role ?? canonical.role,
      period: copy.period ?? canonical.period,
      ariaLabel: copy.ariaLabel,
      cover: Object.freeze({ ...structure.cover, alt: copy.coverAlt }),
    } satisfies ProjectCardPresentation;
  });

  return Object.freeze(resolved.map((card) => Object.freeze(card)));
}

export const projectCardPresentations = parseProjectCardPresentations();

export function getVisibleProjectCardPresentations(
  source: readonly ProjectCardPresentation[] = projectCardPresentations,
): readonly ProjectCardPresentation[] {
  return source.filter((card) => card.visible);
}

export type ProjectCardRole = NonNullable<ProjectCardPresentation["role"]>;
