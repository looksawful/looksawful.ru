import projectsJson from "../content/projects.json" with { type: "json" };
import type { CaseId } from "./catalog/cases.ts";
import type { CollectionId } from "./catalog/collections.ts";
import { getCase, getCollection, getRole } from "./catalog/lookup.ts";
import { expectAllowedKeys, readEditorialText } from "./content/editorial-validation.ts";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`${label}.${key} must be a boolean`);
  }
  return value;
}

function optionalEditorialOverride(record: Record<string, unknown>, key: string, label: string): string | undefined {
  if (!(key in record) || record[key] === undefined || record[key] === null) return undefined;
  return readEditorialText(record[key], `${label}.${key}`);
}

function optionalEditorialText(record: Record<string, unknown>, key: string, label: string): string | undefined {
  const parsed = optionalEditorialOverride(record, key, label);
  return parsed || undefined;
}

function requirePositiveInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label}.${key} must be a positive integer`);
  }
  return value;
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
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(
    value,
    ["id", "visible", "title", "focus", "role", "period", "ariaLabel", "cover"],
    ["id", "visible", "cover"],
    label,
  );

  const idValue = requireNonEmptyString(value, "id", label);
  const definition = PROJECT_CARD_PRESENTATION_DEFINITIONS.find(({ id }) => id === idValue);
  if (!definition) throw new Error(`${label}.id is unexpected: ${idValue}`);

  const coverValue = value.cover;
  if (!isRecord(coverValue)) throw new Error(`${label}.cover must be an object`);
  expectAllowedKeys(
    coverValue,
    ["src", "alt", "width", "height"],
    ["src", "width", "height"],
    `${label}.cover`,
  );

  return {
    id: definition.id,
    visible: requireBoolean(value, "visible", label),
    title: optionalEditorialOverride(value, "title", label),
    focus: readEditorialText(value.focus, `${label}.focus`),
    role: optionalEditorialOverride(value, "role", label),
    period: optionalEditorialOverride(value, "period", label),
    ariaLabel: optionalEditorialText(value, "ariaLabel", label),
    cover: {
      src: requireNonEmptyString(coverValue, "src", `${label}.cover`),
      alt: readEditorialText(coverValue.alt, `${label}.cover.alt`),
      width: requirePositiveInteger(coverValue, "width", `${label}.cover`),
      height: requirePositiveInteger(coverValue, "height", `${label}.cover`),
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

export const getVisibleHomeCards = getVisibleProjectCardPresentations;
export type HomeCardData = ProjectCardPresentation;
export type HomeCardId = ProjectCardId;
export type ProjectCardRole = NonNullable<ProjectCardPresentation["role"]>;
