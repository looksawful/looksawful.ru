import { gsap } from "gsap";
import lyveLogoUrl from "../../assets/cv/logos/lyve-logo.svg";
import styxLogoUrl from "../../assets/cv/logos/styx-logo.svg";
import { CV_TASK_DEMOS } from "./cv-task-demo-data.js";
import { mountCvDemoVisuals } from "./cv-task-visual-demos.js";

const CHIP_SELECTOR = ".cv-task-chip";
const DEMO_CHIP_SELECTOR = ".cv-task-chip[data-demo-id]";
const WORK_TOGGLE_SELECTOR = ".cv-work-toggle";
const WORK_TOGGLE_TEXT_SELECTOR = ".cv-work-toggle__text";
const PROJECT_MORE_BUTTON_SELECTOR = ".cv-project-more__button";
const PREVIEW_CLASS = "cv-task-preview";
const PANEL_CLASS = "cv-task-demo-panel";
const LIGHTBOX_CLASS = "cv-task-lightbox";
const OPEN_CLASS = "is-open";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_PREVIEW_QUERY = "(hover: hover) and (pointer: fine)";
const TONE_COUNT = 24;
const TONE_SEQUENCE = [
  1, 12, 6, 19, 3, 15, 9, 22, 5, 17, 11, 24,
  2, 14, 8, 21, 4, 16, 10, 23, 7, 18, 13, 20,
];
const EXPANDED_CLASS = "is-expanded";
const CV_LOGO_URLS = {
  lyve: lyveLogoUrl,
  styx: styxLogoUrl,
};

let previewElement = null;
let panelElement = null;
let lightboxElement = null;
let lastFocusedElement = null;
let lastLightboxTrigger = null;
let pageVisualCleanup = null;
let previewVisualCleanup = null;
let previewVisualToken = 0;
let activeVisualCleanup = null;
let activeVisualToken = 0;
let mediaElementId = 0;
const frameSequenceCleanups = new Set();

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function canShowHoverPreview() {
  return window.matchMedia(DESKTOP_PREVIEW_QUERY).matches;
}

function assignChipTones(chips) {
  chips.forEach((chip) => {
    if (chip.dataset.tone) {
      return;
    }

    const list = chip.closest(".cv-task-chips");
    const row = list ? [...document.querySelectorAll(".cv-task-chips")].indexOf(list) : 0;
    const chipIndex = [...(list?.querySelectorAll(CHIP_SELECTOR) ?? chips)].indexOf(chip);
    const sequenceIndex = (chipIndex * 5 + row * 7) % TONE_COUNT;

    chip.dataset.tone = TONE_SEQUENCE[sequenceIndex];
  });
}

function getDemo(chip) {
  return CV_TASK_DEMOS[chip.dataset.demoId];
}

function createElement(tagName, className = "", textContent = "") {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

function clearElement(element) {
  element.replaceChildren();
}

function createVisualCanvas(media, visualType) {
  const canvas = document.createElement("canvas");
  const demoName = visualType === "three" ? media.scene : media.demo;

  mediaElementId += 1;
  canvas.id = `cv-demo-visual-${visualType}-${demoName}-${mediaElementId}`;
  canvas.className = `cv-demo-visual-canvas cv-demo-visual-canvas--${visualType}`;
  canvas.setAttribute("aria-label", media.title ?? "");
  canvas.dataset.cvVisualDemo = `${visualType}:${demoName}`;

  return canvas;
}

function createFrameSequenceElement(media) {
  const sequence = createElement("div", "cv-frame-sequence");
  const imageElement = document.createElement("img");
  const controls = createElement("div", "cv-frame-sequence__controls");
  const previousButton = createElement("button", "cv-frame-sequence__button", "←");
  const nextButton = createElement("button", "cv-frame-sequence__button", "→");
  const counter = createElement("span", "cv-frame-sequence__counter");
  const frames = media.frames ?? [];
  let currentIndex = 0;

  const showFrame = (index) => {
    const frame = frames[index];

    if (!frame) {
      return;
    }

    currentIndex = index;
    imageElement.src = frame.src;
    imageElement.alt = frame.alt ?? media.title ?? "";
    counter.textContent = `${currentIndex + 1}/${frames.length}`;
  };

  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "предыдущий кадр");
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "следующий кадр");
  imageElement.loading = "lazy";
  imageElement.decoding = "async";
  imageElement.className = "cv-frame-sequence__image";

  previousButton.addEventListener("click", () => showFrame((currentIndex - 1 + frames.length) % frames.length));
  nextButton.addEventListener("click", () => showFrame((currentIndex + 1) % frames.length));
  sequence.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    showFrame((currentIndex + 1) % frames.length);
  });

  const intervalId = window.setInterval(() => showFrame((currentIndex + 1) % frames.length), 2600);
  frameSequenceCleanups.add(() => window.clearInterval(intervalId));

  controls.append(previousButton, counter, nextButton);
  sequence.append(imageElement, controls);
  showFrame(0);

  return sequence;
}

