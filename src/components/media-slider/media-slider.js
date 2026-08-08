const MEDIA_SLIDER_INSTANCE = Symbol.for("looksawful.mediaSlider.instance");

const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const VALID_MODES = new Set(["adaptive", "hover", "click", "auto", "off"]);
const DEFAULT_MODE = "adaptive";
const DEFAULT_INTERVAL = 5200;
const MIN_INTERVAL = 600;
const AUTOPLAY_VISIBILITY_MARGIN = "200px 0px";
const USER_CONTROLS_ENABLED_VALUE = "on";
const FORCE_STATIC_MEDIA_SLIDERS = true;

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
  inViewport = true,
} = {}) {
  return (
    autoplay === true &&
    motionAllowed === true &&
    paused !== true &&
    documentVisible === true &&
    inViewport === true
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

export function resolveMediaSliderUserControls({ root } = {}) {
  return root?.dataset.mediaSliderUserControls === USER_CONTROLS_ENABLED_VALUE;
}

function createIndex(root, enabled, count) {
  if (!resolveMediaSliderProgressVisible({ enabled })) {
    return null;
  }

  const index = document.createElement("span");
  const track = document.createElement("span");
  const items = [];

  index.setAttribute("data-media-slider-index", "");
  index.setAttribute("data-media-slider-generated", "");
  index.setAttribute("aria-hidden", "true");

  track.setAttribute("data-media-slider-index-track", "");

  for (let slideIndex = 0; slideIndex < count; slideIndex += 1) {
    const item = document.createElement("span");
    const visual = document.createElement("span");
    const progress = document.createElement("span");

    item.setAttribute("data-media-slider-index-item", "");
    item.dataset.mediaSliderIndexItem = String(slideIndex);

    visual.setAttribute("data-media-slider-index-visual", "");
    progress.setAttribute("data-media-slider-index-progress", "");

    visual.append(progress);
    item.append(visual);
    track.append(item);
    items.push(item);
  }

  index.append(track);
  root.append(index);

  return {
    root: index,
    items,
  };
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
  const requestedMode = normalizeMediaSliderMode(root.dataset.mediaSliderMode);
  const mode = FORCE_STATIC_MEDIA_SLIDERS ? "off" : requestedMode;
  const enabled = resolveMediaSliderEnabled({ mode, count: slides.length });
  const userControlsEnabled = enabled && resolveMediaSliderUserControls({ root });
  const autoplay = enabled && (
    mode === "auto" || root.hasAttribute("data-media-slider-autoplay")
  );
  const interval = readInterval(root);
  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY);
  const cleanup = [];
  const index = createIndex(root, enabled, slides.length);

  const originalAttributes = {
    role: root.getAttribute("role"),
    tabindex: root.getAttribute("tabindex"),
    ariaLabel: root.getAttribute("aria-label"),
    userControls: root.getAttribute("data-media-slider-user-controls"),
  };

  let destroyed = false;
  let activeIndex = -1;
  let autoTimer = 0;
  let autoPaused = false;
  let autoVisible = !autoplay || !("IntersectionObserver" in window);
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

    updateIndexItems();
  }

  function getDotSize(distance) {
    if (distance === 1) return 14;
    if (distance === 2) return 12;
    if (distance === 3) return 10;
    if (distance === 4) return 8;
    return 7;
  }

  function getDotOpacity(distance) {
    return Math.max(0.5, 1 - distance * 0.12);
  }

  function updateIndexItems() {
    if (!index?.items) {
      return;
    }

    index.items.forEach((item, itemIndex) => {
      const active = itemIndex === activeIndex;
      const distance = Math.abs(itemIndex - activeIndex);
      const visual = item.querySelector("[data-media-slider-index-visual]");

      item.setAttribute("aria-current", String(active));

      if (!(visual instanceof HTMLElement)) {
        return;
      }

      if (active) {
        item.style.setProperty(
          "--media-slider-index-item-size",
          "var(--media-slider-index-pill-size)",
        );
        visual.style.setProperty(
          "--media-slider-index-visual-inline-size",
          "var(--media-slider-index-pill-size)",
        );
        visual.style.setProperty(
          "--media-slider-index-visual-block-size",
          "var(--media-slider-index-pill-block-size)",
        );
        visual.style.setProperty("--media-slider-index-visual-opacity", "1");
        return;
      }

      const size = getDotSize(distance);

      item.style.setProperty("--media-slider-index-item-size", `${size}px`);
      visual.style.setProperty(
        "--media-slider-index-visual-inline-size",
        `${size}px`,
      );
      visual.style.setProperty(
        "--media-slider-index-visual-block-size",
        `${size}px`,
      );
      visual.style.setProperty(
        "--media-slider-index-visual-opacity",
        String(getDotOpacity(distance)),
      );
    });
  }

  function resetProgress() {
    if (!index?.root) {
      return;
    }

    root.style.setProperty(
      "--media-slider-index-progress-duration",
      `${interval}ms`,
    );

    root.removeAttribute("data-media-slider-index-progress-running");

    if (
      !resolveMediaSliderProgressRunning({
        autoplay,
        motionAllowed,
        paused: autoPaused,
        documentVisible: document.visibilityState !== "hidden",
        inViewport: autoVisible,
      })
    ) {
      return;
    }

    const activeProgress = index.items[activeIndex]?.querySelector(
      "[data-media-slider-index-progress]",
    );

    if (activeProgress instanceof HTMLElement) {
      void activeProgress.offsetWidth;
    }

    root.setAttribute("data-media-slider-index-progress-running", "");
  }

  function stopProgress() {
    root.removeAttribute("data-media-slider-index-progress-running");
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
      autoVisible &&
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
    interaction = enabled && userControlsEnabled
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

  function setAutoVisible(visible) {
    if (autoVisible === visible) {
      return;
    }

    autoVisible = visible;
    root.toggleAttribute("data-media-slider-in-view", visible);
    scheduleAuto();
  }

  function handlePointerQueryChange() {
    updateInteraction();
  }

  slides.forEach((slide) => {
    slide.setAttribute("data-media-slide", "");
  });

  root.dataset.mediaSliderMode = requestedMode;
  root.dataset.mediaSliderState = enabled ? "enabled" : "disabled";
  root.dataset.mediaSliderUserControls = userControlsEnabled ? "on" : "off";
  root.toggleAttribute("data-media-slider-autoplaying", autoplay);
  root.toggleAttribute("data-media-slider-has-index", Boolean(index?.root));
  root.setAttribute("data-media-slider-ready", "");

  setActiveIndex(0, { emit: false });
  updateInteraction();
  resetProgress();

  if (enabled && userControlsEnabled) {
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

    if ("IntersectionObserver" in window) {
      const autoplayObserver = new IntersectionObserver(
        ([entry]) => setAutoVisible(Boolean(entry?.isIntersecting)),
        {
          rootMargin: AUTOPLAY_VISIBILITY_MARGIN,
        },
      );

      autoplayObserver.observe(root);
      cleanup.push(() => autoplayObserver.disconnect());
    } else {
      root.setAttribute("data-media-slider-in-view", "");
    }

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
    root.removeAttribute("data-media-slider-has-index");
    root.removeAttribute("data-media-slider-in-view");
    root.removeAttribute("data-media-slider-index-progress-running");
    root.style.removeProperty("--media-slider-index-progress-duration");

    if (index?.root?.hasAttribute("data-media-slider-generated")) {
      index.root.remove();
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

    if (originalAttributes.userControls === null) {
      root.removeAttribute("data-media-slider-user-controls");
    } else {
      root.setAttribute(
        "data-media-slider-user-controls",
        originalAttributes.userControls,
      );
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
