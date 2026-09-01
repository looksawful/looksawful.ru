import { projectIndexMediaAssetFor } from "../data/media/assets/project-index.ts";
import { responsiveImageSrcSet } from "../data/media/responsive.ts";
import type { HomeCardData } from "../data/projects.ts";
import { renderRevealAttribute } from "../motion-contract.ts";
import { getHomeCardHref } from "../site/pages/project-card-routes.ts";
import { escapeHtml } from "../utils/html.ts";

export interface ProjectCardRenderOptions {
  href?: string;
}

export function renderProjectCard(
  card: HomeCardData,
  optionsOrIndex: ProjectCardRenderOptions | number = {},
): string {
  const options = typeof optionsOrIndex === "number" ? {} : optionsOrIndex;
  const href = options.href ?? getHomeCardHref(card);

  const ariaLabel = card.ariaLabel ?? (card.title ? `Перейти к проекту ${card.title}` : "Перейти к проекту");
  const coverAsset = projectIndexMediaAssetFor(card);
  const coverSrcset = responsiveImageSrcSet(coverAsset);
  const responsiveAttributes = coverSrcset
    ? ` sizes="(min-width: 44rem) 50vw, 100vw" srcset="${escapeHtml(coverSrcset)}"`
    : "";

  const role = card.role
    ? `<span class="project-card__role">${escapeHtml(card.role)}</span>`
    : "";

  const period = card.period
    ? `<span class="project-card__period">${escapeHtml(card.period)}</span>`
    : "";
  const title = card.title
    ? `<span class="project-card__name">${escapeHtml(card.title)}</span>`
    : "";
  const focus = card.focus
    ? `<span class="project-card__focus">${escapeHtml(card.focus)}</span>`
    : "";

  return `
    <li>
      <a
        class="project-card"
        ${renderRevealAttribute("card")}
        href="${escapeHtml(href)}"
        aria-label="${escapeHtml(ariaLabel)}"
      >
        <figure class="project-card__figure">
          <div class="project-card__media">
            <img
              alt="${escapeHtml(card.cover.alt)}"
              decoding="async"
              height="${card.cover.height}"
              ${responsiveAttributes}
              src="${escapeHtml(card.cover.src)}"
              width="${card.cover.width}"
            >
          </div>

          <figcaption class="project-card__caption">
            ${title}
            ${focus}
            ${role}
            ${period}
          </figcaption>
        </figure>
      </a>
    </li>
  `;
}