function createLogoInspectorElement(media) {
  const element = createElement("div", "cv-demo-module cv-demo-module--logo-inspector");

  element.dataset.cvVisualDemo = "logo-inspector:jestei";
  element.dataset.cvMinHeight = String(media.minHeight ?? 560);
  element.dataset.cvVariant = media.variant ?? "brand-orange";

  return element;
}

function createNewsletterCanvasElement(media) {
  const element = createElement("div", "cv-demo-module cv-demo-module--newsletter-canvas");

  element.dataset.cvVisualDemo = "newsletter-canvas:jestei";
  element.dataset.cvNewsletterSources = JSON.stringify(media.sources ?? []);
  element.dataset.cvAlt = media.title ?? "Newsletter canvas";
  element.dataset.cvMinHeight = String(media.minHeight ?? 560);

  return element;
}

function createMediaElement(media, className = "cv-demo-media", options = {}) {
  if (!media?.type) {
    return null;
  }

  const figure = createElement("figure", className);

  if (media.theme) {
    figure.classList.add(`cv-demo-media--${media.theme}`);
  }

  if (media.type === "three" && media.scene) {
    figure.classList.add("cv-demo-media--three");
    figure.appendChild(createVisualCanvas(media, "three"));
    return figure;
  }

  if (media.type === "canvas" && media.demo) {
    figure.classList.add("cv-demo-media--canvas");
    figure.appendChild(createVisualCanvas(media, "canvas"));
    return figure;
  }

  if (media.type === "frame-sequence" && media.frames?.length) {
    figure.classList.add("cv-demo-media--sequence");
    figure.appendChild(createFrameSequenceElement(media));
    return figure;
  }

  if (media.type === "logo-inspector") {
    figure.classList.add("cv-demo-media--interactive", "cv-demo-media--logo-inspector");
    figure.appendChild(createLogoInspectorElement(media));
    return figure;
  }

  if (media.type === "newsletter-canvas" && media.sources?.length) {
    figure.classList.add("cv-demo-media--interactive", "cv-demo-media--newsletter-canvas");
    figure.appendChild(createNewsletterCanvasElement(media));
    return figure;
  }

  if (media.type === "image" && media.src) {
    const wrapper = options.clickable ? createElement("button", "cv-demo-media__open") : createElement("div", "");
    const image = document.createElement("img");

    image.src = media.src;
    image.alt = media.alt ?? "";
    image.loading = "lazy";
    image.decoding = "async";

    if (options.clickable) {
      wrapper.type = "button";
      wrapper.setAttribute("aria-label", `Развернуть изображение: ${media.alt || "материал"}`);
      wrapper.addEventListener("click", () => openLightbox(media, wrapper));
    }

    wrapper.appendChild(image);
    figure.appendChild(wrapper);
    return figure;
  }

  if (media.type === "video" && media.src) {
    const video = document.createElement("video");
    video.src = media.src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    figure.appendChild(video);
    return figure;
  }

  if (media.type === "code") {
    const title = createElement("figcaption", "cv-demo-code__title", media.title ?? "code");
    const code = document.createElement("code");
    const pre = document.createElement("pre");

    code.textContent = media.source ?? "";
    pre.appendChild(code);
    figure.classList.add("cv-demo-media--code");
    figure.append(title, pre);
    return figure;
  }

  return null;
}

