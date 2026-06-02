import { CV_PROJECTS } from "./cv-data.js";

const toClassName = (parts) => parts.filter(Boolean).join(" ");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeChip = (item) => (typeof item === "string" ? { label: item } : item);

const renderRoleChips = (roles = []) => `
  <ul class="cv-role-chips">
    ${roles.map((role) => `<li><span class="cv-role-chip">${escapeHtml(role)}</span></li>`).join("")}
  </ul>
`;

const renderLogo = (logo) => {
  if (!logo) {
    return "";
  }

  const className = toClassName(["cv-project-logo", logo.modifier && `cv-project-logo--${logo.modifier}`]);

  if (logo.type === "canvas") {
    return `
      <figure class="${className}">
        <canvas id="${escapeHtml(logo.canvasId)}" data-cv-visual-demo="${escapeHtml(logo.visualDemo)}"></canvas>
      </figure>
    `;
  }

  return `
    <figure class="${className}">
      <img data-cv-logo="${escapeHtml(logo.name)}" alt="" loading="lazy" decoding="async" />
    </figure>
  `;
};

const renderProjectCopy = (paragraphs = []) =>
  paragraphs.length
    ? `
      <div class="cv-project-copy">
        ${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
      </div>
    `
    : "";

const renderProjectHeader = (project) => `
  <div class="cv-experience__project">
    <div class="cv-experience__title-line">
      <h3>${escapeHtml(project.title)}</h3>
    </div>
    ${project.period ? `<time class="cv-project-period">${escapeHtml(project.period)}</time>` : ""}
    ${renderRoleChips(project.roles)}
    ${renderProjectCopy(project.copy)}
    ${
      project.summary
        ? `
          <div class="cv-experience__summary">
            <p>${escapeHtml(project.summary)}</p>
          </div>
        `
        : ""
    }
    ${project.variant === "compact" ? renderWorkToggle(project) : ""}
  </div>
`;

const renderWorkToggle = (project) => `
  <button class="cv-work-toggle" type="button" aria-expanded="false" aria-controls="${escapeHtml(project.detailsId)}">
    <span class="cv-work-toggle__text">подробнее</span>
    <span class="cv-work-toggle__icon" aria-hidden="true"></span>
  </button>
`;

const renderTaskChip = (item) => {
  const chip = normalizeChip(item);
  const demoAttribute = chip.demoId ? ` data-demo-id="${escapeHtml(chip.demoId)}"` : "";
  const className = chip.demoId ? "cv-task-chip cv-task-chip--filled" : "cv-task-chip";

  return `<li><span class="${className}"${demoAttribute}>${escapeHtml(chip.label)}</span></li>`;
};

const renderAnimationPreview = (animation) => {
  if (!animation) {
    return "";
  }

  return `
    <section class="cv-preview" data-cv-animation="${escapeHtml(animation.type)}">
      <canvas id="${escapeHtml(animation.canvasId)}" class="cv-canvas"></canvas>
    </section>
  `;
};

const normalizeGroups = (domain) =>
  domain.groups ?? [
    {
      title: domain.groupTitle,
      chips: domain.chips,
      animation: domain.animation,
    },
  ];

const renderTaskGroup = (group) => `
  <div class="cv-task-group">
    ${group.title ? `<h5 class="cv-task-group__title">${escapeHtml(group.title)}</h5>` : ""}
    <ul class="cv-task-chips">
      ${(group.chips ?? []).map(renderTaskChip).join("")}
    </ul>
    ${renderAnimationPreview(group.animation)}
  </div>
`;

const renderTaskDomain = (domain) => `
  <section class="cv-task-domain" data-task-area="${escapeHtml(domain.area)}">
    <h4 class="cv-task-domain__title">${escapeHtml(domain.title)}</h4>
    ${normalizeGroups(domain).map(renderTaskGroup).join("")}
  </section>
`;

const renderTaskDomains = (domains = []) => `
  <div class="cv-task-domains">
    ${domains.map(renderTaskDomain).join("")}
  </div>
`;

const renderTaskArea = (project) => {
  const attributes =
    project.variant === "compact"
      ? ` class="cv-task-area cv-task-area--details" id="${escapeHtml(project.detailsId)}" hidden`
      : ` class="cv-task-area"`;

  return `
    <div${attributes}>
      ${renderTaskDomains(project.domains)}
    </div>
  `;
};

const renderFeaturedProject = (project) => `
  <article class="cv-experience__item cv-experience__item--featured">
    ${renderLogo(project.logo)}
    ${renderProjectHeader(project)}
    ${renderTaskArea(project)}
  </article>
`;

const renderCompactProject = (project) => `
  <article class="cv-experience__item cv-experience__item--compact">
    ${renderProjectHeader(project)}
    ${renderTaskArea(project)}
    <time class="cv-experience__year">${escapeHtml(project.year)}</time>
  </article>
`;

const renderProject = (project) =>
  project.variant === "compact" ? renderCompactProject(project) : renderFeaturedProject(project);

export function renderCvExperience(root = document) {
  const target = root.querySelector("[data-cv-experience]");

  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.innerHTML = CV_PROJECTS.map(renderProject).join("");
}
