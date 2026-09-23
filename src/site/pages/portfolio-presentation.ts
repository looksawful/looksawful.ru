import type { SitePageDefinition } from "./types.ts";

export type PortfolioEntityPageId = Extract<
  SitePageDefinition,
  { type: "case" | "project" | "collection" }
>["id"];

export type PortfolioCasePageId = Extract<
  SitePageDefinition,
  { type: "case" }
>["id"];

export interface PortfolioPresentation {
  flagship: readonly PortfolioEntityPageId[];
  featured: readonly PortfolioEntityPageId[];
  archive: readonly PortfolioEntityPageId[];
  projectIndexExtras: readonly PortfolioEntityPageId[];
  workShortcuts: readonly PortfolioEntityPageId[];
  nextCase: Readonly<Partial<Record<PortfolioCasePageId, PortfolioCasePageId>>>;
}

export const portfolioPresentation = {
  flagship: [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
  ],
  // Editorial membership is deliberately empty until Wayfinder #1143 is resolved.
  featured: [],
  archive: [],
  projectIndexExtras: [
    "collection:music-photography",
  ],
  workShortcuts: [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
    "collection:music-photography",
  ],
  // Exact editorial routing stays empty until Wayfinder #1145 is resolved.
  nextCase: {},
} as const satisfies PortfolioPresentation;

export function getProjectIndexPageIds(
  presentation: PortfolioPresentation = portfolioPresentation,
): readonly PortfolioEntityPageId[] {
  return [...new Set<PortfolioEntityPageId>([
    ...presentation.flagship,
    ...presentation.featured,
    ...presentation.projectIndexExtras,
  ])];
}

export function getNextCasePageId(
  pageId: PortfolioCasePageId,
  presentation: PortfolioPresentation = portfolioPresentation,
): PortfolioCasePageId | undefined {
  return presentation.nextCase[pageId];
}

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
    ...presentation.projectIndexExtras,
    ...presentation.workShortcuts,
  ]) {
    requireEntityPage(id, pages);
  }

  assertUnique("Flagship", presentation.flagship);
  assertUnique("Featured", presentation.featured);
  assertUnique("Archive", presentation.archive);
  assertUnique("Project index", getProjectIndexPageIds(presentation));
  assertUnique("Work shortcut", presentation.workShortcuts);

  const expectedWorkShortcuts = [
    ...presentation.flagship,
    "collection:music-photography",
  ];
  if (
    presentation.workShortcuts.length !== expectedWorkShortcuts.length
    || presentation.workShortcuts.some((id, index) => id !== expectedWorkShortcuts[index])
  ) {
    throw new Error("Work shortcuts must be exactly the current Flagships followed by Shootings");
  }

  const mainTier = new Set<string>([
    ...getProjectIndexPageIds(presentation),
  ]);
  for (const id of presentation.featured) {
    if (presentation.flagship.includes(id)) {
      throw new Error(`Duplicate portfolio main-tier page id: ${id}`);
    }
  }
  for (const id of presentation.archive) {
    if (mainTier.has(id)) {
      throw new Error(`Duplicate portfolio tier page id: Archive overlaps Project index at ${id}`);
    }
  }

  if (presentation.featured.length !== 0 && (
    presentation.featured.length < 3 || presentation.featured.length > 5
  )) {
    throw new Error("Featured portfolio selection must be empty while unapproved or contain 3–5 entities");
  }

  const nextCaseEntries = Object.entries(presentation.nextCase);
  if (nextCaseEntries.length !== 0 && nextCaseEntries.length !== presentation.flagship.length) {
    throw new Error("Resolved next-Case routing must cover every Flagship exactly once");
  }

  if (nextCaseEntries.length !== 0) {
    for (const flagshipId of presentation.flagship) {
      if (!(flagshipId in presentation.nextCase)) {
        throw new Error(`Resolved next-Case routing must cover every Flagship exactly once: missing ${flagshipId}`);
      }
    }
  }

  for (const [sourceId, targetId] of nextCaseEntries) {
    const source = requireEntityPage(sourceId, pages);
    const target = requireEntityPage(targetId, pages);
    if (source.type !== "case" || target.type !== "case") {
      throw new Error(`Next-case routing must connect Case pages: ${sourceId} -> ${targetId}`);
    }
    if (sourceId === targetId) {
      throw new Error(`Next-case routing cannot point to itself: ${sourceId}`);
    }
  }
}
