const APPROVED_SECTION_IDS = new Set([
  "hero",
  "jestei-cover",
  "jestei-results",
  "jestei-interface-bento",
  "jestei-color",
  "jestei-words",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-promo",
  "jestei-landings",
  "jestei-tariffs",
  "styx-cover",
  "styx-work-slider",
  "pet-projects",
  "resume",
]);

function removeHeroOnlyConstraints(root = document) {
  root
    .querySelectorAll("[data-hero-only-mode], #hero-only-inline-mode")
    .forEach((node) => node.remove());

  const header = root.querySelector("body > .site-header");
  if (header) {
    header.style.setProperty("display", "block", "important");
    header.style.setProperty("visibility", "visible", "important");
    header.style.setProperty("opacity", "1", "important");
  }

  root.querySelectorAll("#main > .section").forEach((section) => {
    const isApproved = APPROVED_SECTION_IDS.has(section.id);
    section.hidden = false;
    section.style.setProperty("display", isApproved ? "block" : "none", "important");
    section.style.setProperty("visibility", isApproved ? "visible" : "hidden", "important");
    section.style.setProperty("opacity", isApproved ? "1" : "0", "important");
  });

  root
    .querySelectorAll('.site-header a[href="#shootings"], .site-header a[href="#jestei-logo"], .site-header a[href="#styx-graphics"]')
    .forEach((link) => link.style.setProperty("display", "none", "important"));
}

function placeTariffsAfterColor(root = document) {
  const colorSection = root.querySelector("#jestei-color");
  const tariffsSection = root.querySelector("#jestei-tariffs");

  if (!colorSection || !tariffsSection || colorSection.nextElementSibling === tariffsSection) {
    return;
  }

  colorSection.insertAdjacentElement("afterend", tariffsSection);
}

function mountLivePetProjectPreviews(root = document) {
  root.querySelectorAll("#pet-projects .pet-projects-bento__card").forEach((card) => {
    const media = card.querySelector(".pet-projects-bento__media");
    if (!media || media.querySelector("iframe")) {
      return;
    }

    const projectLink = card.querySelector(".pet-projects-bento__body a[href]");
    const source = projectLink?.getAttribute("href");
    if (!source) {
      return;
    }

    const title = projectLink.textContent.trim() || "пет-проект";
    const preview = document.createElement("div");
    preview.className = media.className;

    const frame = document.createElement("iframe");
    frame.className = "pet-projects-bento__frame";
    frame.loading = "lazy";
    frame.src = source;
    frame.title = `${title} — страница проекта`;

    preview.append(frame);
    media.replaceWith(preview);
  });
}

function setupStyxSliderLayout(root = document) {
  const slider = root.querySelector("#styx-work-slider");
  const track = slider?.querySelector("[data-horizontal-slider-track]");

  if (!slider || !track) {
    return;
  }

  track.querySelectorAll('img[loading="lazy"]').forEach((image) => {
    image.removeAttribute("loading");
  });

  const slides = Array.from(track.querySelectorAll(".styx-work-slider__slide"));
  if (!slides.length) {
    return;
  }

  if (slider.dataset.styxSliderLayoutReady === "true") {
    slider.styxSliderSyncHeight?.();
    return;
  }

  const getActiveSlide = () => {
    const trackCenter = track.scrollLeft + track.clientWidth / 2;

    return slides.reduce((closest, slide) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const closestCenter = closest.offsetLeft + closest.offsetWidth / 2;
      return Math.abs(slideCenter - trackCenter) < Math.abs(closestCenter - trackCenter) ? slide : closest;
    }, slides[0]);
  };

  const syncHeight = () => {
    const activeSlide = getActiveSlide();
    const activeHeight = Math.ceil(activeSlide.getBoundingClientRect().height);

    if (activeHeight > 0) {
      track.style.setProperty("--styx-slider-active-height", `${activeHeight}px`);
    }
  };

  let frameId = 0;
  const scheduleSyncHeight = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(syncHeight);
  };

  slider.dataset.styxSliderLayoutReady = "true";
  slider.styxSliderSyncHeight = scheduleSyncHeight;

  track.addEventListener("scroll", scheduleSyncHeight, { passive: true });
  window.addEventListener("resize", scheduleSyncHeight, { passive: true });

  track.querySelectorAll("img, video").forEach((media) => {
    const eventName = media.tagName === "IMG" ? "load" : "loadedmetadata";
    media.addEventListener(eventName, scheduleSyncHeight, { once: true });
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(scheduleSyncHeight);
    slides.forEach((slide) => resizeObserver.observe(slide));
    slider.styxSliderResizeObserver = resizeObserver;
  }

  scheduleSyncHeight();
}

async function start() {
  removeHeroOnlyConstraints(document);

  try {
    const { prepareHomepagePublication } = await import("./homepage-publication.js");
    prepareHomepagePublication(document);
    mountLivePetProjectPreviews(document);
    setupStyxSliderLayout(document);
  } finally {
    placeTariffsAfterColor(document);
    removeHeroOnlyConstraints(document);
  }

  const { initRuntime } = await import("./runtime/init-runtime.js");
  await initRuntime(document);
  setupStyxSliderLayout(document);
  removeHeroOnlyConstraints(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void start();
  }, { once: true });
} else {
  void start();
}
