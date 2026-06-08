import { createAnimationItems, getAnimationScene } from "../canvas/cv-animation-assets.js";

const IMAGE_EXTENSIONS = new Set(["webp", "png", "jpg", "jpeg", "avif", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
const DEFAULT_LIMIT = 24;

const getExtension = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";

const getLimit = (element, scene) => {
  const limit = Number.parseInt(element.dataset.cvMediaLimit || "", 10);

  if (Number.isFinite(limit) && limit > 0) {
    return limit;
  }

  return scene?.defaultMaxItems || DEFAULT_LIMIT;
};

const getRepeat = (element) => {
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

const createImage = (item, index) => {
  const image = document.createElement("img");

  image.alt = item.title || item.stem || `media ${index + 1}`;
  image.decoding = "async";
  image.loading = "lazy";
  image.src = item.imageUrl;

  return image;
};

const createVideo = (item) => {
  const video = document.createElement("video");

  video.src = item.mediaUrl || item.imageUrl;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "metadata";

  return video;
};

const createCard = ({ item, index, count }) => {
  const card = document.createElement("figure");
  const extension = getExtension(item.filename);

  card.className = "cv-media-card";
  card.style.setProperty("--media-index", String(index));
  card.style.setProperty("--media-count", String(count));

  if (VIDEO_EXTENSIONS.has(extension)) {
    card.appendChild(createVideo(item));
  } else if (IMAGE_EXTENSIONS.has(extension)) {
    card.appendChild(createImage(item, index));
  }

  return card;
};

const renderMediaScene = (element) => {
  const sceneId = element.dataset.cvMediaScene;
  const scene = getAnimationScene(sceneId);

  if (!scene) {
    element.dataset.cvMediaReady = "false";
    element.dataset.cvMediaEmpty = "true";
    return;
  }

  const items = createAnimationItems(scene.modules).slice(0, getLimit(element, scene));
  const repeat = getRepeat(element);
  const renderedItems = Array.from({ length: repeat }, () => items).flat();
  const track = getTrack(element);

  track.textContent = "";
  element.style.setProperty("--media-count", String(renderedItems.length || 1));

  renderedItems.forEach((item, index) => {
    track.appendChild(createCard({ item, index, count: renderedItems.length }));
  });

  element.dataset.cvMediaMounted = "true";
  element.dataset.cvMediaReady = renderedItems.length ? "true" : "false";
  element.toggleAttribute("data-cv-media-empty", renderedItems.length === 0);
};

export function initCvMediaScenes(root = document) {
  root.querySelectorAll("[data-cv-media-scene]").forEach(renderMediaScene);
}