function ensureLightboxElement() {
  if (lightboxElement) {
    return lightboxElement;
  }

  lightboxElement = createElement("div", LIGHTBOX_CLASS);
  lightboxElement.hidden = true;
  lightboxElement.innerHTML = `
    <div class="cv-task-lightbox__overlay" aria-hidden="true"></div>
    <figure class="cv-task-lightbox__figure" role="dialog" aria-modal="true" aria-label="просмотр изображения">
      <button class="cv-task-lightbox__close" type="button" aria-label="закрыть">×</button>
      <img class="cv-task-lightbox__image" alt="" />
      <figcaption class="cv-task-lightbox__caption"></figcaption>
    </figure>
  `;
  lightboxElement.querySelector(".cv-task-lightbox__overlay").addEventListener("click", closeLightbox);
  lightboxElement.querySelector(".cv-task-lightbox__close").addEventListener("click", closeLightbox);
  document.body.appendChild(lightboxElement);

  return lightboxElement;
}

function openLightbox(media, trigger) {
  const lightbox = ensureLightboxElement();
  const image = lightbox.querySelector(".cv-task-lightbox__image");
  const caption = lightbox.querySelector(".cv-task-lightbox__caption");

  lastLightboxTrigger = trigger;
  image.src = media.src;
  image.alt = media.alt ?? "";
  caption.textContent = media.alt ?? "";
  lightbox.hidden = false;
  lightbox.classList.add(OPEN_CLASS);
  document.documentElement.classList.add("has-cv-lightbox-open");
  lightbox.querySelector(".cv-task-lightbox__close").focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightboxElement || lightboxElement.hidden) {
    return;
  }

  lightboxElement.hidden = true;
  lightboxElement.classList.remove(OPEN_CLASS);
  document.documentElement.classList.remove("has-cv-lightbox-open");

  if (lastLightboxTrigger?.isConnected) {
    lastLightboxTrigger.focus({ preventScroll: true });
  }

  lastLightboxTrigger = null;
}

function disposeFrameSequences() {
  frameSequenceCleanups.forEach((cleanup) => cleanup());
  frameSequenceCleanups.clear();
}

function disposePreviewVisuals() {
  previewVisualToken += 1;

  if (previewVisualCleanup) {
    previewVisualCleanup();
    previewVisualCleanup = null;
  }
}

function disposeActiveVisuals() {
  activeVisualToken += 1;

  if (activeVisualCleanup) {
    activeVisualCleanup();
    activeVisualCleanup = null;
  }

  disposeFrameSequences();
}

function mountPreviewVisuals(root) {
  const token = ++previewVisualToken;

  requestAnimationFrame(async () => {
    const cleanup = await mountCvDemoVisuals(root);

    if (token !== previewVisualToken) {
      cleanup();
      return;
    }

    previewVisualCleanup = cleanup;
  });
}

function mountActiveVisuals(root) {
  const token = ++activeVisualToken;

  requestAnimationFrame(async () => {
    const cleanup = await mountCvDemoVisuals(root);

    if (token !== activeVisualToken) {
      cleanup();
      return;
    }

    activeVisualCleanup = cleanup;
  });
}

function ensurePreviewElement() {
  if (previewElement) {
    return previewElement;
  }

  previewElement = createElement("aside", PREVIEW_CLASS);
  previewElement.hidden = true;
  previewElement.setAttribute("aria-hidden", "true");
  previewElement.append(
    createElement("div", "cv-task-preview__media"),
    createElement("div", "cv-task-preview__title"),
    createElement("p", "cv-task-preview__text"),
  );
  document.body.appendChild(previewElement);

  return previewElement;
}

function renderPreview(demo) {
  const preview = ensurePreviewElement();
  const mediaSlot = preview.querySelector(".cv-task-preview__media");
  const title = preview.querySelector(".cv-task-preview__title");
  const text = preview.querySelector(".cv-task-preview__text");
  const media = demo.previewMedia;

  clearElement(mediaSlot);

  if (media) {
    const mediaElement = createMediaElement(media, "cv-task-preview__media-frame");

    if (mediaElement) {
      mediaSlot.appendChild(mediaElement);
    }
  }

  title.textContent = demo.title;
  text.textContent = demo.preview;
}

