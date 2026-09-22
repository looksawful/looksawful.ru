import { renderJesteiTrackFilter } from "../../components/specialized/index.ts";
import { entityPageContentRegistry, getEntityPageContent } from "../../content/pages/index.ts";
import { getCase, getCollection, getProject } from "../../data/catalog/lookup.ts";
import { escapeHtml } from "../../utils/html.ts";
import {
  getEntityShellPresentation,
  getEntityStandalonePresentation,
} from "../pages/entity-presentation.ts";
import {
  getNextCasePageId,
  portfolioPresentation,
  type PortfolioPresentation,
} from "../pages/portfolio-presentation.ts";
import { sitePages } from "../pages/manifest.ts";
import { getEntitySearchPresentation } from "../pages/search-presentation.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import { renderEntityShell } from "./entity/entity-shell.ts";

function getEntityPageCopy(page: EntityPageDefinition): { title: string; description: string } {
  const searchPresentation = getEntitySearchPresentation(page.id);
  if (searchPresentation) return searchPresentation;

  if (page.type === "case") {
    const entity = getCase(page.entityId);
    const name = entity.name || page.entityId;
    return { title: `${name} — Иван Крушинский`, description: entity.description || entity.summary || name };
  }
  if (page.type === "collection") {
    const entity = getCollection(page.entityId);
    const name = entity.displayName || entity.name || page.entityId;
    return { title: `${name} — Иван Крушинский`, description: entity.description || entity.summary || name };
  }

  const entity = getProject(page.entityId);
  const name = entity.name || page.entityId;
  return { title: `${name} — Иван Крушинский`, description: entity.description || entity.summary || name };
}

function renderNextCaseFooter(
  page: Extract<EntityPageDefinition, { type: "case" }>,
  presentation: PortfolioPresentation,
): string {
  const targetId = getNextCasePageId(page.id, presentation);
  if (!targetId) return "";

  const targetPage = sitePages.find(
    (candidate) => candidate.id === targetId && candidate.type === "case" && candidate.enabled,
  );
  if (!targetPage || targetPage.type !== "case") {
    throw new Error(`Next Case page is unavailable: ${targetId}`);
  }

  const targetCase = getCase(targetPage.entityId);
  const targetName = targetCase.name || targetPage.entityId;

  return `<footer class="project__footer cluster" data-reveal-group data-next-case>
    <a class="project__next-case" href="${escapeHtml(targetPage.path)}">
      <span>Next case</span>
      <span>${escapeHtml(targetName)}</span>
    </a>
  </footer>`;
}

function renderCanonicalEntityArticle(
  page: EntityPageDefinition,
  portfolioState: PortfolioPresentation,
): string {
  const content = getEntityPageContent(entityPageContentRegistry, page.id);
  const shellPresentation = getEntityShellPresentation(page.id);
  const standalonePresentation = getEntityStandalonePresentation(page.id);
  const pagePresentation =
    page.type === "case" || page.type === "project"
      ? {
          ...standalonePresentation,
          intro: { ...standalonePresentation.intro, head: false },
        }
      : standalonePresentation;

  return renderEntityShell(content, {
    ...shellPresentation,
    standalonePresentation: pagePresentation,
    introHeadingLevel: 1,
    footerHtml: page.type === "case" ? renderNextCaseFooter(page, portfolioState) : "",
    specialized: { jesteiTrackFilter: renderJesteiTrackFilter },
  });
}

export function renderStandaloneEntityPage(
  page: EntityPageDefinition,
  portfolioState: PortfolioPresentation = portfolioPresentation,
): string {
  const article = renderCanonicalEntityArticle(page, portfolioState);
  const copy = getEntityPageCopy(page);
  return renderPageShell({ page, title: copy.title, description: copy.description, content: article });
}
