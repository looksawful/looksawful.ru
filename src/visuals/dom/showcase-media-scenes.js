import { createAnimationItems, getAnimationScene } from "../canvas/showcase-animation-assets.js";

const IMAGE_EXTENSIONS = new Set(["webp", "png", "jpg", "jpeg", "avif", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

const DEFAULT_LIMIT = 24;
const ORBIT_DESKTOP_LIMIT = 24;
const ORBIT_MOBILE_LIMIT = 14;
const PRELOAD_COUNT = 4;

const getExtension = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";

const getVariant = (element) => {
  if (element.classList.contains("media-group--orbit")) return "orbit";
  if (element.classList.contains("media-group--strip")) return "strip";
  if (element.classList.contains("media-group--grid")) return "grid";

  return "default";
};

const getLimit = (element, scene, variant) => {
  const attrLimit = Number.parseInt(element.dataset.mediaLimit || "", 10);
  const requestedLimit =
    Number.isFinite(attrLimit) && attrLimit > 0 ? attrLimit : scene?.defaultMaxItems || DEFAULT_LIMIT;

  if (variant !== "orbit") {
    return requestedLimit;
  }

  const isMobile = globalThis.matchMedia?.("(max-width: 760px)")?.matches;
  return Math.min(requestedLimit, isMobile ? ORBIT_MOBILE_LIMIT : ORBIT_DESKTOP_LIMIT);
};

const getRepeat = (element, variant) => {
  if (variant === "orbit") {
    return 1;
  }

  const repeat = Number.parseInt(element.dataset.cvMediaRepeat || "", 10);

  if (Number.isFinite(repeat) && repeat > 0) {
    return repeat;
  }

  return 1;
};

const getTrack = (element) => {
  const existing = element.querySelector(".media-group__track");

  if (existing) {
    return existing;
  }

  const track = document.createElement("div");
  track.className = "media-group__track";
  element.appendChild(track);

  return track;
};

const setState = (element, state) => {
  element.dataset.cvMediaState = state;
  element.dataset.cvMediaReady = state === "ready" ? "true" : "false";
  element.toggleAttribute("data-media-empty", state === "empty");
};

const createImage = (item, index) => {
  const image = document.createElement("img");

  image.alt = item.title || item.stem || `media ${index + 1}`;
  image.decoding = "async";
  image.loading = index < PRELOAD_COUNT ? "eager" : "lazy";

  if (index < PRELOAD_COUNT) {
    image.fetchPriority = "high";
  }

  image.src = item.imageUrl;

  return image;
};

const createVideo = (item, isLightbox = false) => {
  const video = document.createElement("video");

  video.src = item.mediaUrl || item.imageUrl;
  video.loop = true;
  video.playsInline = true;
  video.preload = isLightbox ? "auto" : "metadata";

  if (isLightbox) {
    video.controls = true;
    video.autoplay = true;
  } else {
    video.muted = true;
    video.autoplay = true;
  }

  return video;
};

const setLightboxData = (element, item, extension) => {
  const source = item.mediaUrl || item.imageUrl;

  if (!source) {
    return;
  }

  element.dataset.lightbox = "";
  element.dataset.lightboxSrc = source;
  element.dataset.lightboxType = VIDEO_EXTENSIONS.has(extension) ? "video" : "image";
};

const createCard = ({ item, index, count }) => {
  const card = document.createElement("figure");
  const extension = getExtension(item.filename);

  card.className = "media-card";
  card.tabIndex = 0;
  card.role = "button";
  card.ariaLabel = item.title || item.stem || `media ${index + 1}`;
  card.style.setProperty("--media-index", String(index));
  card.style.setProperty("--media-count", String(count));

  if (VIDEO_EXTENSIONS.has(extension)) {
    card.dataset.cvMediaType = "video";
    card.appendChild(createVideo(item));
  } else if (IMAGE_EXTENSIONS.has(extension)) {
    card.dataset.cvMediaType = "image";
    card.appendChild(createImage(item, index));
  }

  setLightboxData(card, item, extension);

  return card;
};

const renderMediaScene = (element) => {
  if (element.dataset.cvMediaMounted === "true") {
    return;
  }

  setState(element, "loading");

  const sceneId = element.dataset.mediaScene;
  const scene = getAnimationScene(sceneId);
  const variant = getVariant(element);

  if (!scene) {
    setState(element, "empty");
    return;
  }

  const items = createAnimationItems(scene.modules).slice(0, getLimit(element, scene, variant));
  const repeat = getRepeat(element, variant);
  const renderedItems = Array.from({ length: repeat }, () => items).flat();
  const count = Math.max(1, renderedItems.length);
  const track = getTrack(element);

  track.textContent = "";
  element.style.setProperty("--media-count", String(count));
  track.style.setProperty("--media-count", String(count));

  if (!renderedItems.length) {
    element.dataset.cvMediaMounted = "true";
    setState(element, "empty");
    return;
  }

  renderedItems.forEach((item, index) => {
    track.appendChild(createCard({ item, index, count }));
  });

  element.dataset.cvMediaMounted = "true";
  setState(element, "ready");
};

const getExtensionFromUrl = (url = "") => {
  const cleanUrl = String(url).split("?")[0].split("#")[0];
  const extension = cleanUrl.split(".").pop();

  return extension ? extension.toLowerCase() : "";
};

const createManualItemFromCard = (card, index) => {
  const media = card.querySelector("img, video");

  if (!media) {
    return null;
  }

  const source = media.currentSrc || media.getAttribute("src");

  if (!source) {
    return null;
  }

  const title =
    media.getAttribute("alt") ||
    media.getAttribute("aria-label") ||
    card.getAttribute("aria-label") ||
    "media " + (index + 1);

  return {
    item: {
      imageUrl: source,
      mediaUrl: source,
      title,
      stem: title,
    },
    extension: getExtensionFromUrl(source),
  };
};

const mountExistingMediaCards = (root = document) => {
  const cards = root.querySelectorAll(".media-group:not([data-media-scene]) .media-card");

  cards.forEach((card, index) => {
    if (card.dataset.cvMediaLightboxMounted === "true") {
      return;
    }

    const mediaData = createManualItemFromCard(card, index);

    if (!mediaData) {
      return;
    }

    card.dataset.cvMediaLightboxMounted = "true";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "открыть изображение: " + mediaData.item.title);
    card.style.setProperty("--media-index", String(index));
    card.style.setProperty("--media-count", String(cards.length));
    setLightboxData(card, mediaData.item, mediaData.extension);
  });
};

export function initShowcaseMediaScenes(root = document) {
  root.querySelectorAll("[data-media-scene]").forEach(renderMediaScene);
  mountExistingMediaCards(root);
}
