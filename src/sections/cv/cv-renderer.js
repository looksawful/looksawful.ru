import { CV_PROJECTS } from "./cv-data.js";
import { renderPetProjectsSection } from "../pet-projects/pet-projects-renderer.js";

const toClassName = (parts) => parts.filter(Boolean).join(" ");

const toSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeChip = (item) => (typeof item === "string" ? { label: item } : item);
const normalizeList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const AUTO_LIST_GROUP_TITLES = ["заголовок группы 01", "заголовок группы 02", "заголовок группы 03"];
const AUTO_LIST_MIN_ITEMS = 5;

const renderRoleChips = (roles = []) => `
  <ul class="cv-role-chips">
    ${roles.map((role) => `<li><span class="cv-role-chip">${escapeHtml(role)}</span></li>`).join("")}
  </ul>
`;

const renderLogo = (logo, { hero = false } = {}) => {
  if (!logo) {
    return "";
  }

  const className = toClassName([
    "cv-project-logo",
    hero && "cv-project-logo--hero",
    logo.modifier && `cv-project-logo--${logo.modifier}`,
  ]);

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

const renderProjectHero = (project) => `
  <section class="cv-project-hero cv-project-hero--${escapeHtml(project.logo?.modifier || "default")}">
    <div class="cv-project-hero__banner" aria-hidden="true"></div>
    <div class="cv-project-hero__body">
      ${renderLogo(project.logo, { hero: true })}
      <div class="cv-project-hero__content">
        <div class="cv-experience__title-line">
          <h3>${escapeHtml(project.title)}</h3>
        </div>
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
      </div>
      ${project.period ? `<time class="cv-project-period cv-project-period--hero">${escapeHtml(project.period)}</time>` : ""}
    </div>
  </section>
`;

const renderProjectHeader = (project) => `
  <div class="cv-experience__project">
    <div class="cv-experience__title-line">
      <h3>${escapeHtml(project.title)}</h3>
    </div>
    ${project.period ? `<time class="cv-project-period">${escapeHtml(project.period)}</time>` : ""}
    ${renderRoleChips(project.roles)}
    ${
      project.summary
        ? `
          <div class="cv-experience__summary">
            <p>${escapeHtml(project.summary)}</p>
          </div>
        `
        : renderProjectCopy(project.copy)
    }
  </div>
`;

const renderTaskChip = (item) => {
  const chip = normalizeChip(item);
  return `<li><span class="cv-task-chip">${escapeHtml(chip.label)}</span></li>`;
};

const renderTaskListItem = (item) => {
  const chip = normalizeChip(item);
  return `<li><span class="cv-task-list-item">${escapeHtml(chip.label)}</span></li>`;
};

const renderMediaCaption = (caption) =>
  typeof caption === "string" && caption.trim()
    ? `<p class="cv-media-caption ds-caption">${escapeHtml(caption.trim())}</p>`
    : "";

const renderAnimationPreview = (animation) => {
  if (!animation) {
    return "";
  }

  const className = toClassName([
    "cv-preview",
    animation.tone && `cv-preview--${animation.tone}`,
    animation.size && `cv-preview--${animation.size}`,
  ]);
  const sceneAttribute = animation.scene ? ` data-cv-animation-scene="${escapeHtml(animation.scene)}"` : "";
  const variantAttribute = animation.variant ? ` data-cv-animation-variant="${escapeHtml(animation.variant)}"` : "";

  if (animation.type === "placeholder") {
    return `
      <section class="${toClassName([className, "cv-preview--placeholder", "ds-evidence"])}" aria-label="${escapeHtml(animation.label || "пустая canvas-область")}">
        <span class="cv-preview__placeholder" aria-hidden="true"></span>
        ${renderMediaCaption(animation.caption)}
      </section>
    `;
  }

  if (animation.type === "video-placeholder") {
    return `
      <section class="${toClassName([className, "cv-preview--video-placeholder", "ds-evidence"])}" aria-label="${escapeHtml(animation.label || "видео")}">
        <div class="cv-video-placeholder">
          <span class="cv-video-placeholder__label">${escapeHtml(animation.label || "видео")}</span>
          <button class="cv-video-placeholder__button" type="button" aria-label="включить звук">unmute</button>
        </div>
        ${renderMediaCaption(animation.caption)}
      </section>
    `;
  }

  return `
    <section class="${toClassName([className, "ds-evidence"])}" data-cv-animation="${escapeHtml(animation.type)}">
      <canvas id="${escapeHtml(animation.canvasId)}" class="cv-canvas"${sceneAttribute}${variantAttribute}></canvas>
      ${renderMediaCaption(animation.caption)}
    </section>
  `;
};

const renderAnimationPreviews = (animations = [], group = {}) => {
  if (!animations.length) {
    return "";
  }

  const row = `
    <div class="${toClassName([
      "cv-preview-row",
      animations.length === 1 && "cv-preview-row--single",
      group.slider && "cv-preview-row--slider",
    ])}">
      ${animations.map(renderAnimationPreview).join("")}
    </div>
  `;

  if (!group.slider) {
    return row;
  }

  return `
    <section class="cv-preview-slider" data-cv-preview-slider aria-label="${escapeHtml(group.sliderLabel || "canvas-превью")}">
      <button class="cv-preview-slider__arrow cv-preview-slider__arrow--prev" type="button" data-cv-slider-prev aria-label="предыдущие canvas-превью"></button>
      ${row}
      <button class="cv-preview-slider__arrow cv-preview-slider__arrow--next" type="button" data-cv-slider-next aria-label="следующие canvas-превью"></button>
    </section>
  `;
};

const renderMediaAsset = (item, index = 0, count = 1) => {
  if (!item?.src) {
    return "";
  }

  if (item.type === "video") {
    return `
      <figure class="cv-media-card" style="--media-index: ${index}; --media-count: ${count}">
        <video src="${escapeHtml(item.src)}" autoplay muted loop playsinline preload="metadata" aria-label="${escapeHtml(item.alt || item.title)}"></video>
      </figure>
    `;
  }

  return `
    <figure class="cv-media-card" style="--media-index: ${index}; --media-count: ${count}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy" decoding="async" />
    </figure>
  `;
};

const renderMediaGroup = (media) => {
  if (!media?.items?.length) {
    return "";
  }

  const className = toClassName([
    "cv-media-group",
    media.variant && `cv-media-group--${media.variant}`,
    media.size && `cv-media-group--${media.size}`,
    media.tone && `cv-media-group--${media.tone}`,
    media.auto && "cv-media-group--auto",
  ]);
  const items = media.auto ? [...media.items, ...media.items] : media.items;
  const styleAttribute = media.speed ? ` style="--media-speed: ${escapeHtml(media.speed)}"` : "";

  return `
    <section class="${toClassName([className, "ds-evidence"])}" aria-label="${escapeHtml(media.label || "визуальные материалы")}"${styleAttribute}>
      <div class="cv-media-group__track">
        ${items.map((item, index) => renderMediaAsset(item, index, items.length)).join("")}
      </div>
      ${renderMediaCaption(media.caption)}
    </section>
  `;
};

const renderMediaGroups = (media = []) => normalizeList(media).map(renderMediaGroup).join("");

const renderDemoPreview = (preview) => {
  if (!preview?.type) {
    return "";
  }

  const className = toClassName(["cv-embedded-demo", `cv-embedded-demo--${preview.type}`]);
  const idAttribute = preview.id ? ` id="${escapeHtml(preview.id)}"` : "";
  const minHeightAttribute = preview.minHeight ? ` data-cv-min-height="${escapeHtml(preview.minHeight)}"` : "";

  if (preview.type === "logo-inspector") {
    return `
      <section class="${toClassName([className, "ds-evidence"])}"${idAttribute}>
        <div class="cv-embedded-demo__mount" data-cv-visual-demo="logo-inspector:jestei"${minHeightAttribute}></div>
        ${renderMediaCaption(preview.caption)}
      </section>
    `;
  }

  if (preview.type === "newsletter-canvas") {
    return `
      <section
        class="${toClassName([className, "ds-evidence"])}"
        ${idAttribute}
      >
        <div
          class="cv-embedded-demo__mount"
          data-cv-visual-demo="newsletter-canvas:jestei"
          data-cv-newsletter-sources="${escapeHtml(JSON.stringify(preview.sources || []))}"
          data-cv-alt="${escapeHtml(preview.alt || "newsletter canvas")}"
          ${minHeightAttribute}
        ></div>
        ${renderMediaCaption(preview.caption)}
      </section>
    `;
  }

  return "";
};

const renderDemoPreviews = (demos = []) => normalizeList(demos).map(renderDemoPreview).join("");

const normalizeGroups = (domain) =>
  domain.groups ?? [
    {
      title: domain.groupTitle,
      chips: domain.chips,
      animation: domain.animation,
      animations: domain.animations,
      media: domain.media,
      medias: domain.medias,
      demo: domain.demo,
      demos: domain.demos,
      visual: domain.visual,
      listGroups: domain.listGroups,
      listLayout: domain.listLayout,
      slider: domain.slider,
      sliderLabel: domain.sliderLabel,
    },
  ];

const hasGroupVisual = (group) =>
  group?.visual !== false &&
  Boolean(group?.animation || normalizeList(group?.animations).length || group?.media || group?.medias || group?.demo || group?.demos);

const renderTaskGroupVisual = (group) => `
  ${renderDemoPreviews(group.demos ?? group.demo)}
  ${renderAnimationPreviews(group.animations ?? (group.animation ? [group.animation] : []), group)}
  ${renderMediaGroups(group.medias ?? group.media)}
`;

const createAutoListGroups = (items = []) => {
  const chunks = Math.min(3, Math.max(1, Math.ceil(items.length / 8)));
  const chunkSize = Math.ceil(items.length / chunks);

  return Array.from({ length: chunks }, (_, index) => ({
    title: AUTO_LIST_GROUP_TITLES[index] ?? "заголовок группы",
    items: items.slice(index * chunkSize, (index + 1) * chunkSize),
  })).filter((group) => group.items.length);
};

const getDomainLayoutClasses = (layout) => {
  const tokens = new Set(normalizeList(layout).flatMap((item) => String(item).split(/\s+/)).filter(Boolean));

  if (!tokens.size) {
    return [];
  }

  return [
    tokens.has("two-column") && "cv-task-domain--two-column",
    tokens.has("media-left") && "cv-task-domain--media-left",
    tokens.has("media-right") && "cv-task-domain--media-right",
    tokens.has("text-left") && "cv-task-domain--text-left",
    tokens.has("text-right") && "cv-task-domain--text-right",
    tokens.has("compact") && "cv-task-domain--two-column-compact",
    (tokens.has("always") || tokens.has("always-split")) && "cv-task-domain--two-column-always",
    tokens.has("collapse-on-mobile") && "cv-task-domain--collapse-on-mobile",
  ];
};

const getTaskListGroups = (group, domain, project) => {
  if (group.listGroups?.length) {
    return group.listGroups;
  }

  const chips = group.chips ?? [];
  const shouldUseLists = chips.length >= AUTO_LIST_MIN_ITEMS || (project.variant === "featured" && chips.length > 0);

  return shouldUseLists ? createAutoListGroups(chips) : [];
};

const getTaskListLayoutTokens = (layout) =>
  new Set(normalizeList(layout).flatMap((item) => String(item).split(/\s+/)).filter(Boolean));

const getTaskListLayoutClasses = (layout) => {
  const tokens = getTaskListLayoutTokens(layout);

  return [
    tokens.has("alternating-media") && "cv-task-list-groups--alternating-media",
    tokens.has("media-placeholders") && "cv-task-list-groups--media-placeholders",
    tokens.has("compact") && "cv-task-list-groups--compact",
  ];
};

const hasTaskListMedia = (layout) => {
  const tokens = getTaskListLayoutTokens(layout);
  return tokens.has("alternating-media") || tokens.has("media-placeholders");
};

const renderTaskListGroups = (listGroups = [], layout) => `
  <div class="${toClassName(["cv-task-list-groups", "ds-structured-list", ...getTaskListLayoutClasses(layout)])}">
    ${listGroups
      .map(
        (listGroup) => `
          <section class="cv-task-list-group ds-list-section">
            <div class="cv-task-list-group__content">
              <h5>${escapeHtml(listGroup.title)}</h5>
              <ul>
                ${(listGroup.items ?? []).map(renderTaskListItem).join("")}
              </ul>
            </div>
            ${hasTaskListMedia(layout) ? `<div class="cv-task-list-group__media" aria-hidden="true"></div>` : ""}
          </section>
        `,
      )
      .join("")}
  </div>
`;

const renderTaskGroupMeta = (group, domain, project) => {
  const listGroups = getTaskListGroups(group, domain, project);

  return `
    <div class="cv-task-group__meta">
      <h4 class="cv-task-domain__title type-domain-title">${escapeHtml(domain.title)}</h4>
      ${group.title ? `<h5 class="cv-task-group__title">${escapeHtml(group.title)}</h5>` : ""}
      ${
        listGroups.length
          ? renderTaskListGroups(listGroups, group.listLayout ?? domain.listLayout)
          : `
            <ul class="cv-task-chips">
              ${(group.chips ?? []).map(renderTaskChip).join("")}
            </ul>
          `
      }
    </div>
  `;
};

const renderTaskGroup = (group, domain, project) => {
  const withVisual = hasGroupVisual(group);

  return `
    <div class="${toClassName(["cv-task-group", withVisual && "cv-task-group--with-visual"])}">
      ${withVisual ? `<div class="cv-task-group__visual ds-evidence">${renderTaskGroupVisual(group)}</div>` : ""}
      ${renderTaskGroupMeta(group, domain, project)}
    </div>
  `;
};

const hasDomainVisual = (domain) => normalizeGroups(domain).some(hasGroupVisual);

const renderTaskDomain = (domain, project) => `
  <section
    class="${toClassName(["cv-task-domain", "ds-surface", hasDomainVisual(domain) && "cv-task-domain--with-visual", ...getDomainLayoutClasses(domain.layout)])}"
    data-project-id="${escapeHtml(project.id)}"
    data-task-area="${escapeHtml(domain.area)}"
  >
    ${normalizeGroups(domain).map((group) => renderTaskGroup(group, domain, project)).join("")}
  </section>
`;

const renderTaskDomains = (domains = [], project) => `
  <div class="cv-task-domains">
    ${domains.map((domain) => renderTaskDomain(domain, project)).join("")}
  </div>
`;

const renderTaskArea = (project) => `
  <div class="${toClassName(["cv-task-area", project.variant === "compact" && "cv-task-area--details"])}" ${
    project.detailsId ? `id="${escapeHtml(project.detailsId)}"` : ""
  }>
    ${renderTaskDomains(project.domains, project)}
  </div>
`;

const renderFeaturedProject = (project) => `
  <article class="cv-experience__item cv-experience__item--featured" id="cv-${escapeHtml(toSlug(project.id || project.title))}" data-project-id="${escapeHtml(project.id)}">
    ${renderProjectHero(project)}
    ${renderTaskArea(project)}
  </article>
`;

const renderCompactProject = (project) => `
  <article class="cv-experience__item cv-experience__item--compact" id="cv-${escapeHtml(toSlug(project.id || project.title))}" data-project-id="${escapeHtml(project.id)}">
    ${renderProjectHeader(project)}
    ${renderTaskArea(project)}
    <time class="cv-experience__year">${escapeHtml(project.year)}</time>
  </article>
`;

const renderProject = (project) =>
  project.variant === "compact" ? renderCompactProject(project) : renderFeaturedProject(project);

const renderResumeCta = () => `
  <section class="cv-resume-cta" aria-label="полное резюме">
    <a href="/resume/">посмотреть ещё</a>
  </section>
`;

const renderHomeExperience = () =>
  `${CV_PROJECTS.slice(0, 3)
    .map((project, index) => (index === 2 ? `${renderProject(project)}${renderPetProjectsSection()}` : renderProject(project)))
    .join("")}${renderResumeCta()}`;

const renderResumeExperience = () => CV_PROJECTS.map(renderProject).join("");

export function renderCvExperience(root = document) {
  const target = root.querySelector("[data-cv-experience]");

  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.innerHTML = target.dataset.cvMode === "resume" ? renderResumeExperience() : renderHomeExperience();
}