function movePreview(event) {
  if (!previewElement || previewElement.hidden) {
    return;
  }

  const offset = 18;
  const width = previewElement.offsetWidth || 300;
  const height = previewElement.offsetHeight || 180;
  const x = event.clientX + offset + width > window.innerWidth ? event.clientX - width - offset : event.clientX + offset;
  const y = event.clientY + offset + height > window.innerHeight ? event.clientY - height - offset : event.clientY + offset;

  previewElement.style.left = `${Math.max(10, x)}px`;
  previewElement.style.top = `${Math.max(10, y)}px`;
}

function showPreview(event) {
  if (!canShowHoverPreview()) {
    return;
  }

  const demo = getDemo(event.currentTarget);

  if (!demo) {
    return;
  }

  const preview = ensurePreviewElement();
  disposePreviewVisuals();
  renderPreview(demo);
  preview.hidden = false;
  movePreview(event);
  preview.classList.add(OPEN_CLASS);
  mountPreviewVisuals(preview);
}

function hidePreview() {
  if (!previewElement) {
    return;
  }

  disposePreviewVisuals();
  previewElement.classList.remove(OPEN_CLASS);
  previewElement.hidden = true;
}

function ensurePanelElement() {
  if (panelElement) {
    return panelElement;
  }

  panelElement = createElement("div", PANEL_CLASS);
  panelElement.hidden = true;
  panelElement.innerHTML = `
    <div class="cv-task-demo-panel__overlay" aria-hidden="true"></div>
    <aside class="cv-task-demo-panel__body" role="dialog" aria-modal="true" aria-labelledby="cv-task-demo-title">
      <button class="cv-task-demo-panel__close" type="button" aria-label="закрыть">×</button>
      <div class="cv-task-demo-panel__meta"></div>
      <h2 class="cv-task-demo-panel__title" id="cv-task-demo-title"></h2>
      <p class="cv-task-demo-panel__summary"></p>
      <div class="cv-task-demo-panel__media"></div>
      <div class="cv-task-demo-panel__cards"></div>
    </aside>
  `;
  panelElement.querySelector(".cv-task-demo-panel__overlay").addEventListener("click", closePanel);
  panelElement.querySelector(".cv-task-demo-panel__close").addEventListener("click", closePanel);
  document.addEventListener("keydown", handlePanelKeydown);
  document.body.appendChild(panelElement);

  return panelElement;
}

function renderCards(container, cards = []) {
  clearElement(container);

  cards.forEach((card) => {
    const cardElement = createElement("article", "cv-task-demo-card");
    const mediaSlot = createElement("div", "cv-task-demo-card__media");
    const mediaElement = createMediaElement(card.media?.[0], "cv-task-demo-card__media-frame", { clickable: true });

    if (mediaElement) {
      mediaSlot.appendChild(mediaElement);
    }

    cardElement.append(
      mediaSlot,
      createElement("h3", "cv-task-demo-card__title", card.title),
      createElement("p", "cv-task-demo-card__text", card.text),
    );
    container.appendChild(cardElement);
  });
}

function createMediaGroup(title, items, modifier = "") {
  const section = createElement("section", `cv-task-demo-media-group ${modifier}`.trim());
  const heading = createElement("h3", "cv-task-demo-media-group__title", title);
  const grid = createElement("div", "cv-task-demo-media-group__grid");

  items.forEach((media, index) => {
    const isImage = media.type === "image";
    const isLargeMedia = ["canvas", "three", "frame-sequence", "logo-inspector", "newsletter-canvas"].includes(media.type);
    const isPrimary = (index === 0 && modifier.includes("primary")) || isLargeMedia;
    const mediaElement = createMediaElement(
      media,
      isPrimary ? "cv-demo-media cv-demo-media--primary" : "cv-demo-media",
      { clickable: isImage },
    );

    if (mediaElement) {
      grid.appendChild(mediaElement);
    }
  });

  section.append(heading, grid);

  return section;
}

