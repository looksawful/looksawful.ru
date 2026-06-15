function syncGraphicSideLayout(layout) {
  const gallery = layout.querySelector(':scope > aside[aria-label="styx graphic design media gallery"]');
  const listGroups = layout.querySelector(":scope > .task-list-groups--side-media");
  const card = listGroups ? listGroups.querySelector(":scope > .task-list-group") : null;
  const content = card ? card.querySelector(":scope > .task-list-group__content") : null;

  if (!gallery || !listGroups || !card || !content) return;

  if (window.matchMedia("(max-width: 900px)").matches) {
    layout.classList.remove("is-graphic-side-height-synced");
    layout.style.removeProperty("--graphic-side-gallery-height");
    listGroups.style.removeProperty("minHeight");
    card.style.removeProperty("minHeight");
    content.style.removeProperty("minHeight");
    return;
  }

  const height = Math.ceil(gallery.getBoundingClientRect().height);

  if (!height) return;

  layout.classList.add("is-graphic-side-height-synced");
  layout.style.setProperty("--graphic-side-gallery-height", height + "px");

  listGroups.style.minHeight = height + "px";
  card.style.minHeight = height + "px";
  content.style.minHeight = height + "px";
}

function initGraphicSideLayouts() {
  const layouts = Array.from(
    document.querySelectorAll('.task-meta-layout')
  ).filter((layout) =>
    layout.querySelector(':scope > aside[aria-label="styx graphic design media gallery"]')
  );

  layouts.forEach((layout) => {
    const gallery = layout.querySelector(':scope > aside[aria-label="styx graphic design media gallery"]');

    const run = () => syncGraphicSideLayout(layout);

    run();
    requestAnimationFrame(run);
    setTimeout(run, 120);
    setTimeout(run, 500);
    setTimeout(run, 1200);

    window.addEventListener("resize", run, { passive: true });

    if ("ResizeObserver" in window && gallery) {
      const observer = new ResizeObserver(run);
      observer.observe(gallery);
      observer.observe(layout);
    }

    if (gallery) {
      gallery.querySelectorAll("img, video").forEach((media) => {
        media.addEventListener("load", run);
        media.addEventListener("loadedmetadata", run);
      });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGraphicSideLayouts, { once: true });
} else {
  initGraphicSideLayouts();
}
