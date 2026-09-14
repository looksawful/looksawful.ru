import type {
  ComingSoonPetProject,
  LivePetProject,
  PetProject,
} from "../data/pet-projects.ts";
import { escapeHtml } from "../utils/html.ts";

export type RenderablePetProject = LivePetProject | ComingSoonPetProject;

export interface PetProjectRenderOptions {
  /**
   * Media is presentation data, not project identity. Production can resolve
   * canonical MediaEntry records; Lab can inject reviewed preview material.
   */
  renderCover: (project: RenderablePetProject) => string;
  /** Lab-only adapters may keep links inside the approval environment. */
  resolveHref?: (project: LivePetProject) => string | undefined;
  heading?: string;
  headingId?: string;
  className?: string;
}

function renderBadge(project: RenderablePetProject): string {
  if (project.status === "coming-soon") {
    return '<span class="pet-project-card__badge" data-badge="coming-soon">COMING SOON</span>';
  }

  if (project.badge === "new") {
    return '<span class="pet-project-card__badge" data-badge="new">NEW</span>';
  }

  return "";
}

function renderDescription(project: RenderablePetProject): string {
  if (!project.description) return "";
  return `<p class="pet-project-card__description">${escapeHtml(project.description)}</p>`;
}

export function renderPetProjectCard(
  project: RenderablePetProject,
  options: PetProjectRenderOptions,
): string {
  const content = `
    <div class="pet-project-card__surface">
      <figure class="pet-project-card__figure">
        <div class="pet-project-card__media">
          ${options.renderCover(project)}
          ${renderBadge(project)}
        </div>
        <figcaption class="pet-project-card__caption">
          <h3 class="pet-project-card__title">${escapeHtml(project.title)}</h3>
          ${renderDescription(project)}
        </figcaption>
      </figure>
    </div>
  `;

  const attributes = [
    'class="pet-project-card"',
    `data-pet-project-id="${escapeHtml(project.id)}"`,
    `data-status="${project.status}"`,
    `data-kind="${project.kind}"`,
  ].join(" ");

  if (project.status === "coming-soon") {
    return `<article ${attributes}>${content}</article>`;
  }

  const href = options.resolveHref?.(project) ?? project.href;
  const external = /^https?:\/\//.test(href);
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a ${attributes} href="${escapeHtml(href)}"${target}>${content}</a>`;
}

export function renderPetProjects(
  projects: readonly PetProject[],
  options: PetProjectRenderOptions,
): string {
  const visible = projects.filter(
    (project): project is RenderablePetProject => project.status !== "hidden",
  );
  const heading = options.heading ?? "Полезное";
  const headingId = options.headingId ?? "pet-projects-title";
  const classNames = ["pet-projects", options.className].filter(Boolean).join(" ");

  return `
    <section class="${escapeHtml(classNames)}" aria-labelledby="${escapeHtml(headingId)}" data-pet-projects>
      <header class="pet-projects__head">
        <h2 class="pet-projects__title" id="${escapeHtml(headingId)}">${escapeHtml(heading)}</h2>
      </header>
      <div class="pet-projects__reel" data-pet-projects-reel>
        ${visible.map((project) => renderPetProjectCard(project, options)).join("\n")}
      </div>
    </section>
  `;
}
