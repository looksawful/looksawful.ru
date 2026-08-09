import { MEDIA_CAPTIONS } from "./media-captions.js";

const PLACEHOLDER_PATTERN =
  /^(?:заголовок:?|короткий текст-заполнитель\.?|текст-заполнитель\.?|нумерованный список)$/i;

const EDITORIAL_COPY_SELECTOR =
  ".cv-item__content > .cv-story .cv-story__copy";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasUsefulText(node) {
  const text = normalizeText(node?.textContent);
  return Boolean(text) && !PLACEHOLDER_PATTERN.test(text);
}

function hide(node) {
  if (node instanceof HTMLElement) node.hidden = true;
}

function show(node) {
  if (node instanceof HTMLElement) node.hidden = false;
}

function getProjectName(scene) {
  return normalizeText(
    scene.querySelector(".cv-item__project")?.textContent ??
      scene.querySelector(".cv-item__title")?.textContent,
  );
}

function revealSceneIdentity(scene) {
  show(scene.querySelector(".cv-item__title"));
  show(scene.querySelector(".cv-item__number"));

  const description = scene.querySelector(".cv-item__copy");
  if (hasUsefulText(description)) show(description);
  else hide(description);
}

function findPrimaryCopy(scene) {
  const header = scene.querySelector(".cv-item__intro");
  const existing = header?.querySelector(
    ":scope > [data-accordion-primary-copy]",
  );

  if (existing instanceof HTMLElement) return existing;

  return [...scene.querySelectorAll(EDITORIAL_COPY_SELECTOR)].find((copy) => {
    if (!(copy instanceof HTMLElement) || copy.hidden) return false;
    if (copy.classList.contains("cv-story__copy--section-note")) return false;
    if (copy.closest(".principle")) return false;

    return hasUsefulText(copy.querySelector("p"));
  });
}

function movePrimaryCopy(scene) {
  const header = scene.querySelector(".cv-item__intro");
  const copy = findPrimaryCopy(scene);

  if (!(header instanceof HTMLElement) || !(copy instanceof HTMLElement)) {
    return null;
  }

  const sourceSection = copy.closest(".cv-story");

  copy
    .querySelectorAll(":scope > :is(h1, h2, h3, h4, h5, h6)")
    .forEach(hide);

  const paragraphs = [...copy.querySelectorAll(":scope > p")];
  paragraphs.forEach((paragraph, index) => {
    if (index === 0 && hasUsefulText(paragraph)) show(paragraph);
    else hide(paragraph);
  });

  if (!paragraphs.some((paragraph) => !paragraph.hidden)) {
    hide(copy);
    return null;
  }

  copy.dataset.accordionPrimaryCopy = "";
  show(copy);

  const description = header.querySelector(".cv-item__copy");
  const anchor =
    description instanceof HTMLElement && !description.hidden
      ? description
      : header.querySelector(".cv-item__title");

  if (anchor instanceof HTMLElement && copy.parentElement !== header) {
    anchor.after(copy);
  } else if (copy.parentElement !== header) {
    header.prepend(copy);
  }

  if (
    sourceSection instanceof HTMLElement &&
    sourceSection.children.length === 0
  ) {
    hide(sourceSection);
  }

  return copy;
}

function hideSecondaryEditorialContent(scene, primaryCopy) {
  scene.querySelectorAll(EDITORIAL_COPY_SELECTOR).forEach((copy) => {
    if (copy !== primaryCopy) hide(copy);
  });

  scene.querySelectorAll(".principle, .brief").forEach(hide);
}

function hideJesteiNavigation(scene) {
  if (getProjectName(scene) !== "Jestei Pool") return;

  scene.querySelectorAll(".category-browser").forEach(hide);
  scene
    .querySelectorAll(".jestei-theme-organism-shell__header")
    .forEach(hide);
}

function hideDetailPanel(root) {
  root.querySelectorAll("[data-detail-open]").forEach(hide);

  root.querySelectorAll("[data-detail-host]").forEach((host) => {
    if (host instanceof HTMLDialogElement && host.open) host.close();
    hide(host);
  });
}