function renderGroupedMedia(container, media = []) {
  const interactiveItems = media.filter((item) => ["canvas", "three", "frame-sequence", "logo-inspector", "newsletter-canvas"].includes(item.type));
  const images = media.filter((item) => item.type === "image");
  const videos = media.filter((item) => item.type === "video");
  const codeItems = media.filter((item) => item.type === "code");
  const primaryImage = images.slice(0, 1);
  const galleryImages = images.slice(1);

  clearElement(container);

  if (interactiveItems.length) {
    container.appendChild(createMediaGroup("интерактив", interactiveItems, "cv-task-demo-media-group--primary"));
  }

  if (primaryImage.length) {
    container.appendChild(createMediaGroup("обложка", primaryImage, "cv-task-demo-media-group--primary"));
  }

  if (galleryImages.length) {
    container.appendChild(createMediaGroup("изображения", galleryImages, "cv-task-demo-media-group--gallery"));
  }

  if (videos.length) {
    container.appendChild(createMediaGroup("видео", videos, "cv-task-demo-media-group--gallery"));
  }

  if (codeItems.length) {
    container.appendChild(createMediaGroup("код", codeItems, "cv-task-demo-media-group--code"));
  }
}

function renderPanel(demo) {
  const panel = ensurePanelElement();
  const meta = panel.querySelector(".cv-task-demo-panel__meta");
  const title = panel.querySelector(".cv-task-demo-panel__title");
  const summary = panel.querySelector(".cv-task-demo-panel__summary");
  const mediaSlot = panel.querySelector(".cv-task-demo-panel__media");
  const cards = panel.querySelector(".cv-task-demo-panel__cards");

  meta.textContent = `${demo.project} · ${demo.fileCount ?? 0} файлов`;
  title.textContent = demo.title;
  summary.textContent = demo.summary;
  renderGroupedMedia(mediaSlot, demo.media ?? []);

  if (demo.media?.length) {
    clearElement(cards);
    cards.hidden = true;
    return;
  }

  cards.hidden = false;
  renderCards(cards, demo.cards);
}

function openPanel(chip) {
  const demo = getDemo(chip);

  if (!demo) {
    return;
  }

  hidePreview();
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : chip;
  disposeActiveVisuals();
  renderPanel(demo);
  panelElement.hidden = false;
  panelElement.classList.add(OPEN_CLASS);
  document.documentElement.classList.add("has-cv-demo-open");
  mountActiveVisuals(panelElement);

  if (!getReducedMotionPreference()) {
    const body = panelElement.querySelector(".cv-task-demo-panel__body");
    gsap.fromTo(body, { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.22, ease: "power2.out" });
  }

  panelElement.querySelector(".cv-task-demo-panel__close").focus({ preventScroll: true });
}

function closePanel() {
  if (!panelElement || panelElement.hidden) {
    return;
  }

  panelElement.hidden = true;
  panelElement.classList.remove(OPEN_CLASS);
  document.documentElement.classList.remove("has-cv-demo-open");
  disposeActiveVisuals();

  if (lastFocusedElement?.isConnected) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function handlePanelKeydown(event) {
  if (event.key === "Escape") {
    if (lightboxElement && !lightboxElement.hidden) {
      closeLightbox();
      return;
    }

    closePanel();
  }
}

function getRelatedChips(chip) {
  return [...(chip.closest(".cv-task-chips")?.querySelectorAll(CHIP_SELECTOR) ?? [])];
}

function animateChipCluster(activeChip) {
  if (getReducedMotionPreference()) {
    return;
  }

  const chips = getRelatedChips(activeChip);

  gsap.killTweensOf(chips);
  gsap.to(chips, {
    scale: (_, chip) => (chip === activeChip ? 1.045 : 1),
    y: (_, chip) => (chip === activeChip ? -1 : 0),
    duration: 0.18,
    ease: "power2.out",
    overwrite: true,
  });
}

function resetChipCluster(chip) {
  if (getReducedMotionPreference()) {
    return;
  }

  const chips = getRelatedChips(chip);

  gsap.killTweensOf(chips);
  gsap.to(chips, { scale: 1, y: 0, duration: 0.2, ease: "power2.out", overwrite: true });
}

function initProjectAccordions() {
  const buttons = [...document.querySelectorAll(PROJECT_MORE_BUTTON_SELECTOR)];

  buttons.forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    if (!panel) {
      return;
    }

    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";

      button.setAttribute("aria-expanded", String(shouldOpen));
      panel.hidden = !shouldOpen;
    });
  });
}

