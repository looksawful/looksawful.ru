const mountedRoots = new WeakSet();

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
    link.style.setProperty("--media-actual-ratio", ratio.toFixed(4));
  };

  if (img.complete) apply();
  else img.addEventListener("load", apply, { once: true });
}

function prepareMedia(item, index) {
  const media = item.querySelector("img, video");
  if (!media) return;

  if (media instanceof HTMLImageElement) {
    media.decoding = "async";
    media.loading = index < 2 ? "eager" : media.loading || "lazy";

    if ("fetchPriority" in media && index < 2) {
      media.fetchPriority = "low";
    }
  }

  if (media instanceof HTMLVideoElement) {
    media.preload = media.getAttribute("preload") || "metadata";
  }
}

function stripRuntimeGalleryUi(group) {
  group.dataset.galleryEnhanced = "simple";
  group.dataset.galleryMode = "grid";
  group.dataset.galleryView = "grid";
  delete group.dataset.galleryAutoplay;

  group.classList.remove(
    "media-group--scrollable",
    "media-group--snap",
    "media-group--tile-rail",
    "media-group--gallery-grid",
    "media-group--viewer-ready",
    "is-viewer",
    "has-scroll-overflow",
  );

  group.querySelectorAll(":scope > .media-group__controls, :scope > .media-group__dots").forEach((node) => node.remove());
}

export function initPortfolioGallery(root = document) {
  if (mountedRoots.has(root)) return null;
  mountedRoots.add(root);

  const items = Array.from(root.querySelectorAll("#showcase [data-lightbox-item], #showcase [data-lightbox-video]"));

  for (const [index, item] of items.entries()) {
    const caption = readableCaption(item);
    if (caption && !item.getAttribute("data-caption")) item.setAttribute("data-caption", caption);
    markOrientation(item);
    prepareMedia(item, index);
  }

  const groups = Array.from(root.querySelectorAll("#showcase .case-chapter__body .media-group"));
  for (const group of groups) {
    stripRuntimeGalleryUi(group);
  }

  return { items: items.length, groups: groups.length };
}