function mediaUnitFor(asset) {
  return asset.closest("picture") ?? asset;
}

function directFigureChild(figure, node) {
  let current = node;

  while (
    current instanceof HTMLElement &&
    current.parentElement &&
    current.parentElement !== figure
  ) {
    current = current.parentElement;
  }

  return current instanceof HTMLElement && current.parentElement === figure
    ? current
    : null;
}

function inferredAspectRatio(figure, asset) {
  const computedRatio = getComputedStyle(figure).aspectRatio;

  if (computedRatio && computedRatio !== "auto") return computedRatio;

  const width = Number(asset.getAttribute("width"));
  const height = Number(asset.getAttribute("height"));

  return width > 0 && height > 0 ? `${width} / ${height}` : "";
}

function ensureMediaSurface(figure, asset) {
  const unit = mediaUnitFor(asset);
  const directChild = directFigureChild(figure, unit);

  if (!(directChild instanceof HTMLElement)) return null;

  const ratio = inferredAspectRatio(figure, asset);

  if (directChild !== unit) {
    directChild.dataset.mediaCaptionSurface = "";
    if (ratio && getComputedStyle(directChild).aspectRatio === "auto") {
      directChild.style.aspectRatio = ratio;
    }
    return directChild;
  }

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaCaptionSurface = "";

  if (ratio) surface.style.aspectRatio = ratio;

  directChild.replaceWith(surface);
  surface.append(directChild);
  return surface;
}

function ensureCaption(figure, mediaId) {
  let caption = figure.querySelector(":scope > figcaption");

  if (!(caption instanceof HTMLElement)) {
    caption = document.createElement("figcaption");
    caption.className = "media-item__caption";
    figure.append(caption);
  }

  caption.classList.add("media-item__caption");
  caption.dataset.mediaCaption = "";
  caption.dataset.mediaCaptionFor = mediaId;
  caption.dataset.mediaCaptionMode = "static";
  return caption;
}

function applyCaptionToAsset(asset) {
  const mediaId = asset.dataset.mediaId;
  const captionText = MEDIA_CAPTIONS[mediaId];

  if (!captionText) return;

  const figure = asset.closest("figure");
  if (!(figure instanceof HTMLElement) || !figure.closest(".cv-item")) return;

  const surface = ensureMediaSurface(figure, asset);
  if (!(surface instanceof HTMLElement)) return;

  figure.dataset.mediaCaptioned = "";
  figure.dataset.mediaCaptionMode = "static";

  const caption = ensureCaption(figure, mediaId);
  caption.textContent = captionText;
  show(caption);

  if (caption.previousElementSibling !== surface) {
    surface.after(caption);
  }
}

function applyMediaCaptions(scope) {
  if (!(scope instanceof Document || scope instanceof HTMLElement)) return;

  const assets = [];

  if (
    scope instanceof HTMLElement &&
    scope.matches(".cv-item :is(img, video)[data-media-id]")
  ) {
    assets.push(scope);
  }

  assets.push(
    ...scope.querySelectorAll(".cv-item :is(img, video)[data-media-id]"),
  );

  assets.forEach(applyCaptionToAsset);
}

function prepareScene(scene) {
  revealSceneIdentity(scene);
  const primaryCopy = movePrimaryCopy(scene);
  hideSecondaryEditorialContent(scene, primaryCopy);
  hideJesteiNavigation(scene);
}

export function applyAccordionPresentation(root = document) {
  root.querySelectorAll(".cv-item[data-cv-scene]").forEach(prepareScene);
  hideDetailPanel(root);
  applyMediaCaptions(root);

  const observer =
    typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
          records.forEach((record) => {
            record.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) applyMediaCaptions(node);
            });
          });
        })
      : null;

  observer?.observe(root === document ? document.documentElement : root, {
    childList: true,
    subtree: true,
  });

  return () => observer?.disconnect();
}
