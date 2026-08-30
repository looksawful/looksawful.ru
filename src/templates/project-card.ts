import { projectIndexMediaAssetFor } from "../data/media/assets/project-index.ts";
import { responsiveImageSrcSet } from "../data/media/responsive.ts";
import type { ProjectCardData } from "../data/projects.ts";
import { renderRevealAttribute } from "../motion-contract.ts";
import { getProjectCardHref } from "../site/pages/project-card-routes.ts";
import { escapeHtml } from "../utils/html.ts";

export interface ProjectCardRenderOptions {
  href?: string;
}

export function renderProjectCard(
  project: ProjectCardData,
  optionsOrIndex: ProjectCardRenderOptions | number = {},
): string {
  const options = typeof optionsOrIndex === "number" ? {} : optionsOrIndex;
  const href = options.href ?? getProjectCardHref(project.id);

  const ariaLabel = project.ariaLabel ?? `Перейти к проекту ${project.title}`;
  const coverAsset = projectIndexMediaAssetFor(project);
  const coverSrcset = responsiveImageSrcSet(coverAsset);
  const responsiveAttributes = coverSrcset
    ? ` sizes="(min-width: 44rem) 50vw, 100vw" srcset="${escapeHtml(coverSrcset)}"`
    : "";

  const role = project.role
    ? `<span class="project-card__role">${escapeHtml(project.role)}</span>`
    : "";

  const period = project.period
    ? `<span class="project-card__period">${escapeHtml(project.period)}</span>`
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
              alt="${escapeHtml(project.cover.alt)}"
              decoding="async"
              height="${project.cover.height}"
              ${responsiveAttributes}
              src="${escapeHtml(project.cover.src)}"
              width="${project.cover.width}"
            >
          </div>

          <figcaption class="project-card__caption">
            <span class="project-card__name">${escapeHtml(project.title)}</span>
            <span class="project-card__focus">${escapeHtml(project.focus)}</span>
            ${role}
            ${period}
          </figcaption>
        </figure>
      </a>
    </li>
  `;
}
