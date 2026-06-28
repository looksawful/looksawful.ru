const TILE_RAIL_MIN_ITEMS = 8;
const SNAP_MIN_ITEMS = 2;
const SNAP_MAX_ITEMS = 4;
const WARMUP_ROOT_MARGIN = "900px 0px";
const WARMUP_INITIAL_COUNT = 6;
const WARMUP_BATCH_SIZE = 4;
const WARMUP_AROUND_BEFORE = 2;
const WARMUP_AROUND_AFTER = 5;
const AUTOPLAY_DELAY = 5000;

const ENHANCED_GROUP_SELECTOR = "#showcase .case-chapter__body .media-group";
const GROUP_MEDIA_SELECTOR = ":scope > .media-item, :scope > .media-group__track > .media-item";
const DIRECT_MEDIA_SELECTOR = ":scope > .media-item";

const mountedRoots = new WeakSet();

const icons = {
  prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.7 2.2 4.9 8l5.8 5.8-1.4 1.4L2.1 8 9.3.8l1.4 1.4Z"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.3 13.8 5.8-5.8-5.8-5.8L6.7.8 13.9 8l-7.2 7.2-1.4-1.4Z"/></svg>',
  grid: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 1.5h5v5h-5v-5Zm8 0h5v5h-5v-5Zm-8 8h5v5h-5v-5Zm8 0h5v5h-5v-5Z"/></svg>',
  view: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H2V2Zm0 11h5v1.5H2V13Zm7 0h5v1.5H9V13Z"/></svg>',
};

const noop = () => {};

function canUseBackgroundWarmup() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData) return false;
  if (/2g/i.test(connection?.effectiveType || "")) return false;

  return true;
}

function runWhenIdle(callback, timeout = 900) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, 120);
}

function getItemMedia(item) {
  return item.querySelector("img, video");
}

function warmMediaItem(item, priority = "low") {
  const media = getItemMedia(item);

  if (media instanceof HTMLImageElement) {
    media.decoding = "async";
    media.loading = "eager";

    if ("fetchPriority" in media) {
      media.fetchPriority = priority;
    }
  }

  if (media instanceof HTMLVideoElement) {
    media.preload = media.getAttribute("preload") || "metadata";
  }
}

function observeGroupWarmup(group, start) {
  if (!("IntersectionObserver" in window)) {
    runWhenIdle(start);
    return noop;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      start();
    },
    { rootMargin: WARMUP_ROOT_MARGIN, threshold: 0 },
  );

  observer.observe(group);
  return () => observer.disconnect();
}

function setupMediaWarmup(group, items, mode) {
  const warmed = new WeakSet();
  const allowBackground = canUseBackgroundWarmup();
  let nextSequentialIndex = 0;
  let scheduled = false;
  let started = false;

  const warmAt = (index, priority = "low") => {
    const item = items[index];
    if (!item || warmed.has(item)) return;

    warmed.add(item);
    warmMediaItem(item, priority);
  };

  const warmRange = (start, end, priority = "low") => {
    const from = Math.max(0, start);
    const to = Math.min(items.length, end);

    for (let index = from; index < to; index += 1) {
      warmAt(index, priority);
    }

    nextSequentialIndex = Math.max(nextSequentialIndex, to);
  };

  const warmNextBatch = () => {
    scheduled = false;

    if (!allowBackground || nextSequentialIndex >= items.length) {
      return;
    }

    warmRange(nextSequentialIndex, nextSequentialIndex + WARMUP_BATCH_SIZE);

    if (nextSequentialIndex < items.length) {
      scheduleNextBatch();
    }
  };

  function scheduleNextBatch() {
    if (scheduled || !allowBackground) return;

    scheduled = true;
    runWhenIdle(warmNextBatch, 1400);
  }

  const start = () => {
    started = true;

    const initialCount = mode === "snap" ? items.length : Math.min(items.length, WARMUP_INITIAL_COUNT);

    warmRange(0, initialCount);
    scheduleNextBatch();
  };

  const stop = observeGroupWarmup(group, start);

  return {
    stop,
    warmAround(index) {
      if (!started) return;

      warmRange(index - WARMUP_AROUND_BEFORE, index + WARMUP_AROUND_AFTER);
    },
  };
}

function readableCaption(link) {
  const explicit = link.getAttribute("data-caption");
  if (explicit) return explicit;

  const media = link.querySelector("img, video");
  const alt = media?.getAttribute("alt");
  if (alt) return alt;

  const href = link.getAttribute("href") || media?.getAttribute("src") || "";
  const file = decodeURIComponent(href.split("/").filter(Boolean).pop() || "");
  return file.replace(/\.(webp|png|jpe?g|gif|mp4|webm|mov)$/i, "").replace(/[-_]+/g, " ");
}

function markOrientation(link) {
  const img = link.querySelector("img");
  if (!img) return;

  const apply = () => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return;

    const ratio = width / height;
    const orientation = ratio > 1.18 ? "landscape" : ratio < 0.86 ? "portrait" : "square";
    link.setAttribute("data-orientation", orientation);
    link.style.setProperty("--media-span", ratio > 2.15 ? "3" : ratio > 1.18 ? "2" : "1");
  };

  if (img.complete) apply();
  else img.addEventListener("load", apply, { once: true });
}

