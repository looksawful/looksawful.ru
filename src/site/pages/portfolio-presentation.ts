import type { SitePageDefinition } from "./types.ts";

export type PortfolioEntityPageId = Extract<
  SitePageDefinition,
  { type: "case" | "project" | "collection" }
>["id"];

export interface PortfolioPresentation {
  flagship: readonly PortfolioEntityPageId[];
  featured: readonly PortfolioEntityPageId[];
  archive: readonly PortfolioEntityPageId[];
  projectIndex: readonly PortfolioEntityPageId[];
  workShortcuts: readonly PortfolioEntityPageId[];
}

export const portfolioPresentation = {
  flagship: [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
  ],
  featured: [],
  archive: [],
  projectIndex: [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
    "collection:music-photography",
  ],
  workShortcuts: [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
    "collection:music-photography",
  ],
} as const satisfies PortfolioPresentation;

function requireEntityPage(
  id: PortfolioEntityPageId | string,
  pages: readonly SitePageDefinition[],
): Extract<SitePageDefinition, { type: "case" | "project" | "collection" }> {
  const page = pages.find((candidate) => candidate.id === id);
  if (!page || (page.type !== "case" && page.type !== "project" && page.type !== "collection")) {
    throw new Error(`Portfolio presentation id must resolve to an entity page: ${id}`);
  }
  return page;
}

function assertUnique(label: string, ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`Duplicate portfolio ${label} page id: ${id}`);
    seen.add(id);
  }
}

export function validatePortfolioPresentation(
  presentation: PortfolioPresentation,
  pages: readonly SitePageDefinition[],
): void {
  if (presentation.flagship.length !== 3) {
    throw new Error(`Portfolio presentation requires exactly 3 Flagship Cases; got ${presentation.flagship.length}`);
  }

  for (const id of presentation.flagship) {
    const page = requireEntityPage(id, pages);
    if (page.type !== "case") {
      throw new Error(`Flagship must resolve to a Case page: ${id}`);
    }
  }

  for (const id of [
    ...presentation.featured,
    ...presentation.archive,
    ...presentation.projectIndex,
    ...presentation.workShortcuts,
  ]) {
    requireEntityPage(id, pages);
  }

  assertUnique("Flagship", presentation.flagship);
  assertUnique("Featured", presentation.featured);
  assertUnique("Archive", presentation.archive);
  assertUnique("Project index", presentation.projectIndex);
  assertUnique("Work shortcut", presentation.workShortcuts);

  const mainTier = new Set<string>();
  for (const id of presentation.flagship) mainTier.add(id);
  for (const id of presentation.featured) {
    if (mainTier.has(id)) throw new Error(`Duplicate portfolio main-tier page id: ${id}`);
    mainTier.add(id);
  }
  for (const id of presentation.archive) {
    if (mainTier.has(id)) throw new Error(`Duplicate portfolio tier page id: ${id}`);
  }

  if (presentation.featured.length !== 0 && (
    presentation.featured.length < 3 || presentation.featured.length > 5
  )) {
    throw new Error("Featured portfolio selection must be empty while unapproved or contain 3–5 entities");
  }
}
