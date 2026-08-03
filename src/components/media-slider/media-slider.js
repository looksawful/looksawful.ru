const MEDIA_SLIDER_INSTANCE = Symbol.for("looksawful.mediaSlider.instance");

const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const VALID_MODES = new Set(["adaptive", "hover", "click", "auto", "off"]);
const DEFAULT_MODE = "adaptive";
const DEFAULT_INTERVAL = 5200;
const MIN_INTERVAL = 600;

const noop = () => {};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeMediaSliderMode(value, fallback = DEFAULT_MODE) {
  return VALID_MODES.has(value) ? value : fallback;
}

export function resolveMediaSliderEnabled({ mode, count } = {}) {
  return normalizeMediaSliderMode(mode) !== "off" && Number(count) > 1;
}

export function resolveMediaSliderProgressVisible({ enabled } = {}) {
  return enabled === true;
}

export function resolveMediaSliderProgressRunning({
  autoplay,
  motionAllowed,
  paused,
  documentVisible,
} = {}) {
  return (
    autoplay === true &&
    motionAllowed === true &&
    paused !== true &&
    documentVisible === true
  );
}

export function resolveMediaSliderInteraction({ mode, precisePointer } = {}) {
  const safeMode = normalizeMediaSliderMode(mode);

  if (safeMode === "adaptive") {
    return precisePointer ? "hover" : "click";
  }

  if (safeMode === "hover" || safeMode === "click") {
    return safeMode;
  }

  return "none";
}

export function getHoverSlideIndex({ pointerX, width, count } = {}) {
  const safeCount = Math.max(1, Math.trunc(toFiniteNumber(count, 1)));
  const safeWidth = Math.max(1, toFiniteNumber(width, 1));
  const safePointerX = clamp(toFiniteNumber(pointerX, 0), 0, safeWidth - 0.0001);

  return clamp(
    Math.floor((safePointerX / safeWidth) * safeCount),
    0,
    safeCount - 1,
  );
}

export function getNextSlideIndex(index, count) {
  const safeCount = Math.max(1, Math.trunc(toFiniteNumber(count, 1)));
  const safeIndex = clamp(Math.trunc(toFiniteNumber(index, 0)), 0, safeCount - 1);

  return safeCount === 1 ? 0 : (safeIndex + 1) % safeCount;
}

function getDirectSlides(root) {
  return Array.from(root.children).filter(
    (child) => child instanceof HTMLImageElement,
  );
}

function createProgress(root, enabled) {
  if (!resolveMediaSliderProgressVisible({ enabled })) {
    return null;
  }

  const progress = document.createElement("span");
  progress.setAttribute("data-media-slider-progress", "");
  progress.setAttribute("data-media-slider-generated", "");
  progress.setAttribute("aria-hidden", "true");
  root.append(progress);

  return progress;
}

function readInterval(root) {
  return Math.max(
    MIN_INTERVAL,
    toFiniteNumber(root.dataset.mediaSliderInterval, DEFAULT_INTERVAL),
  );
}

