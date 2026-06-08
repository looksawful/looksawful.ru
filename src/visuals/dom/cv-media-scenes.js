import { createAnimationItems, getAnimationScene } from "../canvas/cv-animation-assets.js";

const IMAGE_EXTENSIONS = new Set(["webp", "png", "jpg", "jpeg", "avif", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

const DEFAULT_LIMIT = 24;
const ORBIT_DESKTOP_LIMIT = 24;
const ORBIT_MOBILE_LIMIT = 14;
const PRELOAD_COUNT = 4;

let activeLightbox = null;

const getExtension = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";

const getVariant = (element) => {
  if (element.classList.contains("cv-media-group--orbit")) return "orbit";
  if (element.classList.contains("cv-media-group--strip")) return "strip";
  if (element.classList.contains("cv-media-group--grid")) return "grid";

  return "default";
};

const getLimit = (element, scene, variant) => {
  const attrLimit = Number.parseInt(element.dataset.cvMediaLimit || "", 10);
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
  const existing = element.querySelector(".cv-media-group__track");

  if (existing) {
    return existing;
  }

  const track = document.createElement("div");
  track.className = "cv-media-group__track";
  element.appendChild(track);

  return track;
};

const setState = (element, state) => {
  element.dataset.cvMediaState = state;
  element.dataset.cvMediaReady = state === "ready" ? "true" : "false";
  element.toggleAttribute("data-cv-media-empty", state === "empty");
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

const createLightbox = () => {
  const lightbox = document.createElement("div");

  lightbox.className = "cv-media-lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button class="cv-media-lightbox__close" type="button" aria-label="закрыть">×</button>
    <div class="cv-media-lightbox__stage" role="dialog" aria-modal="true"></div>
  `;

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".cv-media-lightbox__close")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeLightbox && !activeLightbox.hidden) {
      closeLightbox();
    }
  });

  document.body.appendChild(lightbox);

  return lightbox;
};

const getLightbox = () => {
  activeLightbox ||= createLightbox();
  return activeLightbox;
};

const openLightbox = (item, extension) => {
  const lightbox = getLightbox();
  const stage = lightbox.querySelector(".cv-media-lightbox__stage");

  stage.textContent = "";

  if (VIDEO_EXTENSIONS.has(extension)) {
    stage.appendChild(createVideo(item, true));
  } else {
    const image = document.createElement("img");

    image.alt = item.title || item.stem || "";
    image.decoding = "async";
    image.src = item.imageUrl;

    stage.appendChild(image);
  }

  lightbox.hidden = false;
  document.documentElement.classList.add("has-cv-media-lightbox");
};

function closeLightbox() {
  if (!activeLightbox) {
    return;
  }

  activeLightbox.querySelector(".cv-media-lightbox__stage").textContent = "";
  activeLightbox.hidden = true;
  document.documentElement.classList.remove("has-cv-media-lightbox");
}

const createCard = ({ item, index, count }) => {
  const card = document.createElement("figure");
  const extension = getExtension(item.filename);

  card.className = "cv-media-card";
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

  card.addEventListener("click", () => {
    openLightbox(item, extension);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openLightbox(item, extension);
  });

  return card;
};

const renderMediaScene = (element) => {
  if (element.dataset.cvMediaMounted === "true") {
    return;
  }

  setState(element, "loading");

  const sceneId = element.dataset.cvMediaScene;
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

export function initCvMediaScenes(root = document) {
  root.querySelectorAll("[data-cv-media-scene]").forEach(renderMediaScene);
}
