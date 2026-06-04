import { PET_PROJECTS, getPetProjectBySlug } from "./pet-project-data.js";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const iconSvg = (body, viewBox = "0 0 24 24") => `
  <svg class="pet-tech-list__icon" viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>
`;

const TECH_ICONS = {
  electron: iconSvg('<circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(120 12 12)"/>'),
  typescript: iconSvg('<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M8 9h8M12 9v9M16.5 13.6c-.5-.35-1-.52-1.62-.52-.78 0-1.18.28-1.18.72 0 .48.45.66 1.38.86 1.58.34 2.5.9 2.5 2.25 0 1.42-1.12 2.33-3.02 2.33-1.08 0-2.04-.28-2.86-.88" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'),
  css: iconSvg('<path d="M5 3h14l-1.25 15.1L12 21l-5.75-2.9L5 3Z" fill="currentColor"/><path d="M9 8h7l-.24 2.2H9.2L9.4 12H15.5l-.44 4.6L12 18.1l-3.05-1.5-.18-2.1h2.1l.08.84 1.05.52 1.08-.52.12-1.34H8.68L8 6h8.2l-.2 2H9Z" fill="#fff"/>'),
  windows: iconSvg('<path d="M3 5.2 10.1 4v7.3H3V5.2Zm8.4-1.4L21 2.2v9.1h-9.6V3.8ZM3 12.7h7.1V20L3 18.8v-6.1Zm8.4 0H21v9.1l-9.6-1.6v-7.5Z" fill="currentColor"/>'),
  autohotkey: iconSvg('<rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor"/><path d="M7 16V8h2v3h4V8h2v8h-2v-3.2H9V16H7Zm9.5 0V8H19v8h-2.5Z" fill="#fff"/>'),
  hotkeys: iconSvg('<rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 9h2M11 9h2M15 9h2M7 13h6M15 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  python: iconSvg('<path d="M12 3c3 0 4.2 1.1 4.2 3.2v2.2H10.5c-2.2 0-4 1.4-4 3.6v1H4.8C3.2 13 2 11.7 2 9.7 2 5.4 5.7 3 12 3Z" fill="currentColor"/><path d="M12 21c-3 0-4.2-1.1-4.2-3.2v-2.2h5.7c2.2 0 4-1.4 4-3.6v-1h1.7c1.6 0 2.8 1.3 2.8 3.3C22 18.6 18.3 21 12 21Z" fill="currentColor" opacity=".65"/><circle cx="8.2" cy="6.4" r="1" fill="#fff"/><circle cx="15.8" cy="17.6" r="1" fill="#fff"/>'),
  cli: iconSvg('<rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor"/><path d="m7 10 3 2-3 2M12 15h5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  canvas: iconSvg('<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 15c2-4 4-4 6-1 1.2 1.8 2 .8 4-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  javascript: iconSvg('<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M8 16.2c.38.62.82.92 1.52.92.84 0 1.28-.46 1.28-1.38V9h2.02v6.78c0 2-1.16 3.08-3.12 3.08-1.48 0-2.48-.58-3.18-1.72l1.48-.94Zm6.28.7c.7.7 1.42 1.02 2.26 1.02.82 0 1.28-.32 1.28-.86 0-.58-.48-.8-1.58-1.04-1.62-.36-2.58-.98-2.58-2.56 0-1.48 1.16-2.58 3.02-2.58 1.22 0 2.18.36 2.92 1.1l-1.08 1.36c-.56-.52-1.12-.76-1.78-.76-.72 0-1.1.28-1.1.76 0 .52.44.7 1.5.94 1.78.4 2.72 1.02 2.72 2.64 0 1.56-1.18 2.7-3.26 2.7-1.42 0-2.54-.44-3.42-1.3l1.1-1.44Z" fill="#fff"/>'),
  motion: iconSvg('<path d="M5 12h7M5 7h12M5 17h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m15 13 4 4m0 0-4 4m4-4H11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
};

const getTechIcon = (technology = "") => {
  const key = technology.toLowerCase();

  if (key.includes("electron")) return TECH_ICONS.electron;
  if (key.includes("typescript")) return TECH_ICONS.typescript;
  if (key === "css") return TECH_ICONS.css;
  if (key.includes("windows")) return TECH_ICONS.windows;
  if (key.includes("autohotkey")) return TECH_ICONS.autohotkey;
  if (key.includes("горяч")) return TECH_ICONS.hotkeys;
  if (key.includes("python")) return TECH_ICONS.python;
  if (key.includes("cli")) return TECH_ICONS.cli;
  if (key.includes("canvas")) return TECH_ICONS.canvas;
  if (key.includes("javascript")) return TECH_ICONS.javascript;
  if (key.includes("анима")) return TECH_ICONS.motion;

  return iconSvg('<circle cx="12" cy="12" r="7" fill="currentColor"/>');
};

const renderTechChips = (technologies = [], className = "pet-tech-list") => `
  <ul class="${className}">
    ${technologies.map((technology) => `<li>${getTechIcon(technology)}<span>${escapeHtml(technology)}</span></li>`).join("")}
  </ul>
`;

const renderCodeLines = (lines = []) =>
  lines
    .map((line) => `<span class="ds-code-visual__line"><span>${escapeHtml(line)}</span></span>`)
    .join("");

const renderCodeVisual = (project) => `
  <div class="ds-code-visual pet-code-visual" aria-label="пример кода и иллюстрация">
    <pre class="ds-code-visual__code pet-code"><code>${renderCodeLines(project.commands)}</code></pre>
    <figure class="ds-code-visual__preview pet-code-visual__preview">
      <div class="ds-code-visual__media pet-code-visual__media" aria-hidden="true">
        <span class="ds-code-visual__shape"></span>
      </div>
      <figcaption class="ds-code-visual__caption ds-caption">подпись</figcaption>
    </figure>
  </div>
`;

const renderPetProjectCard = (project) => `
  <a class="pet-card pet-card--${escapeHtml(project.tone)}" href="/pet-projects/${escapeHtml(project.slug)}/">
    <div class="pet-card__cover" data-asset-path="${escapeHtml(project.paths.cardBanner)}" aria-hidden="true"></div>
    <div class="pet-card__body">
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.description)}</p>
      ${renderTechChips(project.technologies)}
      <span class="pet-card__github">${escapeHtml(project.githubLabel)}</span>
    </div>
  </a>
`;

export const renderPetProjectsSection = () => `
  <section class="pet-projects" id="pet-projects" aria-labelledby="pet-projects-title">
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
  <section class="pet-page-section pet-page-section--split ds-split ds-split--two-column">
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
  <section class="pet-page-section pet-page-section--two-column pet-page-section--media-left pet-page-section--two-column-compact ds-split ds-split--two-column ds-split--media-left ds-split--two-column-compact" id="screenshots">
    <div class="pet-section-heading">
      <h2>материалы и скриншоты</h2>
      <p>Пустые светлые контейнеры под будущие горизонтальные изображения проекта.</p>
    </div>
    <div class="pet-media-grid">
      ${project.mediaPlan
        .map(
          (_label, index) => `
            <div class="pet-media-slot ds-evidence" data-asset-path="${escapeHtml(project.paths.screenshots)}screen-${String(index + 1).padStart(2, "0")}.png"></div>
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
        <div class="pet-live-preview__stage ds-evidence" data-asset-path="${escapeHtml(project.paths.preview)}" aria-hidden="true"></div>
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
      ${renderCodeVisual(project)}
    </article>
  </section>
`;

const renderReadme = (project) => `
  <section class="pet-page-section pet-page-section--readme ds-split ds-split--two-column" id="readme">
    <div>
      <h2>README-коротко</h2>
      ${project.readme.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
    <aside class="pet-paths ds-table-lite">
      <h3>куда класть файлы</h3>
      <dl>
        <div class="ds-table-lite__row"><dt>логотипы</dt><dd>${escapeHtml(project.paths.logos)}</dd></div>
        <div class="ds-table-lite__row"><dt>баннер</dt><dd>${escapeHtml(project.paths.hero)}</dd></div>
        <div class="ds-table-lite__row"><dt>скриншоты</dt><dd>${escapeHtml(project.paths.screenshots)}</dd></div>
        <div class="ds-table-lite__row"><dt>архивы</dt><dd>${escapeHtml(project.paths.downloads)}</dd></div>
        ${project.paths.preview ? `<div class="ds-table-lite__row"><dt>превью</dt><dd>${escapeHtml(project.paths.preview)}</dd></div>` : ""}
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