function createButton(className, label, icon) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;
  return button;
}

function createDots(items) {
  const dots = document.createElement("div");
  dots.className = "media-group__dots";
  dots.setAttribute("aria-label", "навигация по изображениям");

  const buttons = items.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "media-group__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `изображение ${index + 1}`);
    dots.append(dot);
    return dot;
  });

  return { dots, buttons };
}

function createControls({ includeToggle }) {
  const controls = document.createElement("div");
  controls.className = "media-group__controls";

  const prev = createButton(
    "media-group__button media-group__button--prev",
    "предыдущее изображение",
    icons.prev,
  );
  const counter = document.createElement("span");
  counter.className = "media-group__counter";
  counter.setAttribute("aria-live", "polite");

  const next = createButton(
    "media-group__button media-group__button--next",
    "следующее изображение",
    icons.next,
  );

  controls.append(prev, counter, next);

  let toggle = null;
  if (includeToggle) {
    toggle = createButton(
      "media-group__button media-group__button--toggle",
      "переключить режим просмотра",
      icons.view,
    );
    toggle.setAttribute("aria-pressed", "false");
    controls.append(toggle);
  }

  return { controls, prev, counter, next, toggle };
}

function getGroupItems(group) {
  return Array.from(group.querySelectorAll(GROUP_MEDIA_SELECTOR));
}

function getDeclaredCount(group, items) {
  const declaredCount = Number.parseInt(group.dataset.mediaCount || "", 10);
  return Number.isFinite(declaredCount) && declaredCount > 0 ? declaredCount : items.length;
}

function getKnownOrientations(items) {
  return items.map((item) => item.getAttribute("data-orientation")).filter(Boolean);
}

function shouldUseSnap(group, items, count) {
  if (count < SNAP_MIN_ITEMS || count > SNAP_MAX_ITEMS) return false;
  if (count < SNAP_MAX_ITEMS) return true;
  if (group.classList.contains("media-group--landscape")) return true;
  if (group.classList.contains("media-group--portrait")) return true;
  if (!group.classList.contains("media-group--square")) return true;

  const orientations = getKnownOrientations(items);
  if (orientations.length < items.length) return false;

  const nonSquareCount = orientations.filter((orientation) => orientation !== "square").length;
  return nonSquareCount >= Math.ceil(items.length * 0.75);
}

function resolveGalleryMode(group, items, count) {
  if (count >= TILE_RAIL_MIN_ITEMS) return "rail";
  if (shouldUseSnap(group, items, count)) return "snap";
  return "";
}

function ensureTrack(group, items) {
  const existingTrack = group.querySelector(":scope > .media-group__track");
  if (existingTrack) return existingTrack;

  const directItems = Array.from(group.querySelectorAll(DIRECT_MEDIA_SELECTOR));
  if (!directItems.length) return null;

  const track = document.createElement("div");
  track.className = "media-group__track";
  directItems[0].before(track);
  track.append(...directItems);

  return track;
}

function insertAfterIntro(group, node) {
  const title = group.querySelector(":scope > .media-group__title");
  if (title) title.after(node);
  else group.prepend(node);
}

