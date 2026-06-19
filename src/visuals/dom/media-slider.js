const SLIDER_SELECTOR = "[data-showcase-auto-slider]";
const TRACK_ATTRIBUTE = "data-showcase-auto-slider-track";
const CLONE_ATTRIBUTE = "data-showcase-auto-slider-clone";
const READY_ATTRIBUTE = "showcaseAutoSliderReady";
const DEFAULT_DELAY = 2600;
const DEFAULT_DURATION = 720;

function readPositiveNumber(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function getDelay(root) {
  return readPositiveNumber(root.dataset.showcaseAutoSliderDelay, DEFAULT_DELAY);
}

function getDuration(root) {
  return readPositiveNumber(
    root.dataset.showcaseAutoSliderSpeed || root.dataset.showcaseAutoSliderDuration,
    DEFAULT_DURATION,
  );
}

function removeIds(element) {
  element.querySelectorAll("[id]").forEach((child) => {
    child.removeAttribute("id");
  });
}

function disableCloneFocus(element) {
  if (element.matches("a, button, input, select, textarea")) {
    element.setAttribute("tabindex", "-1");
  }

  element.querySelectorAll("a, button, input, select, textarea").forEach((child) => {
    child.setAttribute("tabindex", "-1");
  });
}

function createSlideClone(slide) {
  const clone = slide.cloneNode(true);

  clone.setAttribute(CLONE_ATTRIBUTE, "true");
  clone.setAttribute("aria-hidden", "true");
  removeIds(clone);
  disableCloneFocus(clone);

  return clone;
}

function getOrCreateTrack(root) {
  const existingTrack = root.querySelector("[" + TRACK_ATTRIBUTE + "]");

  if (existingTrack instanceof HTMLElement) {
    return existingTrack;
  }

  const track = document.createElement("div");
  track.className = "media-slider__track";
  track.setAttribute(TRACK_ATTRIBUTE, "true");

  const slides = [...root.children].filter((child) => child.classList?.contains("media-item"));

  slides.forEach((slide) => {
    track.appendChild(slide);
  });

  root.appendChild(track);

  return track;
}

function getSlides(track) {
  return [...track.children].filter((child) => child instanceof HTMLElement && !child.hasAttribute(CLONE_ATTRIBUTE));
}

function setTrackTransition(track, duration) {
  track.style.setProperty("--media-slider-duration", duration + "ms");
}

function setTrackOffset(track, slide, animated = true) {
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  if (!animated) {
    track.style.transition = "none";
  }

  track.style.transform = "translate3d(" + -slide.offsetLeft + "px, 0, 0)";

  if (!animated) {
    track.offsetHeight;
    track.style.transition = "";
  }
}

function initAutoSlider(root) {
  if (!(root instanceof HTMLElement) || root.dataset[READY_ATTRIBUTE] === "true") {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const track = getOrCreateTrack(root);
  const slides = getSlides(track);

  if (slides.length < 2) {
    return;
  }

  root.dataset[READY_ATTRIBUTE] = "true";
  root.classList.add("media-slider");
  root.setAttribute("aria-live", "off");

  const delay = getDelay(root);
  const duration = getDuration(root);
  const firstClone = createSlideClone(slides[0]);
  const sequence = [...slides, firstClone];

  track.appendChild(firstClone);
  setTrackTransition(track, duration);

  let index = 0;
  let timer = 0;
  let isPaused = false;
  let isResetting = false;

  function clearTimer() {
    window.clearTimeout(timer);
    timer = 0;
  }

  function scheduleNext(customDelay = delay) {
    clearTimer();

    if (reduceMotion.matches || document.hidden || isPaused) {
      return;
    }

    timer = window.setTimeout(goNext, customDelay);
  }

  function goNext() {
    if (reduceMotion.matches || document.hidden || isPaused || isResetting) {
      scheduleNext();
      return;
    }

    index += 1;
    setTrackOffset(track, sequence[index], true);

    if (index >= slides.length) {
      return;
    }

    scheduleNext(delay + duration);
  }

  function resetToStart(event) {
    if (event && (event.target !== track || event.propertyName !== "transform")) {
      return;
    }

    if (index < slides.length) {
      return;
    }

    isResetting = true;
    index = 0;
    setTrackOffset(track, sequence[index], false);
    isResetting = false;
    scheduleNext();
  }

  function pause() {
    isPaused = true;
    root.classList.add("is-paused");
    clearTimer();
  }

  function resume() {
    isPaused = false;
    root.classList.remove("is-paused");
    scheduleNext();
  }

  function syncPosition() {
    setTrackOffset(track, sequence[index], false);
  }

  track.addEventListener("transitionend", resetToStart);

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);
  root.addEventListener("touchstart", pause, { passive: true });
  root.addEventListener("touchend", resume, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimer();
      return;
    }

    scheduleNext();
  });

  const handleMotionChange = () => {
    syncPosition();
    scheduleNext();
  };

  if ("addEventListener" in reduceMotion) {
    reduceMotion.addEventListener("change", handleMotionChange);
  } else if ("addListener" in reduceMotion) {
    reduceMotion.addListener(handleMotionChange);
  }

  const resizeObserver = new ResizeObserver(syncPosition);
  resizeObserver.observe(root);

  window.addEventListener("load", syncPosition, { once: true });
  syncPosition();
  scheduleNext();
}

export function initMediaSliders(scope = document) {
  scope.querySelectorAll(SLIDER_SELECTOR).forEach(initAutoSlider);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMediaSliders();
  });
} else {
  initMediaSliders();
}
