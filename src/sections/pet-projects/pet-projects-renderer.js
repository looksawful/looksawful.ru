import { PET_PROJECTS, getPetProjectBySlug } from "./pet-project-data.js";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderTechChips = (technologies = [], className = "pet-tech-list") => `
  <ul class="${className}">
    ${technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("")}
  </ul>
`;

const renderPetProjectCard = (project) => `
  <a class="pet-card pet-card--${escapeHtml(project.tone)}" href="/pet-projects/${escapeHtml(project.slug)}/">
    <div class="pet-card__cover" data-asset-path="${escapeHtml(project.paths.cardBanner)}" aria-hidden="true"></div>
    <div class="pet-card__body">
      <div class="pet-card__meta">
        <span>пет-проект</span>
        <span>${escapeHtml(project.subtitle)}</span>
      </div>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.description)}</p>
      ${renderTechChips(project.technologies)}
      <span class="pet-card__github">${escapeHtml(project.githubLabel)}</span>
    </div>
  </a>
`;

export const renderPetProjectsSection = () => `
  <section class="pet-projects" id="pet-projects" aria-labelledby="pet-projects-title">
    </div>
    <div class="pet-projects__grid">
      ${PET_PROJECTS.map(renderPetProjectCard).join("")}
    </div>
  </section>
`;

const renderBreadcrumbs = (project) => `
  <nav class="pet-breadcrumbs" aria-label="хлебные крошки">
    <a href="/">главная</a>
    <span aria-hidden="true">/</span>
    <a href="/#pet-projects">пет-проекты</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${escapeHtml(project.title)}</span>
  </nav>
`;

const renderActions = (project) => `
  <div class="pet-actions">
    <a class="pet-button pet-button--primary" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noreferrer">
      открыть GitHub
    </a>
    <a
      class="pet-button ${project.download.disabled ? "is-disabled" : ""}"
      href="${escapeHtml(project.download.href)}"
      ${project.download.disabled ? 'aria-disabled="true" tabindex="-1"' : "download"}
    >
      ${escapeHtml(project.download.label)}
    </a>
  </div>
`;

const renderHero = (project) => `
  <section class="pet-product-hero pet-product-hero--${escapeHtml(project.tone)}">
    <div class="pet-product-hero__banner" data-asset-path="${escapeHtml(project.paths.hero)}" aria-label="баннер проекта"></div>
    <div class="pet-product-hero__body">
      <div class="pet-product-hero__content">
        <h1>${escapeHtml(project.title)}</h1>
        <p class="pet-product-hero__subtitle">${escapeHtml(project.subtitle)}</p>
        <p class="pet-product-hero__description">${escapeHtml(project.description)}</p>
        ${renderTechChips(project.technologies, "pet-tech-list pet-tech-list--hero")}
        ${renderActions(project)}
      </div>
    </div>
  </section>
`;

const renderNotes = (project) => `
  <section class="pet-page-section pet-page-section--split">
    <div>
      <h2>что это</h2>
      <p>${escapeHtml(project.description)}</p>
    </div>
    <div class="pet-note-list">
      ${project.productNotes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
    </div>
  </section>
`;

const renderMediaSlots = (project) => `
  <section class="pet-page-section" id="screenshots">
    <div class="pet-section-heading">
      <h2>материалы и скриншоты</h2>
      <p>Пустые светлые контейнеры под будущие горизонтальные изображения проекта.</p>
    </div>
    <div class="pet-media-grid">
      ${project.mediaPlan
        .map(
          (_label, index) => `
            <div class="pet-media-slot" data-asset-path="${escapeHtml(project.paths.screenshots)}screen-${String(index + 1).padStart(2, "0")}.png"></div>
          `,
        )
        .join("")}
    </div>
  </section>
`;

const renderPreview = (project) => {
  if (!["hot", "moves-awful"].includes(project.slug)) {
    return "";
  }

  const title = project.slug === "hot" ? "превью тренажёра" : "превью анимаций";
  const text =
    project.slug === "hot"
      ? "Здесь можно будет встроить живой тренажёр, когда код превью будет готов."
      : "Здесь можно будет подключить canvas-сцену или набор живых галерей.";

  return `
    <section class="pet-page-section">
      <div class="pet-live-preview">
        <div>
          <h2>${title}</h2>
          <p>${text}</p>
        </div>
        <div class="pet-live-preview__stage" data-asset-path="${escapeHtml(project.paths.preview)}" aria-hidden="true"></div>
      </div>
    </section>
  `;
};

const renderInstructions = (project) => `
  <section class="pet-page-section pet-instructions" id="instructions">
    <article class="pet-instructions__article">
      <h2>инструкция</h2>
      ${project.instructions.map((step) => `<p>${escapeHtml(step)}</p>`).join("")}
      <h3>команды</h3>
      <pre class="pet-code"><code>${escapeHtml(project.commands.join("\n"))}</code></pre>
    </article>
  </section>
`;

const renderReadme = (project) => `
  <section class="pet-page-section pet-page-section--readme" id="readme">
    <div>
      <h2>README-коротко</h2>
      ${project.readme.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
    <aside class="pet-paths">
      <h3>куда класть файлы</h3>
      <dl>
        <div><dt>логотипы</dt><dd>${escapeHtml(project.paths.logos)}</dd></div>
        <div><dt>баннер</dt><dd>${escapeHtml(project.paths.hero)}</dd></div>
        <div><dt>скриншоты</dt><dd>${escapeHtml(project.paths.screenshots)}</dd></div>
        <div><dt>архивы</dt><dd>${escapeHtml(project.paths.downloads)}</dd></div>
        ${project.paths.preview ? `<div><dt>превью</dt><dd>${escapeHtml(project.paths.preview)}</dd></div>` : ""}
      </dl>
    </aside>
  </section>
`;

export function renderPetProjectPage(slug) {
  const project = getPetProjectBySlug(slug);

  if (!project) {
    return `
      <section class="pet-page pet-page--not-found">
        <div class="pet-page__inner">
          <h1>пет-проект не найден</h1>
          <p>Такой страницы пока нет.</p>
          <a class="pet-button pet-button--primary" href="/#pet-projects">вернуться к пет-проектам</a>
        </div>
      </section>
    `;
  }

  return `
    <article class="pet-page">
      <main class="pet-page__inner">
        ${renderBreadcrumbs(project)}
        ${renderHero(project)}
        ${renderNotes(project)}
        ${renderMediaSlots(project)}
        ${renderPreview(project)}
        ${renderInstructions(project)}
        ${renderReadme(project)}
      </main>
    </article>
  `;
}
