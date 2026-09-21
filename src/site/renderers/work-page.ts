import { getProject, getRole } from "../../data/catalog/lookup.ts";
import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../../data/media/index.ts";
import { projectCardPresentations } from "../../data/projects.ts";
import { petProjectCards } from "../../data/subproject-cards.ts";
import { renderRevealAttribute } from "../../motion-contract.ts";
import { renderProjectCard } from "../../templates/project-card.ts";
import { escapeHtml } from "../../utils/html.ts";
import {
  portfolioPresentation,
  type PortfolioEntityPageId,
} from "../pages/portfolio-presentation.ts";
import { sitePages } from "../pages/manifest.ts";
import type { WorkPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

const archiveCoverEntryByPageId: Partial<Record<PortfolioEntityPageId, MediaEntryId>> = {
  "project:berry-social-content-2020": "berry-02-source-01-9x16-use-01",
};

function requirePortfolioPage(pageId: PortfolioEntityPageId) {
  const page = sitePages.find((candidate) => candidate.id === pageId && candidate.enabled);
  if (!page || (page.type !== "case" && page.type !== "project" && page.type !== "collection")) {
    throw new Error(`Work index page is unavailable: ${pageId}`);
  }
  return page;
}

function projectRole(pageId: PortfolioEntityPageId): string {
  if (!pageId.startsWith("project:")) return "";
  const project = getProject(pageId.slice("project:".length) as Parameters<typeof getProject>[0]);
  if (project.primaryRoleLabel) return project.primaryRoleLabel;
  return project.primaryRoleId ? getRole(project.primaryRoleId).name : "";
}

function renderProjectEntityCard(pageId: PortfolioEntityPageId, compact = false): string {
  const page = requirePortfolioPage(pageId);
  if (page.type !== "project") {
    throw new Error(`Generic Work card currently requires a Project page: ${pageId}`);
  }

  const project = getProject(page.entityId);
  const pet = petProjectCards.find((candidate) => candidate.id === page.entityId);
  const coverEntryId = pet?.coverEntryId ?? archiveCoverEntryByPageId[pageId];
  if (!coverEntryId) throw new Error(`Work card is missing a cover MediaEntry: ${pageId}`);

  const entry = getMediaEntry(coverEntryId);
  const asset = getMediaAsset(entry.assetId);
  if (asset.type !== "image") throw new Error(`Work card cover must be an image: ${pageId}`);

  const title = project.name || page.entityId;
  const focus = pet?.description ?? project.summary ?? "";
  const role = projectRole(pageId);
  const period = project.date ?? "";
  const compactAttr = compact ? ' data-work-card="archive"' : "";

  return `
    <li${compactAttr}>
      <a
        class="project-card"
        ${renderRevealAttribute("card")}
        href="${escapeHtml(page.path)}"
        aria-label="${escapeHtml(`Перейти к проекту ${title}`)}"
      >
        <figure class="project-card__figure">
          <div class="project-card__media">
            <img
              alt="${escapeHtml(entry.alt ?? title)}"
              decoding="async"
              height="${asset.height}"
              loading="lazy"
              src="${escapeHtml(asset.src)}"
              width="${asset.width}"
            >
          </div>
          <figcaption class="project-card__caption">
            <span class="project-card__name">${escapeHtml(title)}</span>
            ${focus ? `<span class="project-card__focus">${escapeHtml(focus)}</span>` : ""}
            ${role ? `<span class="project-card__role">${escapeHtml(role)}</span>` : ""}
            ${period ? `<span class="project-card__period">${escapeHtml(period)}</span>` : ""}
          </figcaption>
        </figure>
      </a>
    </li>
  `;
}

function renderProjectIndexCard(pageId: PortfolioEntityPageId): string {
  const card = projectCardPresentations.find((candidate) => candidate.pageId === pageId);
  if (card) {
    return renderProjectCard(card, {
      ...(pageId.startsWith("collection:") ? { typeLabel: "Collection" } : {}),
    });
  }

  return renderProjectEntityCard(pageId);
}

function renderProjectIndex(): string {
  return portfolioPresentation.projectIndex
    .map(renderProjectIndexCard)
    .join("\n");
}

function archiveSortValue(pageId: PortfolioEntityPageId): number {
  const page = requirePortfolioPage(pageId);
  if (page.type !== "project") return 0;
  const date = getProject(page.entityId).date ?? "";
  return Number(date.match(/\d{4}/)?.[0] ?? 0);
}

function renderArchive(): string {
  const archive = [...portfolioPresentation.archive]
    .sort((left, right) => archiveSortValue(right) - archiveSortValue(left))
    .map((pageId) => renderProjectEntityCard(pageId, true))
    .join("\n");

  if (!archive) return "";

  return `<details class="projects-grid" data-work-archive>
    <summary>Archive</summary>
    <ol class="projects-grid__list" data-reveal-group>
      ${archive}
    </ol>
  </details>`;
}

export function renderWorkPage(page: WorkPageDefinition): string {
  return renderPageShell({
    page,
    title: "work — Иван Крушинский",
    description: "Selected portfolio work by Ivan Krushinsky.",
    content: `<section class="projects-grid" aria-labelledby="work-index-title">
  <h1 id="work-index-title">work</h1>
  <ol class="projects-grid__list" data-reveal-group>
    ${renderProjectIndex()}
  </ol>
</section>
${renderArchive()}`,
  });
}
