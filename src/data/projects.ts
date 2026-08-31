import projectsJson from "../content/projects.json" with { type: "json" };

import { expectAllowedKeys, readEditorialText } from "./content/editorial-validation.ts";

export const PROJECT_IDS = ["jestei", "styx", "sensetique", "shootings"] as const;

export type ProjectId = (typeof PROJECT_IDS)[number];

export interface ProjectCardData {
  id: ProjectId;
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

const rawProjects: unknown = projectsJson;
const projectIds = new Set<string>(PROJECT_IDS);

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

function parseProject(value: unknown, index: number): ProjectCardData {
  const label = `projects[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(
    value,
    ["id", "visible", "title", "focus", "role", "period", "ariaLabel", "cover"],
    ["id", "visible", "cover"],
    label,
  );

  const idValue = requireNonEmptyString(value, "id", label);
  if (!projectIds.has(idValue)) throw new Error(`${label}.id is unexpected: ${idValue}`);
  const id: ProjectId = PROJECT_IDS.find((candidate) => candidate === idValue) ?? (() => { throw new Error(`${label}.id is invalid`); })();

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

export function parseProjectCards(value: unknown): readonly ProjectCardData[] {
  if (!Array.isArray(value)) throw new Error("projects content must be an array");

  const parsed = value.map(parseProject);
  const seen = new Set<ProjectId>();
  for (const project of parsed) {
    if (seen.has(project.id)) throw new Error(`duplicate project id: ${project.id}`);
    seen.add(project.id);
  }

  for (const expectedId of PROJECT_IDS) {
    if (!seen.has(expectedId)) throw new Error(`missing required project id: ${expectedId}`);
  }
  if (parsed.length !== PROJECT_IDS.length) {
    throw new Error(`project card count must remain ${PROJECT_IDS.length}; got ${parsed.length}`);
  }

  return Object.freeze(parsed.map((project) => Object.freeze({
    ...project,
    cover: Object.freeze({ ...project.cover }),
  })));
}

export const projects = parseProjectCards(rawProjects);

export function getHomepageProjects(
  source: readonly ProjectCardData[] = projects,
): readonly ProjectCardData[] {
  return source.filter((project) => project.visible);
}

export type Project = ProjectCardData;
export type ProjectRole = NonNullable<ProjectCardData["role"]>;
