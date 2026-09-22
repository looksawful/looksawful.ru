import { renderPortfolioEntityCard } from "../../components/composition/portfolio-entity-card.ts";
import { getCase, getProject } from "../../data/catalog/lookup.ts";
import { projectCardPresentations } from "../../data/projects.ts";
import { petProjectCards } from "../../data/subproject-cards.ts";
import { renderSubprojectCard } from "../../templates/subproject-card.ts";
import {
  getProjectIndexPageIds,
  portfolioPresentation,
  type PortfolioEntityPageId,
  type PortfolioPresentation,
} from "../pages/portfolio-presentation.ts";
import { sitePages } from "../pages/manifest.ts";
import type { WorkPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

function requirePortfolioPage(pageId: PortfolioEntityPageId) {
  const page = sitePages.find((candidate) => candidate.id === pageId && candidate.enabled);
  if (!page || (page.type !== "case" && page.type !== "project" && page.type !== "collection")) {
    throw new Error(`Work index page is unavailable: ${pageId}`);
  }
  return page;
}

function renderPortfolioCard(pageId: PortfolioEntityPageId): string {
  const page = requirePortfolioPage(pageId);
  const projectCard = projectCardPresentations.find((candidate) => candidate.pageId === pageId);

  if (projectCard) {
    return renderPortfolioEntityCard(projectCard, {
      ...(page.type === "collection" ? { typeLabel: "Collection" } : {}),
    });
  }

  if (page.type === "project") {
    const teaser = petProjectCards.find((candidate) => candidate.id === page.entityId);
    if (teaser) {
      return `<li>${renderSubprojectCard({ ...teaser, href: page.path }, { reveal: true })}</li>`;
    }
  }

  throw new Error(`Work index is missing an existing card presentation for ${pageId}`);
}

function renderProjectIndex(presentation: PortfolioPresentation): string {
  return getProjectIndexPageIds(presentation)
    .map(renderPortfolioCard)
    .join("\n");
}

function archiveSortValue(pageId: PortfolioEntityPageId): number {
  const page = requirePortfolioPage(pageId);
  const date = page.type === "case"
    ? getCase(page.entityId).date
    : page.type === "project"
      ? getProject(page.entityId).date
      : undefined;

  return Number(date?.match(/\d{4}/)?.[0] ?? 0);
}

function renderArchive(presentation: PortfolioPresentation): string {
  if (presentation.archive.length === 0) return "";

  const cards = [...presentation.archive]
    .sort((left, right) => archiveSortValue(right) - archiveSortValue(left))
    .map(renderPortfolioCard)
    .join("\n");

  return `<details class="projects-grid" data-work-archive>
    <summary>Archive</summary>
    <ol class="projects-grid__list" data-reveal-group>
      ${cards}
    </ol>
  </details>`;
}

export function renderWorkPage(
  page: WorkPageDefinition,
  presentation: PortfolioPresentation = portfolioPresentation,
): string {
  return renderPageShell({
    page,
    title: "work — Иван Крушинский",
    description: "Selected portfolio work by Ivan Krushinsky.",
    content: `<section class="projects-grid" aria-labelledby="work-index-title">
  <h1 id="work-index-title">work</h1>
  <ol class="projects-grid__list" data-reveal-group>
    ${renderProjectIndex(presentation)}
  </ol>
</section>
${renderArchive(presentation)}`,
  });
}