function initProjectLogoImages() {
  const logos = [...document.querySelectorAll("[data-cv-logo]")];

  logos.forEach((logo) => {
    const logoUrl = CV_LOGO_URLS[logo.dataset.cvLogo];

    if (!logoUrl) {
      return;
    }

    logo.src = logoUrl;
  });
}

function mountPageVisuals() {
  if (pageVisualCleanup) {
    return;
  }

  requestAnimationFrame(async () => {
    pageVisualCleanup = await mountCvDemoVisuals(document);
  });
}

function setWorkToggleText(button, shouldOpen) {
  const text = button.querySelector(WORK_TOGGLE_TEXT_SELECTOR);

  if (text) {
    text.textContent = "подробнее";
  }

  button.setAttribute("aria-label", shouldOpen ? "Свернуть подробности проекта" : "Показать подробности проекта");
}

function setWorkDetailsState(button, panel, shouldOpen) {
  const article = button.closest(".cv-experience__item");

  button.setAttribute("aria-expanded", String(shouldOpen));
  setWorkToggleText(button, shouldOpen);

  if (shouldOpen) {
    article?.classList.add(EXPANDED_CLASS);
  }

  if (getReducedMotionPreference()) {
    panel.hidden = !shouldOpen;
    article?.classList.toggle(EXPANDED_CLASS, shouldOpen);
    return;
  }

  gsap.killTweensOf(panel);

  if (shouldOpen) {
    panel.hidden = false;
    gsap.fromTo(
      panel,
      { height: 0, opacity: 0, y: -6, overflow: "hidden" },
      {
        height: "auto",
        opacity: 1,
        y: 0,
        duration: 0.32,
        ease: "power3.out",
        clearProps: "height,opacity,overflow,transform",
      },
    );
    return;
  }

  gsap.to(panel, {
    height: 0,
    opacity: 0,
    y: -4,
    overflow: "hidden",
    duration: 0.24,
    ease: "power2.inOut",
    onComplete: () => {
      panel.hidden = true;
      article?.classList.remove(EXPANDED_CLASS);
      gsap.set(panel, { clearProps: "height,opacity,overflow,transform" });
    },
  });
}

function initWorkAccordions() {
  const buttons = [...document.querySelectorAll(WORK_TOGGLE_SELECTOR)];

  buttons.forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    if (!panel) {
      return;
    }

    setWorkToggleText(button, button.getAttribute("aria-expanded") === "true");

    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";

      setWorkDetailsState(button, panel, shouldOpen);
    });
  });
}

function prepareDemoChip(chip) {
  const demo = getDemo(chip);

  if (!demo) {
    return;
  }

  chip.tabIndex = 0;
  chip.setAttribute("role", "button");
  chip.setAttribute("aria-haspopup", "dialog");
  chip.setAttribute("aria-label", `Показать материалы: ${demo.title}`);
  chip.addEventListener("click", () => openPanel(chip));
  chip.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openPanel(chip);
  });
}

export function initCvTaskPreviews() {
  const chips = [...document.querySelectorAll(CHIP_SELECTOR)];
  const demoChips = [...document.querySelectorAll(DEMO_CHIP_SELECTOR)];

  initProjectLogoImages();
  initWorkAccordions();
  initProjectAccordions();
  mountPageVisuals();

  if (!chips.length) {
    return;
  }

  assignChipTones(chips);

  chips.forEach((chip) => {
    chip.addEventListener("pointerenter", (event) => {
      animateChipCluster(chip);
      showPreview(event);
    });
    chip.addEventListener("pointermove", movePreview);
    chip.addEventListener("pointerleave", () => {
      resetChipCluster(chip);
      hidePreview();
    });
  });

  demoChips.forEach(prepareDemoChip);
}
