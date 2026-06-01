import "./content-map.css";
import { CV_TASK_DEMOS } from "../components/cv-task-previews/cv-task-demo-data.js";
import { CV_PROJECTS } from "../sections/cv/cv-data.js";
import {
  createAnimationItems,
  CV_ANIMATION_SCENES,
  getAnimationSceneSummaries,
} from "../lab/canvas/cv-animation-assets.js";

const root = document.getElementById("content-map-root");

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = text;
  }

  return element;
};

const appendChildren = (parent, children) => {
  children.filter(Boolean).forEach((child) => parent.appendChild(child));
  return parent;
};

const normalizeChip = (chip) => (typeof chip === "string" ? { label: chip, demoId: null } : chip);

const getAllChips = () =>
  CV_PROJECTS.flatMap((project) =>
    project.domains.flatMap((domain) =>
      domain.chips.map((chip) => ({
        ...normalizeChip(chip),
        project,
        domain,
      })),
    ),
  );

const getReferencedDemoIds = () => new Set(getAllChips().map((chip) => chip.demoId).filter(Boolean));

const createCode = (text) => createElement("code", "", text);

const createPillRow = (items) => {
  const row = createElement("div", "pill-row");
  items.forEach((item) => row.appendChild(createElement("span", "pill", item)));
  return row;
};

const createThumb = (media, label = "") => {
  const frame = createElement("figure", "thumb");

  if (!media) {
    frame.appendChild(createElement("div", "media-placeholder", "нет медиа"));
    return frame;
  }

  if (media.type === "video") {
    const video = createElement("video");
    video.src = media.src;
    video.title = media.title || label;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.controls = true;
    frame.appendChild(video);
    return frame;
  }

  if (media.type === "image") {
    const img = createElement("img");
    img.src = media.src;
    img.alt = media.alt || label;
    img.loading = "lazy";
    frame.appendChild(img);
    return frame;
  }

  if (media.type === "frame-sequence" && media.frames?.[0]) {
    const img = createElement("img");
    img.src = media.frames[0].src || media.frames[0];
    img.alt = media.title || label;
    img.loading = "lazy";
    frame.appendChild(img);
    return frame;
  }

  if (media.type === "newsletter-canvas" && media.sources?.[0]) {
    const img = createElement("img");
    img.src = media.sources[0];
    img.alt = media.title || label;
    img.loading = "lazy";
    frame.appendChild(img);
    return frame;
  }

  frame.appendChild(createElement("div", "media-placeholder", media.title || media.type || "custom media"));
  return frame;
};

const createDemoMediaGrid = (demo) => {
  const media = [
    demo.previewMedia,
    ...(demo.media || []),
    ...(demo.cards || []).flatMap((card) => card.media || card.image || []),
  ].filter(Boolean);
  const grid = createElement("div", "demo-card__media");

  if (!media.length) {
    grid.appendChild(createElement("div", "media-placeholder", "нет привязанных превью"));
    return grid;
  }

  media.forEach((entry, index) => {
    if (Array.isArray(entry)) {
      entry.forEach((nested, nestedIndex) => grid.appendChild(createThumb(nested, `${demo.title} ${index}.${nestedIndex}`)));
      return;
    }

    grid.appendChild(createThumb(entry, `${demo.title} ${index + 1}`));
  });

  return grid;
};

const createDemoCard = (demoId, demo, chipLabel) => {
  const card = createElement("article", "demo-card");
  const head = createElement("div", "demo-card__head");
  const title = createElement("h4", "", chipLabel || demo.title || demoId);
  const mediaCount = [demo.previewMedia, ...(demo.media || [])].filter(Boolean).length;

  appendChildren(head, [title, createCode(demoId)]);
  card.appendChild(head);

  const summary = createElement("div", "demo-card__summary");
  appendChildren(summary, [
    demo.project ? createElement("p", "", demo.project) : null,
    demo.preview ? createElement("p", "", demo.preview) : null,
    demo.summary && demo.summary !== demo.preview ? createElement("p", "", demo.summary) : null,
    demo.assetPath ? createCode(demo.assetPath) : null,
    createElement("p", "", `${demo.fileCount ?? mediaCount} файлов в описании`),
  ]);
  card.appendChild(summary);
  card.appendChild(createDemoMediaGrid(demo));

  return card;
};

const createDomainCard = (project, domain) => {
  const card = createElement("section", "domain-card");
  const head = createElement("div", "domain-card__head");

  appendChildren(head, [
    createElement("h4", "", domain.title),
    createCode(domain.area),
  ]);
  card.appendChild(head);

  const meta = createElement("div", "domain-card__meta");
  meta.appendChild(createElement("span", "", `${domain.chips.length} чипов`));

  if (domain.animation) {
    meta.appendChild(createElement("span", "", `анимация: ${domain.animation.type}`));
    meta.appendChild(createCode(domain.animation.canvasId));
  }

  card.appendChild(meta);

  const chips = createElement("div", "chip-row");
  domain.chips.map(normalizeChip).forEach((chip) => {
    const chipElement = createElement("span", chip.demoId ? "chip" : "chip chip--plain", chip.label);
    if (chip.demoId) {
      chipElement.title = chip.demoId;
    }
    chips.appendChild(chipElement);
  });
  card.appendChild(chips);

  const demoCards = domain.chips
    .map(normalizeChip)
    .filter((chip) => chip.demoId && CV_TASK_DEMOS[chip.demoId])
    .map((chip) => createDemoCard(chip.demoId, CV_TASK_DEMOS[chip.demoId], chip.label));

  if (demoCards.length) {
    const demoGrid = createElement("div", "demo-grid");
    demoCards.forEach((demoCard) => demoGrid.appendChild(demoCard));
    card.appendChild(demoGrid);
  }

  return card;
};

