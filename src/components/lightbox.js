const DISABLED_SELECTOR = ':not([data-lightbox="off"]):not([data-lightbox="false"])';
const LIGHTBOX_SELECTOR = [
  `[data-lightbox]${DISABLED_SELECTOR}`,
  `[data-lightbox-item]${DISABLED_SELECTOR}`,
  `[data-lightbox-video]${DISABLED_SELECTOR}`,
  `a[data-section-media-item][href]${DISABLED_SELECTOR}`
].join(", ");
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)(\?.*)?(#.*)?$/i;
const EXPLICIT_LIGHTBOX_TYPES = new Set(["image", "video"]);
const SWIPE_THRESHOLD = 42;
const PREFETCH_RADIUS = 1;

let lightboxInstance = null;
const mountedRoots = new WeakSet();
const prefetchedImages = new Set();

const state = {
  activeTrigger: null,
  items: [],
  index: 0,
  pointerStartX: 0,
  pointerActive: false,
};

function syncLightboxViewport() {
  if (!lightboxInstance?.root) return;
  lightboxInstance.root.style.setProperty("--lightbox-real-vh", window.innerHeight + "px");
  lightboxInstance.root.style.setProperty("--lightbox-real-vw", window.innerWidth + "px");
}


const icons = {
  prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.7 2.2 4.9 8l5.8 5.8-1.4 1.4L2.1 8 9.3.8l1.4 1.4Z"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.3 13.8 5.8-5.8-5.8-5.8L6.7.8 13.9 8l-7.2 7.2-1.4-1.4Z"/></svg>',
};

const getMediaType = (src = "", explicitType = "") => {
  if (explicitType) {
    return explicitType;
  }

  return VIDEO_EXTENSION_PATTERN.test(src) ? "video" : "image";
};

const getMediaData = (trigger) => {
  const explicitSrc = trigger.dataset.lightboxSrc;
  const explicitType =
    trigger.dataset.lightboxType ||
    (EXPLICIT_LIGHTBOX_TYPES.has(trigger.dataset.lightbox) ? trigger.dataset.lightbox : "");

  if (explicitSrc) {
    return { src: explicitSrc, type: getMediaType(explicitSrc, explicitType) };
  }

  if (trigger instanceof HTMLAnchorElement && trigger.href) {
    return { src: trigger.href, type: getMediaType(trigger.href, explicitType) };
  }

  const video = trigger.matches("video") ? trigger : trigger.querySelector("video");
  if (video instanceof HTMLVideoElement) {
    return { src: video.currentSrc || video.src, type: "video" };
  }

  const image = trigger.matches("img") ? trigger : trigger.querySelector("img");
  if (image instanceof HTMLImageElement) {
    return { src: image.currentSrc || image.src, type: "image" };
  }

  const canvas = trigger.matches("canvas") ? trigger : trigger.querySelector("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    try {
      return { src: canvas.toDataURL("image/png"), type: "image" };
    } catch {
      return null;
    }
  }

  return null;
};

const getGalleryItems = (trigger) => {
  const group = trigger.closest?.("[data-showcase] [data-media-cluster]");
  if (!group) return [trigger];

  const items = Array.from(group.querySelectorAll(LIGHTBOX_SELECTOR)).filter((item) => getMediaData(item)?.src);
  return items.length ? items : [trigger];
};

const prepareLightboxImage = (image) => {
  image.decoding = "async";
  image.loading = "eager";

  if ("fetchPriority" in image) {
    image.fetchPriority = "high";
  }
};

const prefetchImage = (src) => {
  if (!src || prefetchedImages.has(src)) {
    return;
  }

  prefetchedImages.add(src);

  const image = new Image();
  image.decoding = "async";

  if ("fetchPriority" in image) {
    image.fetchPriority = "low";
  }

  image.src = src;
};

const prefetchAdjacentItems = () => {
  if (state.items.length < 2) {
    return;
  }

  for (let offset = -PREFETCH_RADIUS; offset <= PREFETCH_RADIUS; offset += 1) {
    if (offset === 0) continue;

    const nextIndex = (state.index + offset + state.items.length) % state.items.length;
    const mediaData = getMediaData(state.items[nextIndex]);

    if (mediaData?.type === "image") {
      prefetchImage(mediaData.src);
    }
  }
};