function readMotionAllowed(motion) {
  return typeof motion?.allowsMotion === "function"
    ? motion.allowsMotion()
    : !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function createMediaSlider({ root, motion } = {}) {
  if (!(root instanceof HTMLElement)) {
    return null;
  }

  root[MEDIA_SLIDER_INSTANCE]?.destroy();

  const slides = getDirectSlides(root);
  const mode = normalizeMediaSliderMode(root.dataset.mediaSliderMode);
  const enabled = resolveMediaSliderEnabled({ mode, count: slides.length });
  const autoplay = enabled && (
    mode === "auto" || root.hasAttribute("data-media-slider-autoplay")
  );
  const interval = readInterval(root);
  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY);
  const cleanup = [];
  const progress = createProgress(root, enabled);

  const originalAttributes = {
    role: root.getAttribute("role"),
    tabindex: root.getAttribute("tabindex"),
    ariaLabel: root.getAttribute("aria-label"),
  };

  let destroyed = false;
  let activeIndex = -1;
  let autoTimer = 0;
  let autoPaused = false;
  let motionAllowed = readMotionAllowed(motion);
  let interaction = "none";

  function setActiveIndex(index, { emit = true } = {}) {
    const nextIndex = clamp(Math.trunc(index), 0, Math.max(0, slides.length - 1));

    if (nextIndex === activeIndex && root.hasAttribute("data-media-slider-ready")) {
      return;
    }

    activeIndex = nextIndex;
    root.dataset.mediaSliderIndex = String(activeIndex);

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;

      slide.toggleAttribute("data-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    if (emit) {
      root.dispatchEvent(
        new CustomEvent("media-slider:change", {
          bubbles: true,
          detail: {
            index: activeIndex,
            slide: slides[activeIndex] ?? null,
          },
        }),
      );
    }
  }

  function resetProgress() {
    if (!(progress instanceof HTMLElement)) {
      return;
    }

    root.style.setProperty(
      "--media-slider-progress-duration",
      `${interval}ms`,
    );

    root.removeAttribute("data-media-slider-progress-running");

    if (
      !resolveMediaSliderProgressRunning({
        autoplay,
        motionAllowed,
        paused: autoPaused,
        documentVisible: document.visibilityState !== "hidden",
      })
    ) {
      return;
    }

    void progress.offsetWidth;
    root.setAttribute("data-media-slider-progress-running", "");
  }

  function stopProgress() {
    root.removeAttribute("data-media-slider-progress-running");
  }

  function stopAuto() {
    if (!autoTimer) {
      return;
    }

    window.clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function canRunAuto() {
    return (
      autoplay &&
      motionAllowed &&
      !autoPaused &&
      document.visibilityState !== "hidden"
    );
  }

  function scheduleAuto() {
    stopAuto();
    resetProgress();

    if (!canRunAuto()) {
      return;
    }

    autoTimer = window.setTimeout(() => {
      autoTimer = 0;
      setActiveIndex(getNextSlideIndex(activeIndex, slides.length));
      scheduleAuto();
    }, interval);
  }

  function restartAuto() {
    if (autoplay) {
      scheduleAuto();
    }
  }

  function setAutoPaused(paused) {
    if (autoPaused === paused) {
      return;
    }

    autoPaused = paused;
    scheduleAuto();
  }

  function updateInteraction() {
    interaction = enabled
      ? resolveMediaSliderInteraction({
          mode,
          precisePointer: precisePointer.matches,
        })
      : "none";

    root.dataset.mediaSliderInteraction = interaction;

    if (interaction === "hover") {
      root.setAttribute("role", "button");
      root.tabIndex = 0;
    } else if (interaction === "click") {
      root.setAttribute("role", "button");
      root.tabIndex = 0;
    } else {
      if (originalAttributes.role === null) {
        root.removeAttribute("role");
      } else {
        root.setAttribute("role", originalAttributes.role);
      }

      if (originalAttributes.tabindex === null) {
        root.removeAttribute("tabindex");
      } else {
        root.setAttribute("tabindex", originalAttributes.tabindex);
      }
    }

    if (enabled && interaction !== "none" && !root.hasAttribute("aria-label")) {
      root.setAttribute("aria-label", "Переключить фотографию");
    }

    setAutoPaused(false);
  }

  function handlePointerMove(event) {
    if (interaction !== "hover") {
      return;
    }

    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }

    const rect = root.getBoundingClientRect();

    setActiveIndex(
      getHoverSlideIndex({
        pointerX: event.clientX - rect.left,
        width: rect.width,
        count: slides.length,
      }),
    );
  }

  function handlePointerEnter() {
    if (interaction === "hover") {
      setAutoPaused(true);
    }
  }

  function handlePointerLeave() {
    if (interaction === "hover") {
      setAutoPaused(false);
    }
  }

  function handleClick() {
    if (interaction !== "click") {
      return;
    }

    setActiveIndex(getNextSlideIndex(activeIndex, slides.length));
    restartAuto();
  }

  function handleKeydown(event) {
    if (interaction === "none" || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    setActiveIndex(getNextSlideIndex(activeIndex, slides.length));
    restartAuto();
  }

  function handleVisibilityChange() {
    scheduleAuto();
  }

  function handlePointerQueryChange() {
    updateInteraction();
  }

  slides.forEach((slide) => {
    slide.setAttribute("data-media-slide", "");
  });

  root.dataset.mediaSliderMode = mode;
  root.dataset.mediaSliderState = enabled ? "enabled" : "disabled";
  root.toggleAttribute("data-media-slider-autoplaying", autoplay);
  root.toggleAttribute("data-media-slider-has-progress", progress instanceof HTMLElement);
  root.setAttribute("data-media-slider-ready", "");

  setActiveIndex(0, { emit: false });
  updateInteraction();
  resetProgress();

  if (enabled) {
    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerenter", handlePointerEnter);
    root.addEventListener("pointerleave", handlePointerLeave);
    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeydown);
    precisePointer.addEventListener("change", handlePointerQueryChange);

    cleanup.push(() => root.removeEventListener("pointermove", handlePointerMove));
    cleanup.push(() => root.removeEventListener("pointerenter", handlePointerEnter));
    cleanup.push(() => root.removeEventListener("pointerleave", handlePointerLeave));
    cleanup.push(() => root.removeEventListener("click", handleClick));
    cleanup.push(() => root.removeEventListener("keydown", handleKeydown));
    cleanup.push(() => precisePointer.removeEventListener("change", handlePointerQueryChange));
  }

  if (autoplay) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    cleanup.push(() => document.removeEventListener("visibilitychange", handleVisibilityChange));
    scheduleAuto();
  }

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(
          ({ allowed } = {}) => {
            motionAllowed = allowed === true;
            scheduleAuto();
          },
          { immediate: false },
        )
      : noop;

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    stopAuto();
    stopProgress();
    unsubscribeMotion();

    while (cleanup.length) {
      cleanup.pop()?.();
    }

    slides.forEach((slide) => {
      slide.removeAttribute("data-active");
      slide.removeAttribute("data-media-slide");
      slide.removeAttribute("aria-hidden");
    });

    root.removeAttribute("data-media-slider-ready");
    root.removeAttribute("data-media-slider-state");
    root.removeAttribute("data-media-slider-index");
    root.removeAttribute("data-media-slider-interaction");
    root.removeAttribute("data-media-slider-autoplaying");
    root.removeAttribute("data-media-slider-has-progress");
    root.removeAttribute("data-media-slider-progress-running");
    root.style.removeProperty("--media-slider-progress-duration");

    if (progress?.hasAttribute("data-media-slider-generated")) {
      progress.remove();
    }

    if (originalAttributes.role === null) {
      root.removeAttribute("role");
    } else {
      root.setAttribute("role", originalAttributes.role);
    }

    if (originalAttributes.tabindex === null) {
      root.removeAttribute("tabindex");
    } else {
      root.setAttribute("tabindex", originalAttributes.tabindex);
    }

    if (originalAttributes.ariaLabel === null) {
      root.removeAttribute("aria-label");
    } else {
      root.setAttribute("aria-label", originalAttributes.ariaLabel);
    }

    if (root[MEDIA_SLIDER_INSTANCE]?.destroy === destroy) {
      delete root[MEDIA_SLIDER_INSTANCE];
    }
  }

  const api = Object.freeze({
    root,
    get mode() {
      return mode;
    },
    get enabled() {
      return enabled;
    },
    get autoplay() {
      return autoplay;
    },
    get interaction() {
      return interaction;
    },
    get index() {
      return activeIndex;
    },
    next() {
      setActiveIndex(getNextSlideIndex(activeIndex, slides.length));
      restartAuto();
    },
    goTo(index) {
      setActiveIndex(index);
      restartAuto();
    },
    destroy,
  });

  root[MEDIA_SLIDER_INSTANCE] = api;
  return api;
}

export function createMediaSliders({ root = document, motion } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return noop;
  }

  const instances = Array.from(root.querySelectorAll("[data-media-slider]"))
    .map((sliderRoot) => createMediaSlider({ root: sliderRoot, motion }))
    .filter(Boolean);

  return () => {
    while (instances.length) {
      instances.pop()?.destroy();
    }
  };
}