function nearestItemIndex(track, items) {
  const trackLeft = track.getBoundingClientRect().left;
  let nearest = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [index, item] of items.entries()) {
    const distance = Math.abs(item.getBoundingClientRect().left - trackLeft);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function enhanceScrollableGroup(group) {
  if (group.dataset.galleryEnhanced === "true") return;

  const items = getGroupItems(group);
  const count = getDeclaredCount(group, items);
  const mode = resolveGalleryMode(group, items, count);

  if (!mode || !items.length) return;

  const track = ensureTrack(group, items);
  if (!track) return;

  const includeToggle = count >= SNAP_MIN_ITEMS;
  const controls = createControls({ includeToggle });
  const dots = mode === "snap" ? createDots(items) : null;

  group.dataset.galleryEnhanced = "true";
  group.dataset.galleryMode = mode;
  group.classList.add("media-group--scrollable", `media-group--${mode === "rail" ? "tile-rail" : "snap"}`);
  if (includeToggle) group.classList.add("media-group--viewer-ready");

  insertAfterIntro(group, controls.controls);
  if (dots) group.append(dots.dots);

  let index = 0;
  let scrollTimer = 0;
  let pointerDown = false;
  let pointerStartX = 0;
  let pointerStartLeft = 0;
  let pointerDragged = false;
  let suppressClick = false;
  let autoplayTimer = 0;
  let autoplayDirection = 1;
  const warmup = setupMediaWarmup(group, items, mode);

  const isViewer = () => group.classList.contains("is-viewer");

  const syncEdges = () => {
    if (isViewer()) {
      group.classList.toggle("has-scroll-overflow", false);
      const disabled = items.length < 2;
      controls.prev.disabled = disabled;
      controls.next.disabled = disabled;
      return;
    }

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    group.classList.toggle("has-scroll-overflow", maxScroll > 1);
    controls.prev.disabled = track.scrollLeft <= 1;
    controls.next.disabled = maxScroll <= 1 || track.scrollLeft >= maxScroll - 1;
  };

  const syncIndex = (nextIndex) => {
    index = Math.max(0, Math.min(items.length - 1, nextIndex));
    warmup.warmAround(index);

    for (const [itemIndex, item] of items.entries()) {
      item.classList.toggle("is-active", itemIndex === index);
    }

    if (dots) {
      for (const [dotIndex, dot] of dots.buttons.entries()) {
        dot.classList.toggle("is-active", dotIndex === index);
        dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
      }
    }

    controls.counter.textContent = `${index + 1}/${items.length}`;
    syncEdges();
  };

  const scrollToIndex = (nextIndex, behavior = "smooth") => {
    syncIndex(nextIndex);

    if (isViewer()) {
      return;
    }

    const item = items[index];
    const left = Math.max(0, item.offsetLeft - track.offsetLeft);

    track.scrollTo({
      left,
      behavior,
    });
  };

  const getNextAutoplayIndex = () => {
    if (index >= items.length - 1) autoplayDirection = -1;
    if (index <= 0) autoplayDirection = 1;
    return index + autoplayDirection;
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = 0;
  };

  const isAutoplayEnabled = () => group.dataset.galleryAutoplay === "true";

  const startAutoplay = () => {
    stopAutoplay();

    if (
      !isAutoplayEnabled() ||
      items.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    autoplayTimer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      scrollToIndex(getNextAutoplayIndex());
    }, AUTOPLAY_DELAY);
  };

  const updateFromScroll = () => {
    if (isViewer()) return;
    syncIndex(nearestItemIndex(track, items));
  };

  const snapToNearest = () => {
    scrollToIndex(nearestItemIndex(track, items));
  };

  const setViewer = (enabled) => {
    if (!controls.toggle) return;

    if (enabled) {
      syncIndex(nearestItemIndex(track, items));
    }

    group.classList.toggle("is-viewer", enabled);
    controls.toggle.setAttribute("aria-pressed", String(enabled));
    controls.toggle.innerHTML = enabled ? icons.grid : icons.view;
    syncIndex(index);

    if (!enabled) {
      requestAnimationFrame(() => scrollToIndex(index, "auto"));
    }
  };

  controls.prev.addEventListener("click", () => {
    if (isViewer() || mode === "snap") {
      scrollToIndex(index - 1);
      startAutoplay();
      return;
    }

    track.scrollBy({ left: -Math.max(1, track.clientWidth * 0.86), behavior: "smooth" });
    startAutoplay();
  });

  controls.next.addEventListener("click", () => {
    if (isViewer() || mode === "snap") {
      scrollToIndex(index + 1);
      startAutoplay();
      return;
    }

    track.scrollBy({ left: Math.max(1, track.clientWidth * 0.86), behavior: "smooth" });
    startAutoplay();
  });

  controls.toggle?.addEventListener("click", () => setViewer(!isViewer()));

  dots?.buttons.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => {
      scrollToIndex(dotIndex);
      startAutoplay();
    });
  });

  track.addEventListener("pointerdown", (event) => {
    if (isViewer() || event.button !== 0) return;

    pointerDown = true;
    pointerDragged = false;
    pointerStartX = event.clientX;
    pointerStartLeft = track.scrollLeft;
    track.classList.add("is-dragging");
  });

  track.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;

    const delta = event.clientX - pointerStartX;
    if (Math.abs(delta) > 4 && !pointerDragged) {
      pointerDragged = true;
      track.setPointerCapture?.(event.pointerId);
    }
    track.scrollLeft = pointerStartLeft - delta;
  });

  track.addEventListener("pointerup", (event) => {
    if (!pointerDown) return;

    pointerDown = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);

    if (pointerDragged) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }

    if (mode === "snap") snapToNearest();
    else updateFromScroll();
    startAutoplay();
  });

  track.addEventListener("pointercancel", () => {
    pointerDown = false;
    pointerDragged = false;
    track.classList.remove("is-dragging");
  });

  track.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  track.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(updateFromScroll, 80);
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => updateFromScroll());
    resizeObserver.observe(track);
  } else {
    window.addEventListener("resize", updateFromScroll);
  }

  syncIndex(0);
  requestAnimationFrame(updateFromScroll);
}

export function initPortfolioGallery(root = document) {
  if (mountedRoots.has(root)) return null;
  mountedRoots.add(root);

  const items = Array.from(root.querySelectorAll("#showcase [data-lightbox-item], #showcase [data-lightbox-video]"));

  for (const item of items) {
    const caption = readableCaption(item);
    if (caption && !item.getAttribute("data-caption")) item.setAttribute("data-caption", caption);
    markOrientation(item);
  }

  const groups = Array.from(root.querySelectorAll(ENHANCED_GROUP_SELECTOR));
  for (const group of groups) {
    enhanceScrollableGroup(group);
  }

  return { items: items.length, groups: groups.length };
}
