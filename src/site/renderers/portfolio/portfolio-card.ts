import { renderPortfolioEntityCard } from "../../../components/composition/portfolio-entity-card.ts";
import { projectCardPresentations } from "../../../data/projects.ts";
import { petProjectCards } from "../../../data/subproject-cards.ts";
import { renderSubprojectCard } from "../../../templates/subproject-card.ts";
import type { PortfolioEntityPageId } from "../../pages/portfolio-presentation.ts";
import { sitePages } from "../../pages/manifest.ts";

function requirePortfolioPage(pageId: PortfolioEntityPageId) {
  const page = sitePages.find((candidate) => candidate.id === pageId && candidate.enabled);
  if (!page || (page.type !== "case" && page.type !== "project" && page.type !== "collection")) {
    throw new Error(`Portfolio card page is unavailable: ${pageId}`);
  }
  return page;
}

export function renderPortfolioCardListItem(pageId: PortfolioEntityPageId): string {
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

  throw new Error(`Portfolio card presentation is unavailable: ${pageId}`);
}
