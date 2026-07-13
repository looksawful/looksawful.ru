import { ANIMATION_SCENES, createAnimationItems } from "../canvas/showcase-animation-assets.js";

const IMAGE_EXTENSIONS = new Set(["webp", "png", "jpg", "jpeg", "avif", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
const DEFAULT_LIMIT = 24;
const SCENE_SELECTOR = "[data-archive-media-scene]";

const getExtension = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";

const getLimit = (element, scene) => {
  const limit = Number.parseInt(element.dataset.archiveMediaLimit || "", 10);
  return Number.isFinite(limit) && limit > 0 ? limit : scene?.defaultMaxItems || DEFAULT_LIMIT;
};

const getTrack = (element) => {
  const existing = element.querySelector("[data-archive-media-track], .archive-media-group__track");

  if (existing) {
    return existing;
  }

  const track = document.createElement("div");
  track.className = "archive-media-group__track";
  track.setAttribute("data-archive-media-track", "");
  element.appendChild(track);

  return track;
};

const createImage = (item, index) => {
  const image = document.createElement("img");

  image.alt = item.title || item.stem || `archive media ${index + 1}`;
  image.decoding = "async";
  image.loading = "lazy";
  image.src = item.imageUrl;

  return image;
};

const createVideo = (item) => {
  const video = document.createElement("video");

  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = item.mediaUrl || item.imageUrl;

  return video;
};

const createCard = ({ item, index, count }) => {
  const card = document.createElement("figure");
  const extension = getExtension(item.filename);

  card.className = "archive-media-card";
  card.style.setProperty("--media-index", String(index));
  card.style.setProperty("--media-count", String(count));

  if (VIDEO_EXTENSIONS.has(extension)) {
    card.appendChild(createVideo(item));
  } else if (IMAGE_EXTENSIONS.has(extension)) {
    card.appendChild(createImage(item, index));
  }

  return card;
};

const renderArchiveMediaScene = (element) => {
  if (element.dataset.archiveMediaMounted === "true") {
    return;
  }

  const sceneId = element.dataset.archiveMediaScene;
  const scene = ANIMATION_SCENES[sceneId];

  if (!scene) {
    element.dataset.archiveMediaReady = "false";
    element.toggleAttribute("data-archive-media-empty", true);
    return;
  }

  const items = createAnimationItems(scene.modules || {}).slice(0, getLimit(element, scene));
  const track = getTrack(element);

  track.textContent = "";
  element.style.setProperty("--media-count", String(items.length || 1));

  items.forEach((item, index) => {
    track.appendChild(createCard({ item, index, count: items.length }));
  });

  element.dataset.archiveMediaMounted = "true";
  element.dataset.archiveMediaReady = items.length ? "true" : "false";
  element.toggleAttribute("data-archive-media-empty", items.length === 0);
};

export function initArchiveMediaScenes(root = document) {
  root.querySelectorAll(SCENE_SELECTOR).forEach(renderArchiveMediaScene);
}
