const ROOT_SELECTOR = "[data-random-gallery]";
const GRID_SELECTOR = "[data-random-gallery-grid]";
const SHUFFLE_SELECTOR = "[data-random-gallery-action='shuffle'][data-random-gallery-target]";
const LIGHTBOX_CLASS = "has-lightbox";
const DEFAULT_COUNT = 53;
const DEFAULT_ROWS = 3;
const DEFAULT_MIN_WIDTH = 132;
const DEFAULT_DELAY = 2800;
const DEFAULT_BATCH = 2;
const CHANGE_CLASS_DURATION = 280;
const RESIZE_TOLERANCE = 24;

const registry = new Map();
const mountedRoots = new WeakSet();

function readNumber(value, fallback, min) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < min) {
    return fallback;
  }

  return number;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function buildImagePath(path, index) {
  return path.replace(/\/$/, "") + "/" + padNumber(index) + ".webp";
}

function shuffleItems(items) {
  const result = items.slice();

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = current;
  }

  return result;
}

function isPagePaused() {
  return document.hidden || document.documentElement.classList.contains(LIGHTBOX_CLASS);
}

function createMediaItem(gallery, index) {
  const href = buildImagePath(gallery.path, index);
  const item = document.createElement("a");
  item.className = "media-item no-stroke random-gallery__item is-loading";
  item.href = href;
  item.target = "_blank";
  item.rel = "noopener noreferrer";
  item.dataset.lightbox = "image";

  const image = document.createElement("img");
  image.alt = "";
  image.decoding = "async";
  image.loading = "lazy";
  image.src = href;

  image.addEventListener("load", () => {
    item.classList.remove("is-loading");
    item.classList.add("is-loaded");
  }, { once: true });

  image.addEventListener("error", () => {
    item.classList.remove("is-loading");
  }, { once: true });

  item.append(image);
  return item;
}

function calculateLayout(gallery) {
  const width = gallery.grid.getBoundingClientRect().width;

  if (!width) {
    return null;
  }

  const styles = getComputedStyle(gallery.grid);
  const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const columns = Math.max(2, Math.floor((width + gap) / (gallery.minWidth + gap)));
  const visible = Math.min(gallery.count, columns * gallery.rows);

  return { width, columns, visible };
}

function getRandomIndexes(gallery, visible) {
  return shuffleItems(gallery.pool).slice(0, visible);
}

function makeVisible(gallery) {
  gallery.root.classList.add("is-visible");
}

function renderGallery(gallery, force) {
  const layout = calculateLayout(gallery);

  if (!layout) {
    return;
  }

  const key = layout.columns + ":" + layout.visible + ":" + Math.round(layout.width);

  if (!force && key === gallery.renderKey) {
    return;
  }

  gallery.width = layout.width;
  gallery.columns = layout.columns;
  gallery.visible = layout.visible;
  gallery.renderKey = key;
  gallery.visibleIndexes = getRandomIndexes(gallery, layout.visible);
  gallery.grid.style.setProperty("--random-gallery-columns", String(layout.columns));
  gallery.grid.replaceChildren(...gallery.visibleIndexes.map((index) => createMediaItem(gallery, index)));

  requestAnimationFrame(() => makeVisible(gallery));
}

function replaceGalleryItem(gallery, itemIndex, nextImageIndex) {
  const currentItem = gallery.grid.children[itemIndex];

  if (!(currentItem instanceof HTMLElement)) {
    return;
  }

  currentItem.classList.add("is-changing");

  window.setTimeout(() => {
    const nextItem = createMediaItem(gallery, nextImageIndex);
    currentItem.replaceWith(nextItem);
    gallery.visibleIndexes[itemIndex] = nextImageIndex;
  }, CHANGE_CLASS_DURATION);
}