const createProjectCard = (project) => {
  const card = createElement("article", "project-card");
  const head = createElement("div", "project-card__head");
  const title = createElement("div", "project-card__title");

  appendChildren(title, [
    createElement("h3", "", project.title),
    project.period ? createElement("p", "", project.period) : null,
  ]);

  appendChildren(head, [title, createCode(project.id)]);
  card.appendChild(head);

  card.appendChild(createPillRow(project.roles || []));

  const copy = createElement("div", "project-card__copy");
  (project.copy || []).forEach((paragraph) => copy.appendChild(createElement("p", "", paragraph)));
  if (project.summary) {
    copy.appendChild(createElement("p", "", project.summary));
  }
  card.appendChild(copy);

  const domains = createElement("div", "domain-list");
  project.domains.forEach((domain) => domains.appendChild(createDomainCard(project, domain)));
  card.appendChild(domains);

  return card;
};

const createSceneCard = (summary) => {
  const scene = CV_ANIMATION_SCENES[summary.id];
  const items = createAnimationItems(scene.modules);
  const card = createElement("article", "scene-card");
  const head = createElement("div", "scene-card__head");

  appendChildren(head, [
    createElement("h3", "", scene.label),
    createElement("strong", "", `${items.length}`),
  ]);

  card.appendChild(head);
  card.appendChild(createCode(scene.directory));

  const grid = createElement("div", "thumb-grid");
  items.forEach((item) => {
    const mediaType = item.filename.match(/\.(mp4)$/i) ? "video" : "image";
    grid.appendChild(createThumb({ type: mediaType, src: item.imageUrl, alt: item.filename, title: item.filename }, item.filename));
  });
  card.appendChild(grid);

  return card;
};

const createUnmatchedSection = () => {
  const referenced = getReferencedDemoIds();
  const unmatched = Object.entries(CV_TASK_DEMOS).filter(([id]) => !referenced.has(id));
  const section = createElement("section", "content-map__section");

  appendChildren(section, [
    createElement("h2", "", "demo без чипа"),
    createElement("p", "content-map__intro", "Эти карточки есть в данных сайдбара, но сейчас не привязаны к чипам в CV."),
  ]);

  const list = createElement("div", "unmatched-list");
  unmatched.forEach(([id, demo]) => list.appendChild(createDemoCard(id, demo)));
  section.appendChild(list);

  return section;
};

const render = () => {
  const chips = getAllChips();
  const demoIds = getReferencedDemoIds();
  const animationSummaries = getAnimationSceneSummaries();
  const app = createElement("div", "content-map");
  const hero = createElement("header", "content-map__hero");
  const intro = createElement("div", "content-map__intro");
  const stats = createElement("div", "content-map__stats");

  appendChildren(intro, [
    createElement("p", "", "Рабочая карта CV-контента для отбора материалов: тексты, чипы, demo-превью, подробности и папки анимаций."),
    createElement("p", "", "Эта страница нужна для dev-ветки и не должна попадать в prod/preprod."),
  ]);

  [
    ["проектов", CV_PROJECTS.length],
    ["чипов", chips.length],
    ["demo", demoIds.size],
  ].forEach(([label, value]) => {
    const stat = createElement("div", "content-map__stat");
    stat.appendChild(createElement("strong", "", value));
    stat.appendChild(createElement("span", "", label));
    stats.appendChild(stat);
  });

  intro.appendChild(stats);
  appendChildren(hero, [createElement("h1", "", "cv content map"), intro]);
  app.appendChild(hero);

  const scenesSection = createElement("section", "content-map__section");
  scenesSection.appendChild(createElement("h2", "", "анимации"));
  const sceneGrid = createElement("div", "scene-grid");
  animationSummaries.forEach((summary) => sceneGrid.appendChild(createSceneCard(summary)));
  scenesSection.appendChild(sceneGrid);
  app.appendChild(scenesSection);

  const projectsSection = createElement("section", "content-map__section");
  projectsSection.appendChild(createElement("h2", "", "проекты и чипы"));
  const projectList = createElement("div", "project-list");
  CV_PROJECTS.forEach((project) => projectList.appendChild(createProjectCard(project)));
  projectsSection.appendChild(projectList);
  app.appendChild(projectsSection);
  app.appendChild(createUnmatchedSection());

  root.replaceChildren(app);
};

render();
