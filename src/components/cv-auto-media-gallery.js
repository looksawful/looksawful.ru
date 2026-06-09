const mediaModules = import.meta.glob(
  "../assets/*/galleries/**/*.{png,jpg,jpeg,webp,avif,gif,mp4,webm,m4v}",
  {
    eager: true,
    query: "?url",
    import: "default"
  }
);

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "m4v"]);
const byFolder = new Map();

for (const entry of Object.entries(mediaModules)) {
  const modulePath = entry[0].replace(/\\/g, "/");
  const url = entry[1];
  const parts = modulePath.split("/");
  const folder = parts[parts.length - 2];
  const fileName = parts[parts.length - 1];
  const extension = fileName.split(".").pop().toLowerCase();
  const type = VIDEO_EXTENSIONS.has(extension) ? "video" : "image";

  if (!byFolder.has(folder)) byFolder.set(folder, []);
  byFolder.get(folder).push({ url, fileName, extension, type });
}

for (const items of byFolder.values()) {
  items.sort(function (a, b) {
    return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: "base" });
  });
}

function getItemVariant(index, count) {
  if (count === 1) return "hero";
  if (count === 2) return "square";
  if (count === 3) return index === 0 ? "wide" : "square";
  if (count === 4) return "square";
  const pattern = ["wide", "square", "square", "square", "wide", "square", "square", "square"];
  return pattern[index % pattern.length];
}

function createMedia(item) {
  if (item.type === "video") {
    const video = document.createElement("video");
    video.className = "cv-auto-media-gallery__media";
    video.src = item.url;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "metadata";
    return video;
  }
  const image = document.createElement("img");
  image.className = "cv-auto-media-gallery__media";
  image.src = item.url;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function createItem(item, index, count) {
  const link = document.createElement("a");
  const variant = getItemVariant(index, count);
  link.className = "cv-auto-media-gallery__item cv-auto-media-gallery__item--" + variant;
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.appendChild(createMedia(item));
  if (item.type === "video") {
    const badge = document.createElement("span");
    badge.className = "cv-auto-media-gallery__badge";
    badge.textContent = item.extension.toUpperCase();
    link.appendChild(badge);
  }
  return link;
}

function mountGallery(node) {
  const folder = node.dataset.cvAutoGallery;
  const items = byFolder.get(folder) || [];
  node.innerHTML = "";
  node.dataset.count = String(items.length);
  if (!items.length) {
    node.classList.add("cv-auto-media-gallery--empty");
    return;
  }
  node.classList.remove("cv-auto-media-gallery--empty");
  items.forEach(function (item, index) {
    node.appendChild(createItem(item, index, items.length));
  });
}

function initAutoMediaGalleries() {
  document.querySelectorAll("[data-cv-auto-gallery]").forEach(mountGallery);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAutoMediaGalleries, { once: true });
} else {
  initAutoMediaGalleries();
}