function tickGallery(gallery) {
  if (gallery.isPointerPaused || isPagePaused()) {
    return;
  }

  if (!gallery.visibleIndexes.length || gallery.visibleIndexes.length >= gallery.count) {
    return;
  }

  const visibleSet = new Set(gallery.visibleIndexes);
  const candidates = gallery.pool.filter((index) => !visibleSet.has(index));
  const slots = shuffleItems(Array.from({ length: gallery.visibleIndexes.length }, (_, index) => index));
  const nextImages = shuffleItems(candidates);
  const batch = Math.min(gallery.batch, slots.length, nextImages.length);

  for (let index = 0; index < batch; index += 1) {
    replaceGalleryItem(gallery, slots[index], nextImages[index]);
  }
}

function shuffleGallery(gallery) {
  gallery.root.classList.remove("is-visible");

  window.setTimeout(() => {
    renderGallery(gallery, true);
  }, CHANGE_CLASS_DURATION);
}

function bindPauseEvents(gallery) {
  gallery.root.addEventListener("mouseenter", () => {
    gallery.isPointerPaused = true;
  });

  gallery.root.addEventListener("mouseleave", () => {
    gallery.isPointerPaused = false;
  });

  gallery.root.addEventListener("focusin", () => {
    gallery.isPointerPaused = true;
  });

  gallery.root.addEventListener("focusout", () => {
    gallery.isPointerPaused = false;
  });
}

function createGallery(root) {
  const grid = root.querySelector(GRID_SELECTOR);

  if (!(grid instanceof HTMLElement)) {
    return null;
  }

  const id = root.dataset.randomGalleryId || "random-gallery-" + (registry.size + 1);
  const path = root.dataset.randomGalleryPath || "";

  if (!path) {
    return null;
  }

  const count = readNumber(root.dataset.randomGalleryCount, DEFAULT_COUNT, 1);
  const rows = readNumber(root.dataset.randomGalleryRows, DEFAULT_ROWS, 1);
  const minWidth = readNumber(root.dataset.randomGalleryMinWidth, DEFAULT_MIN_WIDTH, 40);
  const delay = readNumber(root.dataset.randomGalleryDelay, DEFAULT_DELAY, 400);
  const batch = readNumber(root.dataset.randomGalleryBatch, DEFAULT_BATCH, 1);
  const pool = Array.from({ length: count }, (_, index) => index + 1);

  const gallery = {
    id,
    root,
    grid,
    path,
    count,
    rows,
    minWidth,
    delay,
    batch,
    pool,
    columns: 0,
    visible: 0,
    width: 0,
    renderKey: "",
    visibleIndexes: [],
    isPointerPaused: false,
    resizeObserver: null,
    interval: null,
  };

  root.classList.add("is-enhanced");
  bindPauseEvents(gallery);
  renderGallery(gallery, true);

  gallery.resizeObserver = new ResizeObserver(() => {
    const layout = calculateLayout(gallery);

    if (!layout) {
      return;
    }

    const widthChanged = Math.abs(layout.width - gallery.width) > RESIZE_TOLERANCE;
    const columnsChanged = layout.columns !== gallery.columns;

    if (widthChanged || columnsChanged) {
      renderGallery(gallery, true);
    }
  });

  gallery.resizeObserver.observe(gallery.grid);
  gallery.interval = window.setInterval(() => tickGallery(gallery), delay);
  registry.set(id, gallery);

  return gallery;
}

function bindShuffleButtons(scope) {
  scope.querySelectorAll(SHUFFLE_SELECTOR).forEach((button) => {
    if (button.dataset.randomGalleryBound === "true") {
      return;
    }

    button.dataset.randomGalleryBound = "true";
    button.addEventListener("click", () => {
      const gallery = registry.get(button.dataset.randomGalleryTarget || "");

      if (gallery) {
        shuffleGallery(gallery);
      }
    });
  });
}

export function initRandomGalleries(root = document) {
  const scope = root instanceof ParentNode ? root : document;

  scope.querySelectorAll(ROOT_SELECTOR).forEach((element) => {
    if (!(element instanceof HTMLElement) || mountedRoots.has(element)) {
      return;
    }

    const gallery = createGallery(element);

    if (gallery) {
      mountedRoots.add(element);
    }
  });

  bindShuffleButtons(scope);
}

function autoInit() {
  initRandomGalleries(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit, { once: true });
} else {
  autoInit();
}
