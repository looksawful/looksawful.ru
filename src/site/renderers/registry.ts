import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { renderJesteiPoolArticle } from "./cases/jestei-pool.ts";
import { renderSensetiqueArticle } from "./cases/sensetique.ts";
import { renderStyxArticle } from "./cases/styx.ts";
import { renderShootingsArticle } from "./collections/shootings.ts";
import { renderAwfulCasesArticle } from "./projects/awful-cases.ts";
import { renderBerrySocialContentArticle } from "./projects/berry-social-content-2020.ts";
import { renderMovesAwfulArticle } from "./projects/moves-awful.ts";

export type EntityArticleRenderer = (homepageTemplate: string) => string;

const caseRenderers: Partial<Record<CaseId, EntityArticleRenderer>> = {
  "jestei-pool": renderJesteiPoolArticle,
  styx: renderStyxArticle,
  sensetique: renderSensetiqueArticle,
};

const collectionRenderers: Partial<Record<CollectionId, EntityArticleRenderer>> = {
  "music-photography": renderShootingsArticle,
};

const projectRenderers: Partial<Record<ProjectId, EntityArticleRenderer>> = {
  "awful-cases": renderAwfulCasesArticle,
  "moves-awful": renderMovesAwfulArticle,
  "berry-social-content-2020": renderBerrySocialContentArticle,
};

function getEntityRenderer(page: EntityPageDefinition): EntityArticleRenderer | undefined {
  switch (page.type) {
    case "case":
      return caseRenderers[page.entityId];
    case "collection":
      return collectionRenderers[page.entityId];
    case "project":
      return projectRenderers[page.entityId];
  }
}

export function hasEntityRenderer(page: EntityPageDefinition): boolean {
  return getEntityRenderer(page) !== undefined;
}

export function renderEntityArticle(
  homepageTemplate: string,
  page: EntityPageDefinition,
): string {
  const renderer = getEntityRenderer(page);
  if (!renderer) {
    throw new Error(`No standalone renderer for ${page.type}: ${page.entityId}`);
  }
  return renderer(homepageTemplate);
}