const createLightbox = () => {
  if (lightboxInstance) {
    return lightboxInstance;
  }

  const root = document.createElement("div");
  root.className = "lightbox";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="просмотр медиа">
      <div class="lightbox__toolbar">
        <button class="lightbox__close" type="button">закрыть</button>
      </div>
      <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="предыдущее изображение">${icons.prev}</button>
      <div class="lightbox__body"></div>
      <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="следующее изображение">${icons.next}</button>
      <div class="lightbox__counter" aria-live="polite"></div>
    </div>
  `;

  document.body.append(root);

  lightboxInstance = {
    root,
    body: root.querySelector(".lightbox__body"),
    close: root.querySelector(".lightbox__close"),
    prev: root.querySelector(".lightbox__nav--prev"),
    next: root.querySelector(".lightbox__nav--next"),
    counter: root.querySelector(".lightbox__counter"),
    isBound: false,
  };

  return lightboxInstance;
};

const syncControls = (lightbox) => {
  const hasMultiple = state.items.length > 1;

  lightbox.prev.disabled = !hasMultiple;
  lightbox.next.disabled = !hasMultiple;
  lightbox.counter.textContent = hasMultiple ? `${state.index + 1}/${state.items.length}` : "";
};

const renderActiveItem = (lightbox) => {
  const trigger = state.items[state.index];
  const mediaData = trigger ? getMediaData(trigger) : null;

  if (!mediaData?.src) return;

  const media = mediaData.type === "video" ? document.createElement("video") : document.createElement("img");
  media.src = mediaData.src;
  state.activeTrigger = trigger;

  if (media instanceof HTMLVideoElement) {
    media.controls = true;
    media.autoplay = false;
    media.playsInline = true;
    media.preload = "metadata";
    media.poster = trigger.querySelector("video")?.poster || trigger.querySelector("img")?.currentSrc || "";
  } else {
    media.alt = trigger.querySelector("img")?.alt || "";
    prepareLightboxImage(media);
  }

  lightbox.body.replaceChildren(media);

  const syncOrientation = () => {
    const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
    const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
    if (width && height) {
      lightbox.root.dataset.mediaOrientation = width >= height ? "landscape" : "portrait";
    }
  };

  media.addEventListener(media instanceof HTMLVideoElement ? "loadedmetadata" : "load", syncOrientation, { once: true });
  syncOrientation();
  syncControls(lightbox);
  prefetchAdjacentItems();
};

const step = (direction) => {
  if (!lightboxInstance || state.items.length < 2) return;

  state.index = (state.index + direction + state.items.length) % state.items.length;
  renderActiveItem(lightboxInstance);
};

export function initLightbox(root = document) {
  if (mountedRoots.has(root)) {
    return;
  }

  mountedRoots.add(root);

  const lightbox = createLightbox();

  if (
    !(lightbox.body instanceof HTMLElement) ||
    !(lightbox.close instanceof HTMLButtonElement) ||
    !(lightbox.prev instanceof HTMLButtonElement) ||
    !(lightbox.next instanceof HTMLButtonElement) ||
    !(lightbox.counter instanceof HTMLElement)
  ) {
    return;
  }

  const close = () => {
    if (!lightbox.root.classList.contains("is-open")) {
      return;
    }

    lightbox.root.classList.remove("is-open");
    lightbox.root.setAttribute("aria-hidden", "true");
    lightbox.body.replaceChildren();
    document.documentElement.classList.remove("has-lightbox");

    if (state.activeTrigger?.isConnected) {
      state.activeTrigger.focus?.({ preventScroll: true });
    }

    state.activeTrigger = null;
    state.items = [];
    state.index = 0;
    state.pointerActive = false;
  };

  const open = (trigger) => {
    syncLightboxViewport();
    state.items = getGalleryItems(trigger);
    state.index = Math.max(0, state.items.indexOf(trigger));

    renderActiveItem(lightbox);

    lightbox.root.classList.add("is-open");
    lightbox.root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("has-lightbox");
    lightbox.close.focus();
  };

  const activate = (event, trigger) => {
    if (!(trigger instanceof HTMLElement) || !getMediaData(trigger)?.src) {
      return;
    }

    event.preventDefault();
    open(trigger);
  };

  root.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest(LIGHTBOX_SELECTOR) : null;
    activate(event, trigger);
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const trigger = event.target instanceof Element ? event.target.closest(LIGHTBOX_SELECTOR) : null;

    if (!trigger) {
      return;
    }

    event.preventDefault();
    activate(event, trigger);
  });

  if (!lightbox.isBound) {
    lightbox.close.addEventListener("click", close);
    lightbox.prev.addEventListener("click", () => step(-1));
    lightbox.next.addEventListener("click", () => step(1));

    lightbox.root.addEventListener("click", (event) => {
      if (event.target === lightbox.root) {
        close();
      }
    });

    lightbox.root.addEventListener("pointerdown", (event) => {
      if (!(event.target instanceof Element) || event.target.closest("button")) return;

      state.pointerActive = true;
      state.pointerStartX = event.clientX;
      lightbox.root.setPointerCapture?.(event.pointerId);
    });

    lightbox.root.addEventListener("pointerup", (event) => {
      if (!state.pointerActive) return;

      state.pointerActive = false;
      const delta = event.clientX - state.pointerStartX;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;

      step(delta < 0 ? 1 : -1);
    });

    lightbox.root.addEventListener("pointercancel", () => {
      state.pointerActive = false;
    });

    window.addEventListener("keydown", (event) => {
      if (!lightbox.root.classList.contains("is-open")) return;

      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    window.addEventListener("resize", syncLightboxViewport, { passive: true });
    window.addEventListener("orientationchange", syncLightboxViewport, { passive: true });

    lightbox.isBound = true;
  }
}
