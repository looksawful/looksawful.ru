const RANDOM_GALLERY_SELECTOR = "[data-random-gallery]";
const SHUFFLE_SELECTOR = "[data-random-gallery-shuffle]";
const READY_ATTRIBUTE = "data-random-gallery-ready";
const DEFAULT_COUNT = 53;
const DEFAULT_ROWS = 2;
const DEFAULT_MIN_WIDTH = 118;
const DEFAULT_DELAY = 3600;
const DEFAULT_SWAP_COUNT = 1;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const galleryRegistry = new Map();

function readPositiveNumber(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function padNumber(number) {
  return String(number).padStart(2, "0");
}

function getExtension(root) {
  return root.dataset.randomGalleryExtension || "webp";
}

function getPath(root, index) {
  const basePath = String(root.dataset.randomGalleryPath || "").replace(/\/$/, "");
  const extension = getExtension(root).replace(/^\./, "");

  return basePath + "/" + padNumber(index) + "." + extension;
}

function shuffleArray(source) {
  const copy = source.slice();

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  return copy;
}

function createShuffleIcon() {
  return [
    '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '<path d="M2 4h2.2c1.2 0 2 .5 2.8 1.7l2 3c.7 1.1 1.5 1.3 2.8 1.3H14" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>',
    '<path d="M11.5 7.5 14 10l-2.5 2.5" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M2 12h2.2c1.2 0 2-.5 2.8-1.7l.4-.6M8.6 6.3l.4-.6C9.7 4.6 10.5 4 11.8 4H14" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>',
    '<path d="M11.5 1.5 14 4l-2.5 2.5" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>',
    "</svg>",
  ].join("");
}

function createItem(root, index) {
  const path = getPath(root, index);
  const link = document.createElement("a");
  const image = document.createElement("img");

  link.className = "media-item no-stroke media-hover-cover";
  link.href = path;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.randomGalleryItem = String(index);

  image.alt = "";
  image.decoding = "async";
  image.loading = "lazy";
  image.src = path;

  link.appendChild(image);

  return link;
}

function createButton(root) {
  const id = root.dataset.randomGalleryId;
  const label = root.dataset.randomGalleryButtonLabel || "перемешать";
  const button = document.createElement("button");

  button.type = "button";
  button.className = "random-gallery-shell__button";
  button.dataset.randomGalleryShuffle = id || "";
  button.innerHTML = createShuffleIcon() + "<span>" + label + "</span>";

  return button;
}

function createShell(root) {
  if (root.parentElement?.classList.contains("random-gallery-shell")) {
    return root.parentElement;
  }

  const shell = document.createElement("div");
  const bar = document.createElement("div");
  const caption = document.createElement("p");

  shell.className = "random-gallery-shell";
  bar.className = "random-gallery-shell__bar";
  caption.className = "random-gallery-shell__caption";
  caption.textContent = root.dataset.randomGalleryCaption || root.getAttribute("aria-label") || "галерея";

  bar.append(caption, createButton(root));
  root.before(shell);
  shell.append(bar, root);

  return shell;
}

function calculateLayout(root, count) {
  const width = root.getBoundingClientRect().width;

  if (!width) {
    return null;
  }

  const computed = window.getComputedStyle(root);
  const gap = parseFloat(computed.columnGap || computed.gap || "0") || 0;
  const rows = Math.max(1, Math.floor(readPositiveNumber(root.dataset.randomGalleryRows, DEFAULT_ROWS)));
  const minWidth = readPositiveNumber(root.dataset.randomGalleryMinWidth, DEFAULT_MIN_WIDTH);
  const columns = Math.max(2, Math.floor((width + gap) / (minWidth + gap)));
  const visible = Math.min(count, Math.max(1, columns * rows));

  return { columns, visible };
}

function revealItems(root, items) {
  if (!items.length || typeof window.gsap === "undefined" || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry || !entry.isIntersecting) {
        return;
      }

      observer.disconnect();

      window.gsap.fromTo(
        items,
        { y: 4, scale: 0.998, transformOrigin: "50% 50%" },
        {
          y: 0,
          scale: 1,
          duration: 0.58,
          ease: "power2.out",
          stagger: {
            amount: Math.min(0.12, Math.max(0.035, items.length * 0.006)),
            from: "center",
            grid: "auto",
          },
          overwrite: "auto",
          clearProps: "transform,transformOrigin",
        },
      );
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" },
  );

  observer.observe(root);
}

