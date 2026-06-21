const SLIDER_SELECTOR = "[data-showcase-auto-slider]";
const TRACK_ATTRIBUTE = "data-showcase-auto-slider-track";
const CLONE_ATTRIBUTE = "data-showcase-auto-slider-clone";
const READY_ATTRIBUTE = "showcaseAutoSliderReady";
const DEFAULT_DELAY = 2600;
const DEFAULT_SPEED_SOURCE = 720;
const MIN_PIXELS_PER_SECOND = 24;
const MAX_PIXELS_PER_SECOND = 96;
const CONTINUOUS_MODE = "continuous";
const STEP_MODE = "step";

function readPositiveNumber(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function getMode(root) {
  return root.dataset.showcaseAutoSliderMode === STEP_MODE ? STEP_MODE : CONTINUOUS_MODE;
}

function getDelay(root) {
  return readPositiveNumber(root.dataset.showcaseAutoSliderDelay, DEFAULT_DELAY);
}

function getStepDuration(root) {
  return readPositiveNumber(
    root.dataset.showcaseAutoSliderDuration || root.dataset.showcaseAutoSliderSpeed,
    DEFAULT_SPEED_SOURCE,
  );
}

function getPixelsPerSecond(root) {
  const explicitSpeed = readPositiveNumber(root.dataset.showcaseAutoSliderPixelsPerSecond, 0);

  if (explicitSpeed > 0) {
    return explicitSpeed;
  }

  const speedSource = readPositiveNumber(
    root.dataset.showcaseAutoSliderSpeed || root.dataset.showcaseAutoSliderDuration,
    DEFAULT_SPEED_SOURCE,
  );

  return Math.min(MAX_PIXELS_PER_SECOND, Math.max(MIN_PIXELS_PER_SECOND, speedSource / 10));
}

function disableCloneFocus(element) {
  if (element.matches("a, button, input, select, textarea")) {
    element.setAttribute("tabindex", "-1");
  }

  element.querySelectorAll("a, button, input, select, textarea").forEach((child) => {
    child.setAttribute("tabindex", "-1");
  });
}

function updateCloneIds(source, clone, cloneIndex) {
  const sourceElements = [source, ...source.querySelectorAll("[id]")];
  const cloneElements = [clone, ...clone.querySelectorAll("[id]")];

  cloneElements.forEach((element, index) => {
    const sourceElement = sourceElements[index];
    const sourceId = sourceElement?.id || element.id;

    if (element instanceof HTMLCanvasElement && sourceId) {
      element.id = sourceId + "-slider-clone-" + cloneIndex;
      return;
    }

    element.removeAttribute("id");
  });
}

function createSlideClone(slide, cloneIndex) {
  const clone = slide.cloneNode(true);

  clone.setAttribute(CLONE_ATTRIBUTE, "true");
  clone.setAttribute("aria-hidden", "true");
  updateCloneIds(slide, clone, cloneIndex);
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

function getTrackItems(track) {
  return [...track.children].filter((child) => child instanceof HTMLElement);
}

function removeClones(track) {
  track.querySelectorAll("[" + CLONE_ATTRIBUTE + "]").forEach((clone) => {
    clone.remove();
  });
}

function getCycleWidth(track, slides) {
  const firstClone = track.querySelector("[" + CLONE_ATTRIBUTE + "]");

  if (firstClone instanceof HTMLElement && slides[0] instanceof HTMLElement) {
    return firstClone.offsetLeft - slides[0].offsetLeft;
  }

  const firstSlide = slides[0];
  const lastSlide = slides[slides.length - 1];

  if (!(firstSlide instanceof HTMLElement) || !(lastSlide instanceof HTMLElement)) {
    return 0;
  }

  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;

  return lastSlide.offsetLeft + lastSlide.offsetWidth - firstSlide.offsetLeft + gap;
}

function normalizeOffset(offset, cycleWidth) {
  if (cycleWidth <= 0) {
    return 0;
  }

  return ((offset % cycleWidth) + cycleWidth) % cycleWidth;
}

function easeStep(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function applyOffset(track, offset) {
  track.style.transform = "translate3d(" + -offset + "px, 0, 0)";
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

  const mode = getMode(root);
  const delay = getDelay(root);
  const stepDuration = getStepDuration(root);
  const pixelsPerSecond = getPixelsPerSecond(root);

  root.dataset.showcaseAutoSliderMode = mode;

  let cycleWidth = 0;
  let offset = 0;
  let stepIndex = 0;
  let animationFrame = 0;
  let rebuildFrame = 0;
  let startTimer = 0;
  let stepTimer = 0;
  let lastTimestamp = 0;
  let isPaused = false;
  let cloneIndex = 0;
  let hasStarted = false;

  function clearAnimation() {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastTimestamp = 0;
  }

  function clearTimers() {
    window.clearTimeout(startTimer);
    window.clearTimeout(stepTimer);
    startTimer = 0;
    stepTimer = 0;
  }

  function clearMotion() {
    clearAnimation();
    clearTimers();
  }

  function appendCloneCycle() {
    slides.forEach((slide) => {
      cloneIndex += 1;
      track.appendChild(createSlideClone(slide, cloneIndex));
    });
  }

  function setOffset(nextOffset) {
    offset = nextOffset;
    applyOffset(track, offset);
  }

  function buildLoop() {
    clearMotion();
    removeClones(track);
    cloneIndex = 0;

    if (reduceMotion.matches) {
      cycleWidth = 0;
      stepIndex = 0;
      setOffset(0);
      return;
    }

    appendCloneCycle();
    cycleWidth = getCycleWidth(track, slides);

    if (cycleWidth <= 0) {
      removeClones(track);
      return;
    }

    const requiredWidth = root.clientWidth + cycleWidth * 2;

    while (track.scrollWidth < requiredWidth) {
      appendCloneCycle();
    }

    if (mode === STEP_MODE) {
      stepIndex = 0;
      setOffset(0);
      return;
    }

    setOffset(normalizeOffset(offset, cycleWidth));
  }

  function canMove() {
    return !reduceMotion.matches && !document.hidden && !isPaused && cycleWidth > 0;
  }

  function tick(timestamp) {
    if (!canMove()) {
      clearAnimation();
      return;
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = Math.min(timestamp - lastTimestamp, 80);
    lastTimestamp = timestamp;
    setOffset(normalizeOffset(offset + (pixelsPerSecond * delta) / 1000, cycleWidth));
    animationFrame = window.requestAnimationFrame(tick);
  }

  function startContinuous(customDelay = 0) {
    const run = () => {
      if (!canMove()) {
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    if (customDelay > 0) {
      startTimer = window.setTimeout(run, customDelay);
      return;
    }

    run();
  }

  function scheduleStep(customDelay = delay) {
    if (!canMove()) {
      return;
    }

    stepTimer = window.setTimeout(() => {
      if (!canMove()) {
        return;
      }

      const sequence = getTrackItems(track);
      let nextIndex = stepIndex + 1;

      if (!sequence[nextIndex]) {
        nextIndex = slides.length;
      }

      const target = sequence[nextIndex];

      if (!(target instanceof HTMLElement)) {
        stepIndex = 0;
        setOffset(0);
        scheduleStep(delay);
        return;
      }

      animateStepTo(target.offsetLeft, () => {
        stepIndex = nextIndex;

        if (stepIndex >= slides.length) {
          stepIndex = 0;
          setOffset(0);
        }

        scheduleStep(delay);
      });
    }, customDelay);
  }

  function animateStepTo(targetOffset, onComplete) {
    const startOffset = offset;
    const distance = targetOffset - startOffset;
    let startTimestamp = 0;

    clearAnimation();

    const frame = (timestamp) => {
      if (!canMove()) {
        clearAnimation();
        return;
      }

      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      const progress = Math.min((timestamp - startTimestamp) / stepDuration, 1);
      setOffset(startOffset + distance * easeStep(progress));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(frame);
        return;
      }

      setOffset(targetOffset);
      animationFrame = 0;
      onComplete();
    };

    animationFrame = window.requestAnimationFrame(frame);
  }

  function start(customDelay = 0) {
    clearMotion();

    if (!canMove()) {
      return;
    }

    if (mode === STEP_MODE) {
      scheduleStep(customDelay > 0 ? customDelay : delay);
      return;
    }

    startContinuous(customDelay);
  }

  function rebuild() {
    window.cancelAnimationFrame(rebuildFrame);
    rebuildFrame = 0;
    buildLoop();
    start(hasStarted && mode === CONTINUOUS_MODE ? 0 : delay);
    hasStarted = true;
  }

  function scheduleRebuild() {
    window.cancelAnimationFrame(rebuildFrame);
    rebuildFrame = window.requestAnimationFrame(rebuild);
  }

  function pause() {
    isPaused = true;
    root.classList.add("is-paused");
    clearMotion();
  }

  function resume() {
    isPaused = false;
    root.classList.remove("is-paused");
    start(mode === STEP_MODE ? delay : 0);
  }

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);
  root.addEventListener("touchstart", pause, { passive: true });
  root.addEventListener("touchend", resume, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearMotion();
      return;
    }

    start(mode === STEP_MODE ? delay : 0);
  });

  const handleMotionChange = () => {
    scheduleRebuild();
  };

  if ("addEventListener" in reduceMotion) {
    reduceMotion.addEventListener("change", handleMotionChange);
  } else if ("addListener" in reduceMotion) {
    reduceMotion.addListener(handleMotionChange);
  }

  const resizeObserver = new ResizeObserver(scheduleRebuild);
  resizeObserver.observe(root);

  track.querySelectorAll("img").forEach((image) => {
    if (image.complete) {
      return;
    }

    image.addEventListener("load", scheduleRebuild, { once: true });
    image.addEventListener("error", scheduleRebuild, { once: true });
  });

  window.addEventListener("load", scheduleRebuild, { once: true });
  scheduleRebuild();
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
