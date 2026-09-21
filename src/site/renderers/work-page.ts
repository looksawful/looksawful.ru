import { projectCardPresentations } from "../../data/projects.ts";
import { renderProjectCard } from "../../templates/project-card.ts";
import {
  portfolioPresentation,
  type PortfolioEntityPageId,
} from "../pages/portfolio-presentation.ts";
import type { WorkPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

function renderProjectIndexCard(pageId: PortfolioEntityPageId): string {
  const card = projectCardPresentations.find((candidate) => candidate.pageId === pageId);
  if (!card) {
    throw new Error(`Work project index is missing a ProjectCardPresentation for ${pageId}`);
  }

  return renderProjectCard(card, {
    ...(pageId.startsWith("collection:") ? { typeLabel: "Collection" } : {}),
  });
}

function renderProjectIndex(): string {
  return portfolioPresentation.projectIndex
    .map(renderProjectIndexCard)
    .join("\n");
}

export function renderWorkPage(page: WorkPageDefinition): string {
  return renderPageShell({
    page,
    title: "work — Иван Крушинский",
    description: "Selected portfolio work by Ivan Krushinsky.",
    content: `<section class="projects-grid work-index" aria-labelledby="work-index-title">
  <h1 id="work-index-title">work</h1>
  <ol class="projects-grid__list" data-reveal-group>
    ${renderProjectIndex()}
  </ol>
</section>`,
  });
}
