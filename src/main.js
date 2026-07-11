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

const PET_PROJECT_PREVIEW_WIDTHS = [
  ["berserk-timer", 520],
  ["awful-cases", 760],
  ["awful-audit", 700],
];

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

function getPetProjectPreviewWidth(source) {
  const match = PET_PROJECT_PREVIEW_WIDTHS.find(([slug]) => source.includes(slug));
  return match?.[1] ?? 680;
}

function ensurePetProjectModal(root = document) {
  const existing = root.querySelector("#pet-project-modal");
  if (existing) {
    return existing;
  }

  const dialog = document.createElement("dialog");
  dialog.id = "pet-project-modal";
  dialog.className = "pet-project-modal";
  dialog.setAttribute("aria-labelledby", "pet-project-modal-title");

  const shell = document.createElement("div");
  shell.className = "pet-project-modal__shell";

  const bar = document.createElement("div");
  bar.className = "pet-project-modal__bar";

  const title = document.createElement("p");
  title.id = "pet-project-modal-title";
  title.className = "pet-project-modal__title";

  const closeButton = document.createElement("button");
  closeButton.className = "pet-project-modal__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "закрыть");
  closeButton.textContent = "×";

  const body = document.createElement("div");
  body.className = "pet-project-modal__body";

  const frame = document.createElement("iframe");
  frame.className = "pet-project-modal__frame";
  frame.setAttribute("allow", "fullscreen; autoplay");

  bar.append(title, closeButton);
  body.append(frame);
  shell.append(bar, body);
  dialog.append(shell);
  document.body.append(dialog);

  const closeModal = () => {
    if (dialog.open && typeof dialog.close === "function") {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
    document.documentElement.classList.remove("pet-project-modal-open");
    frame.src = "about:blank";
    dialog.petProjectReturnFocus?.focus?.({ preventScroll: true });
  };

  closeButton.addEventListener("click", closeModal);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeModal();
    }
  });

  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("pet-project-modal-open");
    frame.src = "about:blank";

    const returnFocus = dialog.petProjectReturnFocus;
    dialog.petProjectReturnFocus = null;
    if (returnFocus?.isConnected) {
      requestAnimationFrame(() => returnFocus.focus({ preventScroll: true }));
    }
  });

  dialog.petProjectTitle = title;
  dialog.petProjectFrame = frame;
  dialog.petProjectClose = closeButton;

  return dialog;
}

function openPetProjectModal(source, title, opener, root = document) {
  const dialog = ensurePetProjectModal(root);
  dialog.petProjectReturnFocus = opener;
  dialog.petProjectTitle.textContent = title;
  dialog.petProjectFrame.title = `${title} — полноэкранная страница проекта`;
  dialog.petProjectFrame.src = source;
  document.documentElement.classList.add("pet-project-modal-open");

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) {
      dialog.showModal();
    }
  } else {
    dialog.setAttribute("open", "");
  }

  requestAnimationFrame(() => dialog.petProjectClose.focus({ preventScroll: true }));
}

function sizePetProjectPreview(media, frame, viewportWidth) {
  const sync = () => {
    const mediaWidth = media.clientWidth;
    const mediaHeight = media.clientHeight;
    if (!mediaWidth || !mediaHeight) {
      return;
    }

    const scale = mediaWidth / viewportWidth;
    frame.style.inlineSize = `${viewportWidth}px`;
    frame.style.blockSize = `${Math.ceil(mediaHeight / scale)}px`;
    frame.style.transform = `scale(${scale})`;
  };

  frame.addEventListener("load", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(media);
    media.petProjectResizeObserver = resizeObserver;
  }

  sync();
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
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("scrolling", "no");

    const openButton = document.createElement("button");
    openButton.className = "pet-projects-bento__open";
    openButton.type = "button";
    openButton.setAttribute("aria-label", `открыть ${title}`);
    openButton.addEventListener("click", () => {
      openPetProjectModal(source, title, openButton, root);
    });

    preview.append(frame, openButton);
    media.replaceWith(preview);
    sizePetProjectPreview(preview, frame, getPetProjectPreviewWidth(source));
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
