import projectsJson from "../content/projects.json" with { type: "json" };
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

interface ProjectCardEditorialSource {
  id: ProjectCardId;
  visible: boolean;
  title?: string;
  focus: string;
  role?: string;
  period?: string;
  ariaLabel?: string;
  cover: ProjectCardPresentation["cover"];
}

interface CanonicalProjectCardCopy {
  title: string;
  role?: string;
  period?: string;
}

const rawProjectCards: unknown = projectsJson;

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

function parseProjectCardSource(value: unknown, index: number): ProjectCardEditorialSource {
  const label = `projectCards[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(
    record,
    ["id", "visible", "title", "focus", "role", "period", "ariaLabel", "cover"],
    ["id", "visible", "cover"],
    label,
  );

  const idValue = expectStructuralString(record.id, `${label}.id`);
  const definition = PROJECT_CARD_PRESENTATION_DEFINITIONS.find(({ id }) => id === idValue);
  if (!definition) throw new Error(`${label}.id is unexpected: ${idValue}`);

  const coverRecord = expectRecord(record.cover, `${label}.cover`);
  expectAllowedKeys(
    coverRecord,
    ["src", "alt", "width", "height"],
    ["src", "width", "height"],
    `${label}.cover`,
  );

  return {
    id: definition.id,
    visible: expectBoolean(record.visible, `${label}.visible`),
    title: optionalEditorialOverride(record, "title", label),
    focus: readEditorialText(record.focus, `${label}.focus`),
    role: optionalEditorialOverride(record, "role", label),
    period: optionalEditorialOverride(record, "period", label),
    ariaLabel: optionalEditorialText(record, "ariaLabel", label),
    cover: {
      src: expectStructuralString(coverRecord.src, `${label}.cover.src`),
      alt: readEditorialText(coverRecord.alt, `${label}.cover.alt`),
      width: expectPositiveInteger(coverRecord.width, `${label}.cover.width`),
      height: expectPositiveInteger(coverRecord.height, `${label}.cover.height`),
    },
  };
}

export function parseProjectCardPresentations(value: unknown): readonly ProjectCardPresentation[] {
  if (!Array.isArray(value)) throw new Error("project-card content must be an array");

  const parsed = value.map(parseProjectCardSource);
  const sourceById = new Map<ProjectCardId, ProjectCardEditorialSource>();
  for (const card of parsed) {
    if (sourceById.has(card.id)) throw new Error(`duplicate project-card id: ${card.id}`);
    sourceById.set(card.id, card);
  }

  if (parsed.length !== PROJECT_CARD_PRESENTATION_DEFINITIONS.length) {
    throw new Error(`project-card count must remain ${PROJECT_CARD_PRESENTATION_DEFINITIONS.length}; got ${parsed.length}`);
  }

  const resolved = PROJECT_CARD_PRESENTATION_DEFINITIONS.map((definition) => {
    const source = sourceById.get(definition.id);
    if (!source) throw new Error(`missing required project-card id: ${definition.id}`);
    const canonical = resolveCanonicalProjectCardCopy(definition.pageId);

    return {
      id: definition.id,
      pageId: definition.pageId,
      visible: source.visible,
      title: source.title ?? canonical.title,
      focus: source.focus,
      role: source.role ?? canonical.role,
      period: source.period ?? canonical.period,
      ariaLabel: source.ariaLabel,
      cover: Object.freeze({ ...source.cover }),
    } satisfies ProjectCardPresentation;
  });

  return Object.freeze(resolved.map((card) => Object.freeze(card)));
}

export const projectCardPresentations = parseProjectCardPresentations(rawProjectCards);

export function getVisibleProjectCardPresentations(
  source: readonly ProjectCardPresentation[] = projectCardPresentations,
): readonly ProjectCardPresentation[] {
  return source.filter((card) => card.visible);
}

export type ProjectCardRole = NonNullable<ProjectCardPresentation["role"]>;
