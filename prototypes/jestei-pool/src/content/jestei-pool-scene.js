/*
 * Jestei Pool scene-local runtime.
 *
 * It only owns behavior that does not already exist as a site component:
 * 1) the three-video Moves Awful ended-driven sequence;
 * 2) static-image lightbox for the brand-system tiles.
 *
 * No observer is created here. Accordion activity and motion state come from
 * the site's existing cv-accordion runtime / motion-preference service.
 */

const noop = () => {};

function createMovesSequence({ scene, motion, accordionRuntime }) {
  const slider = scene.querySelector("[data-jestei-moves-slider]");
  if (!(slider instanceof HTMLElement)) return noop;

  const slides = [
    ...slider.querySelectorAll(":scope > [data-jestei-moves-slide]"),
  ];
  const videos = slides.map((slide) => slide.querySelector("video"));

  if (!slides.length || videos.some((video) => !(video instanceof HTMLVideoElement))) {
    return noop;
  }

  const figure = slider.closest("figure");
  const captionIndex = figure?.querySelector(
    ":scope > figcaption[data-media-caption] .media-caption__index",
  );
  const captionNumbers = String(
    figure?.getAttribute("data-sequential-caption-numbers") ?? "",
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  let activeIndex = 0;
  let sceneActive = accordionRuntime ? false : true;
  let documentVisible = document.visibilityState !== "hidden";
  let motionAllowed =
    typeof motion?.allowsMotion === "function" ? motion.allowsMotion() : true;

  const canPlay = () => sceneActive && documentVisible && motionAllowed;

  const updateCaption = () => {
    if (!(captionIndex instanceof HTMLElement)) return;
    const value = captionNumbers[activeIndex];
    if (value) captionIndex.textContent = value;
  };

  const syncPlayback = () => {
    videos.forEach((video, index) => {
      if (!(video instanceof HTMLVideoElement)) return;

      if (index !== activeIndex || !canPlay()) {
        video.pause();
        return;
      }

      video.play().catch(() => {});
    });
  };

  const activate = (nextIndex, { restart = true } = {}) => {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.toggleAttribute("data-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    videos.forEach((video, index) => {
      if (!(video instanceof HTMLVideoElement)) return;
      if (index !== activeIndex) {
        video.pause();
        if (restart) video.currentTime = 0;
      }
    });

    updateCaption();
    syncPlayback();
  };

  const cleanups = [];

  videos.forEach((video, index) => {
    const onEnded = () => {
      if (index !== activeIndex) return;
      activate(activeIndex + 1);
    };

    video.addEventListener("ended", onEnded);
    cleanups.push(() => video.removeEventListener("ended", onEnded));
  });

  const onVisibilityChange = () => {
    documentVisible = document.visibilityState !== "hidden";
    syncPlayback();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  cleanups.push(() =>
    document.removeEventListener("visibilitychange", onVisibilityChange),
  );

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(
          ({ allowed } = {}) => {
            motionAllowed = allowed === true;
            syncPlayback();
          },
          { immediate: false },
        )
      : noop;

  cleanups.push(unsubscribeMotion);

  if (accordionRuntime?.subscribeScene) {
    const unsubscribeScene = accordionRuntime.subscribeScene(scene, (state) => {
      sceneActive = state.active && state.documentVisible;
      syncPlayback();
    });
    cleanups.push(unsubscribeScene);
  }

  activate(0, { restart: false });

  return () => {
    while (cleanups.length) cleanups.pop()?.();
    videos.forEach((video) => video?.pause?.());
  };
}

function createStaticLightbox(scene) {
  let shell = null;
  let lastFocused = null;

  const close = () => {
    if (!shell) return;
    shell.remove();
    shell = null;
    document.removeEventListener("keydown", onDocumentKeydown);
    lastFocused?.focus?.();
    lastFocused = null;
  };

  const onDocumentKeydown = (event) => {
    if (event.key === "Escape") close();
  };

  const open = (trigger) => {
    const image = trigger.querySelector(":scope > img");
    if (!(image instanceof HTMLImageElement) || !image.currentSrc && !image.src) {
      return;
    }

    close();
    lastFocused = document.activeElement;

    const figure = trigger.closest("figure");
    const title =
      figure?.querySelector(".media-caption__title")?.textContent?.trim() ?? "";

    shell = document.createElement("div");
    shell.className = "animated-canvas-gallery-lightbox";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    shell.setAttribute(
      "aria-label",
      title ? `Просмотр: ${title}` : "Просмотр изображения",
    );

    shell.innerHTML = `
      <button
        class="animated-canvas-gallery-lightbox__close"
        type="button"
        aria-label="Закрыть изображение"
      >×</button>
      <figure class="animated-canvas-gallery-lightbox__figure">
        <img class="animated-canvas-gallery-lightbox__image" alt="">
        <figcaption
          class="animated-canvas-gallery-lightbox__caption"
        ></figcaption>
      </figure>
    `;

    const lightboxImage = shell.querySelector(
      ".animated-canvas-gallery-lightbox__image",
    );
    const caption = shell.querySelector(
      ".animated-canvas-gallery-lightbox__caption",
    );

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || title;
    caption.textContent = title;
    caption.hidden = !title;

    shell.addEventListener("pointerdown", (event) => {
      if (
        event.target === shell ||
        event.target.closest(".animated-canvas-gallery-lightbox__close")
      ) {
        close();
      }
    });

    document.body.append(shell);
    shell
      .querySelector(".animated-canvas-gallery-lightbox__close")
      ?.focus();

    document.addEventListener("keydown", onDocumentKeydown);
  };

  const onClick = (event) => {
    const trigger = event.target.closest("[data-jestei-lightbox]");
    if (!(trigger instanceof HTMLElement) || !scene.contains(trigger)) return;
    open(trigger);
  };

  const onKeydown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const trigger = event.target.closest("[data-jestei-lightbox]");
    if (!(trigger instanceof HTMLElement) || !scene.contains(trigger)) return;

    event.preventDefault();
    open(trigger);
  };

  scene.addEventListener("click", onClick);
  scene.addEventListener("keydown", onKeydown);

  return () => {
    scene.removeEventListener("click", onClick);
    scene.removeEventListener("keydown", onKeydown);
    close();
  };
}

export function createJesteiPoolScene({
  root = document,
  motion = null,
  accordionRuntime = null,
} = {}) {
  const caseRoot = root.querySelector("[data-jestei-case]");
  const scene = caseRoot?.closest(".cv-item");
  if (!(scene instanceof HTMLElement)) return noop;

  const cleanups = [
    createMovesSequence({ scene, motion, accordionRuntime }),
    createStaticLightbox(scene),
  ];

  return () => {
    while (cleanups.length) cleanups.pop()?.();
  };
}
