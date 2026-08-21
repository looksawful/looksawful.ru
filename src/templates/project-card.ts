import type { ProjectCardData } from "../data/projects.ts";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export function renderProjectCard(project: ProjectCardData): string {
  const href = `#project-${project.id}`;

  const ariaLabel = project.ariaLabel ?? `Перейти к проекту ${project.title}`;

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
        href="${escapeHtml(href)}"
        aria-label="${escapeHtml(ariaLabel)}"
      >
        <figure class="project-card__figure">
          <div class="project-card__media">
            <img
              alt="${escapeHtml(project.cover.alt)}"
              decoding="async"
              height="${project.cover.height}"
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
