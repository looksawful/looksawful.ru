const TARGET_TITLES = [
  "фирменные печатные материалы и упаковка"
];

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isTargetTitle(value) {
  const normalized = normalizeText(value);
  return TARGET_TITLES.some((title) => normalized === normalizeText(title));
}

function findMediaPeer(card) {
  const layout = card.closest(".task-meta-layout");

  if (layout) {
    const media = Array.from(
      layout.querySelectorAll(".task-side-gallery, .task-side-image, .task-group__visual")
    ).find((node) => !node.contains(card) && node !== card);

    if (media) return media;
  }

  let sibling = card.parentElement ? card.parentElement.nextElementSibling : null;

  while (sibling) {
    if (
      sibling.matches(".task-side-gallery, .task-side-image, .task-group__visual") ||
      sibling.querySelector(".task-side-gallery, .task-side-image, .task-group__visual")
    ) {
      return sibling.matches(".task-side-gallery, .task-side-image, .task-group__visual")
        ? sibling
        : sibling.querySelector(".task-side-gallery, .task-side-image, .task-group__visual");
    }

    sibling = sibling.nextElementSibling;
  }

  return null;
}

function syncCardHeight(card, media) {
  if (!card || !media) return;

  if (window.matchMedia("(max-width: 900px)").matches) {
    card.classList.remove("showcase-side-card-height-synced");
    card.style.removeProperty("--cv-synced-side-height");
    return;
  }

  const mediaRect = media.getBoundingClientRect();
  const height = Math.ceil(mediaRect.height);

  if (!height) return;

  card.classList.add("showcase-side-card-height-synced");
  card.style.setProperty("--cv-synced-side-height", height + "px");
}

function initSideCardHeightSync() {
  const titles = Array.from(document.querySelectorAll(".task-list-group h5"));

  titles.forEach((title) => {
    if (!isTargetTitle(title.textContent)) return;

    const card = title.closest(".task-list-group");
    const media = findMediaPeer(card);

    if (!card || !media) return;

    const run = () => syncCardHeight(card, media);

    run();
    window.addEventListener("resize", run);

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(run);
      observer.observe(media);
      observer.observe(card);
    }

    media.querySelectorAll("img, video").forEach((node) => {
      node.addEventListener("load", run, { once: false });
      node.addEventListener("loadedmetadata", run, { once: false });
    });

    requestAnimationFrame(run);
    setTimeout(run, 250);
    setTimeout(run, 800);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSideCardHeightSync, { once: true });
} else {
  initSideCardHeightSync();
}