function initRandomGallery(root) {
  if (!(root instanceof HTMLElement) || root.hasAttribute(READY_ATTRIBUTE)) {
    return;
  }

  const count = Math.floor(readPositiveNumber(root.dataset.randomGalleryCount, DEFAULT_COUNT));
  const pool = Array.from({ length: count }, (_, index) => index + 1);
  const id = root.dataset.randomGalleryId || "random-gallery-" + Math.random().toString(36).slice(2);
  const delay = readPositiveNumber(root.dataset.randomGalleryDelay, DEFAULT_DELAY);
  const swapCount = Math.max(1, Math.floor(readPositiveNumber(root.dataset.randomGallerySwapCount, DEFAULT_SWAP_COUNT)));
  const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  root.dataset.randomGalleryId = id;
  root.setAttribute(READY_ATTRIBUTE, "true");
  root.classList.add("media-random-gallery");

  createShell(root);

  let columns = 0;
  let visible = 0;
  let current = [];
  let frame = 0;
  let timer = 0;
  let isHovered = false;
  let isFocused = false;
  let isLightboxPaused = false;
  let isDocumentHidden = document.hidden;

  function isPaused() {
    return isHovered || isFocused || isLightboxPaused || isDocumentHidden || reduceMotion.matches;
  }

  function setPaused(value) {
    root.classList.toggle("is-paused", value);
  }

  function getCandidates(exclude) {
    const excluded = new Set(exclude);
    const candidates = pool.filter((index) => !excluded.has(index));

    return candidates.length ? candidates : pool.slice();
  }

  function render(forceShuffle) {
    const layout = calculateLayout(root, count);

    if (!layout) {
      return;
    }

    const layoutChanged = layout.columns !== columns || layout.visible !== visible;

    if (!forceShuffle && !layoutChanged && current.length) {
      return;
    }

    columns = layout.columns;
    visible = layout.visible;
    root.style.setProperty("--random-gallery-cols", String(columns));

    root.classList.add("is-shuffling");

    window.setTimeout(() => {
      current = shuffleArray(pool).slice(0, visible);
      root.replaceChildren(...current.map((index) => createItem(root, index)));
      root.classList.remove("is-shuffling");
      revealItems(root, Array.from(root.children));
    }, 180);
  }

  function replaceOne(index) {
    const item = root.children[index];

    if (!(item instanceof HTMLElement)) {
      return;
    }

    const candidates = getCandidates(current);
    const nextIndex = candidates[Math.floor(Math.random() * candidates.length)];

    item.classList.add("is-changing");

    window.setTimeout(() => {
      const nextItem = createItem(root, nextIndex);
      item.replaceWith(nextItem);
      current[index] = nextIndex;
    }, 260);
  }

  function tick() {
    window.clearTimeout(timer);

    if (!isPaused() && current.length) {
      const positions = shuffleArray(Array.from({ length: current.length }, (_, index) => index)).slice(0, swapCount);
      positions.forEach(replaceOne);
    }

    setPaused(isPaused());
    timer = window.setTimeout(tick, delay);
  }

  function requestRender(forceShuffle) {
    if (frame) {
      window.cancelAnimationFrame(frame);
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      render(forceShuffle);
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    requestRender(false);
  });

  const lightboxObserver = new MutationObserver(() => {
    isLightboxPaused = document.documentElement.classList.contains("has-lightbox");
    setPaused(isPaused());
  });

  root.addEventListener("mouseenter", () => {
    isHovered = true;
    setPaused(isPaused());
  });

  root.addEventListener("mouseleave", () => {
    isHovered = false;
    setPaused(isPaused());
  });

  root.addEventListener("focusin", () => {
    isFocused = true;
    setPaused(isPaused());
  });

  root.addEventListener("focusout", () => {
    isFocused = false;
    setPaused(isPaused());
  });

  root.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a.media-item")) {
      isLightboxPaused = true;
      setPaused(true);
    }
  });

  document.addEventListener("visibilitychange", () => {
    isDocumentHidden = document.hidden;
    setPaused(isPaused());
  });

  resizeObserver.observe(root);
  lightboxObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  galleryRegistry.set(id, {
    shuffle: () => requestRender(true),
    destroy: () => {
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      lightboxObserver.disconnect();
      galleryRegistry.delete(id);
    },
  });

  requestRender(true);
  tick();
}

function initRandomGalleries(root = document) {
  root.querySelectorAll(RANDOM_GALLERY_SELECTOR).forEach(initRandomGallery);
}

document.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(SHUFFLE_SELECTOR) : null;

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const gallery = galleryRegistry.get(button.dataset.randomGalleryShuffle || "");

  if (gallery) {
    gallery.shuffle();
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initRandomGalleries(), { once: true });
} else {
  initRandomGalleries();
}

export { initRandomGalleries };
