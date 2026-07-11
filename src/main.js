const STYX_SECTION_IDS = [
  "styx-packaging",
  "styx-communications",
  "styx-print",
  "styx-photo-art",
  "styx-scanography",
];

const APPROVED_SECTION_IDS = new Set([
  "hero",
  "jestei-cover",
  "jestei-results",
  "jestei-logo",
  "jestei-type",
  "jestei-arc",
  "jestei-interface-bento",
  "jestei-masonry",
  "jestei-color",
  "jestei-words",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-promo",
  "jestei-landings",
  "jestei-tariffs",
  "styx-cover",
  ...STYX_SECTION_IDS,
  "pet-projects",
  "resume",
]);

const PET_PROJECT_PREVIEW_WIDTHS = [
  ["berserk-timer", 480],
  ["awful-cases", 420],
  ["awful-audit", 420],
];

const JESTEI_MOTION_BREAKS = [
  {
    id: "jestei-arc",
    modifier: "arc",
    animation: "landing-arc",
    canvasId: "jestei-arc-canvas",
    anchorId: "jestei-type",
    position: "afterend",
  },
  {
    id: "jestei-masonry",
    modifier: "masonry",
    animation: "landing-masonry",
    canvasId: "jestei-masonry-canvas",
    anchorId: "jestei-interface-bento",
    position: "beforebegin",
  },
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
    .querySelectorAll('.site-header a[href="#shootings"], .site-header a[href="#styx-graphics"]')
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

function createJesteiMotionBreak({ id, modifier, animation, canvasId }, root = document) {
  const section = root.createElement("section");
  section.className = `section jestei-motion-break jestei-motion-break--${modifier}`;
  section.id = id;
  section.setAttribute("data-section-family", "jestei");
  section.setAttribute("aria-hidden", "true");
  section.innerHTML = `
    <div class="jestei-motion-break__surface" data-animation="${animation}">
      <canvas class="visual-canvas jestei-motion-break__canvas" id="${canvasId}"></canvas>
    </div>
  `;
  return section;
}

function placeJesteiMotionBreaks(root = document) {
  root.querySelector("#jestei-results > .jestei-masonry")?.remove();

  JESTEI_MOTION_BREAKS.forEach((config) => {
    const anchor = root.querySelector(`#${config.anchorId}`);
    if (!anchor) {
      return;
    }

    const section = root.querySelector(`#${config.id}`) || createJesteiMotionBreak(config, root);
    const isAlreadyPlaced =
      config.position === "afterend"
        ? anchor.nextElementSibling === section
        : anchor.previousElementSibling === section;

    if (!isAlreadyPlaced) {
      anchor.insertAdjacentElement(config.position, section);
    }
  });
}

function getPetProjectPreviewWidth(source) {
  const match = PET_PROJECT_PREVIEW_WIDTHS.find(([slug]) => source.includes(slug));
  return match?.[1] ?? 420;
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

function activateStyxVideos(section) {
  section.querySelectorAll("video").forEach((video) => {
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const startPlayback = () => {
      const playback = video.play();
      playback?.catch?.(() => {});
    };

    if (video.readyState >= 2) {
      startPlayback();
    } else {
      video.addEventListener("loadeddata", startPlayback, { once: true });
      video.load();
    }
  });
}

function restoreStyxSections(root = document) {
  const slider = root.querySelector("#styx-work-slider");
  const sections = STYX_SECTION_IDS.map(
    (id) => slider?.querySelector(`#${id}`) || root.querySelector(`#${id}`),
  ).filter(Boolean);

  if (slider) {
    sections.forEach((section) => {
      slider.insertAdjacentElement("beforebegin", section);
    });
    slider.remove();
  }

  sections.forEach((section) => {
    section.hidden = false;
    section.removeAttribute("data-styx-slider-source");
    section.style.removeProperty("display");
    section.style.removeProperty("visibility");
    section.style.removeProperty("opacity");
    section.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.removeAttribute("loading");
    });
    activateStyxVideos(section);
  });
}

async function start() {
  removeHeroOnlyConstraints(document);

  try {
    const { prepareHomepagePublication } = await import("./homepage-publication.js");
    prepareHomepagePublication(document);
    restoreStyxSections(document);
    mountLivePetProjectPreviews(document);
  } finally {
    placeTariffsAfterColor(document);
    placeJesteiMotionBreaks(document);
    removeHeroOnlyConstraints(document);
  }

  const { initRuntime } = await import("./runtime/init-runtime.js");
  await initRuntime(document);
  restoreStyxSections(document);
  placeJesteiMotionBreaks(document);
  removeHeroOnlyConstraints(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void start();
  }, { once: true });
} else {
  void start();
}
