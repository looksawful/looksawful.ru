import projectsJson from "../content/projects.json" with { type: "json" };
import type { sitePages } from "../site/pages/manifest.ts";

import { expectAllowedKeys, readEditorialText } from "./content/editorial-validation.ts";

export const HOME_CARD_IDS = ["jestei", "styx", "sensetique", "shootings"] as const;

export type HomeCardId = (typeof HOME_CARD_IDS)[number];
type SitePageId = (typeof sitePages)[number]["id"];

const HOME_CARD_PAGE_IDS = {
  jestei: "case:jestei-pool",
  styx: "case:styx",
  sensetique: "case:sensetique",
  shootings: "collection:music-photography",
} as const satisfies Record<HomeCardId, SitePageId>;

export type HomeCardPageId = (typeof HOME_CARD_PAGE_IDS)[HomeCardId];

export interface HomeCardData {
  id: HomeCardId;
  pageId: HomeCardPageId;
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

const rawHomeCards: unknown = projectsJson;
const homeCardIds = new Set<string>(HOME_CARD_IDS);

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

function optionalEditorialText(record: Record<string, unknown>, key: string, label: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  const parsed = readEditorialText(value, `${label}.${key}`);
  return parsed || undefined;
}

function requirePositiveInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label}.${key} must be a positive integer`);
  }
  return value;
}

function parseHomeCard(value: unknown, index: number): HomeCardData {
  const label = `homeCards[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(
    value,
    ["id", "visible", "title", "focus", "role", "period", "ariaLabel", "cover"],
    ["id", "visible", "cover"],
    label,
  );

  const idValue = requireNonEmptyString(value, "id", label);
  if (!homeCardIds.has(idValue)) throw new Error(`${label}.id is unexpected: ${idValue}`);
  const id: HomeCardId = HOME_CARD_IDS.find((candidate) => candidate === idValue) ?? (() => { throw new Error(`${label}.id is invalid`); })();

  const coverValue = value.cover;
  if (!isRecord(coverValue)) throw new Error(`${label}.cover must be an object`);
  expectAllowedKeys(
    coverValue,
    ["src", "alt", "width", "height"],
    ["src", "width", "height"],
    `${label}.cover`,
  );

  return {
    id,
    pageId: HOME_CARD_PAGE_IDS[id],
    visible: requireBoolean(value, "visible", label),
    title: readEditorialText(value.title, `${label}.title`),
    focus: readEditorialText(value.focus, `${label}.focus`),
    role: optionalEditorialText(value, "role", label),
    period: optionalEditorialText(value, "period", label),
    ariaLabel: optionalEditorialText(value, "ariaLabel", label),
    cover: {
      src: requireNonEmptyString(coverValue, "src", `${label}.cover`),
      alt: readEditorialText(coverValue.alt, `${label}.cover.alt`),
      width: requirePositiveInteger(coverValue, "width", `${label}.cover`),
      height: requirePositiveInteger(coverValue, "height", `${label}.cover`),
    },
  };
}

export function parseHomeCards(value: unknown): readonly HomeCardData[] {
  if (!Array.isArray(value)) throw new Error("home card content must be an array");

  const parsed = value.map(parseHomeCard);
  const seen = new Set<HomeCardId>();
  for (const card of parsed) {
    if (seen.has(card.id)) throw new Error(`duplicate home card id: ${card.id}`);
    seen.add(card.id);
  }

  for (const expectedId of HOME_CARD_IDS) {
    if (!seen.has(expectedId)) throw new Error(`missing required home card id: ${expectedId}`);
  }
  if (parsed.length !== HOME_CARD_IDS.length) {
    throw new Error(`home card count must remain ${HOME_CARD_IDS.length}; got ${parsed.length}`);
  }

  return Object.freeze(parsed.map((card) => Object.freeze({
    ...card,
    cover: Object.freeze({ ...card.cover }),
  })));
}

export const homeCards = parseHomeCards(rawHomeCards);

export function getVisibleHomeCards(
  source: readonly HomeCardData[] = homeCards,
): readonly HomeCardData[] {
  return source.filter((card) => card.visible);
}

export type HomeCardRole = NonNullable<HomeCardData["role"]>;
