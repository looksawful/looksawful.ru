const BEFORE_AFTER_INSTANCE = Symbol.for("looksawful.beforeAfter.instance");

const VALID_MODES = new Set(["once", "restart", "pingpong"]);
const VALID_DIRECTIONS = new Set(["forward", "reverse"]);
const INTERACTION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const DEFAULT_DURATION = 5200;
const MIN_DURATION = 500;
const MAX_DURATION = 30000;
const noop = () => {};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeBeforeAfterOptions(dataset = {}) {
  const mode = VALID_MODES.has(dataset.mode) ? dataset.mode : "pingpong";
  const direction = VALID_DIRECTIONS.has(dataset.direction)
    ? dataset.direction
    : "forward";

  return {
    autoplay: dataset.autoplay !== "false",
    mode,
    direction,
    duration: clamp(
      toFiniteNumber(dataset.duration, DEFAULT_DURATION),
      MIN_DURATION,
      MAX_DURATION,
    ),
    start: clamp(toFiniteNumber(dataset.start, 50), 0, 100),
  };
}

export function resolveNextBeforeAfterSegment({
  mode,
  direction,
  from,
  to,
} = {}) {
  if (mode === "once") {
    return null;
  }

  if (mode === "pingpong") {
    return {
      from: clamp(toFiniteNumber(to, 100), 0, 100),
      to: clamp(toFiniteNumber(from, 0), 0, 100),
    };
  }

  const resetTo = direction === "reverse" ? 100 : 0;

  return {
    from: resetTo,
    to: 100 - resetTo,
    resetTo,
  };
}

function readMotionAllowed(motion) {
  return typeof motion?.allowsMotion === "function"
    ? motion.allowsMotion()
    : !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function createBeforeAfterInstance({ root, motion } = {}) {
  if (!(root instanceof HTMLElement)) {
    return null;
  }

  root[BEFORE_AFTER_INSTANCE]?.destroy();

  const viewport = root.querySelector(".before-after__viewport");
  const range = root.querySelector(".before-after__range");

  if (!(viewport instanceof HTMLElement) || !(range instanceof HTMLInputElement)) {
    return null;
  }

  const labels = Array.from(root.querySelectorAll(".before-after__label"));
  const handle = root.querySelector(".before-after__handle");
  const options = normalizeBeforeAfterOptions(root.dataset);
  const cleanup = [];

  let destroyed = false;
  let frameId = 0;
  let startedAt = 0;
  let elapsedBeforePause = 0;
  let segmentStart = 0;
  let segmentEnd = 100;
  let segmentDuration = options.duration;
  let running = false;
  let hasInteracted = false;
  let phase = "intro";
  let pointerIsDown = false;
  let inViewport = true;
  let documentVisible = document.visibilityState !== "hidden";
  let motionAllowed = readMotionAllowed(motion);

  function canAnimate() {
    return (
      options.autoplay &&
      motionAllowed &&
      inViewport &&
      documentVisible &&
      !pointerIsDown
    );
  }

  function setState(state) {
    root.dataset.beforeAfterState = state;
  }

  function setSplit(value) {
    const split = clamp(toFiniteNumber(value, 0), 0, 100);
    const rounded = Number(split.toFixed(3));

    range.value = String(rounded);
    range.setAttribute(
      "aria-valuetext",
      `После ${Math.round(rounded)}%, до ${100 - Math.round(rounded)}%`,
    );

    root.style.setProperty("--before-after-split", `${rounded}%`);
  }

  function prepareSegment(from, to) {
    segmentStart = clamp(toFiniteNumber(from, 0), 0, 100);
    segmentEnd = clamp(toFiniteNumber(to, 100), 0, 100);

    const distance = Math.abs(segmentEnd - segmentStart);
    segmentDuration = Math.max(120, options.duration * (distance / 100));
    elapsedBeforePause = 0;
  }

  function stop() {
    running = false;
    elapsedBeforePause = 0;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  function pause() {
    if (!running) {
      return;
    }

    running = false;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    setState("paused");
  }

  function start() {
    if (running || !canAnimate()) {
      return;
    }

    running = true;
    startedAt = performance.now() - elapsedBeforePause;
    setState("running");
    frameId = requestAnimationFrame(render);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function finishIntro() {
    running = false;
    frameId = 0;
    elapsedBeforePause = 0;
    setSplit(100);
    setState("idle");
  }

  function completeSegment(now) {
    setSplit(segmentEnd);

    if (phase === "intro") {
      finishIntro();
      return;
    }

    const next = resolveNextBeforeAfterSegment({
      mode: options.mode,
      direction: options.direction,
      from: segmentStart,
      to: segmentEnd,
    });

    if (!next) {
      running = false;
      frameId = 0;
      elapsedBeforePause = 0;
      setState("finished");
      return;
    }

    if (Number.isFinite(next.resetTo)) {
      setSplit(next.resetTo);
    }

    segmentStart = next.from;
    segmentEnd = next.to;
    segmentDuration = options.duration;
    elapsedBeforePause = 0;
    startedAt = now;
    frameId = requestAnimationFrame(render);
  }

  function render(now) {
    if (!running) {
      return;
    }

    const elapsed = now - startedAt;
    const progress = clamp(elapsed / segmentDuration, 0, 1);
    const eased = easeInOutCubic(progress);

    setSplit(segmentStart + (segmentEnd - segmentStart) * eased);
    elapsedBeforePause = elapsed;

    if (progress < 1) {
      frameId = requestAnimationFrame(render);
      return;
    }

    completeSegment(now);
  }

  function startInteractiveFromCurrent() {
    stop();
    hasInteracted = true;
    phase = "interactive";

    const current = toFiniteNumber(range.value, options.start);
    const preferredTarget = options.direction === "reverse" ? 0 : 100;
    const target = Math.abs(current - preferredTarget) < 0.1
      ? 100 - preferredTarget
      : preferredTarget;

    prepareSegment(current, target);
    start();
  }

  function playIntro() {
    stop();
    hasInteracted = false;
    phase = "intro";
    setSplit(0);
    prepareSegment(0, 100);

    if (!options.autoplay || !motionAllowed) {
      setSplit(100);
      setState("idle");
      return;
    }

    start();
  }

  function handleInput() {
    hasInteracted = true;
    phase = "interactive";
    setSplit(range.value);
    setState("dragging");
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    pointerIsDown = true;
    hasInteracted = true;
    phase = "interactive";
    pause();
    setState("dragging");

    range.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event) {
    if (!pointerIsDown) {
      return;
    }

    pointerIsDown = false;

    if (range.hasPointerCapture?.(event.pointerId)) {
      range.releasePointerCapture?.(event.pointerId);
    }

    if (options.autoplay && motionAllowed) {
      startInteractiveFromCurrent();
    } else {
      setState("idle");
    }
  }

  function handleKeyDown(event) {
    if (!INTERACTION_KEYS.has(event.key)) {
      return;
    }

    hasInteracted = true;
    phase = "interactive";
    pause();
    setState("dragging");
  }

  function handleKeyUp(event) {
    if (!INTERACTION_KEYS.has(event.key)) {
      return;
    }

    if (options.autoplay && motionAllowed) {
      startInteractiveFromCurrent();
    } else {
      setState("idle");
    }
  }

  function handleVisibilityChange() {
    documentVisible = document.visibilityState !== "hidden";

    if (documentVisible) {
      start();
    } else {
      pause();
    }
  }

  range.addEventListener("input", handleInput);
  range.addEventListener("pointerdown", handlePointerDown);
  range.addEventListener("pointerup", handlePointerUp);
  range.addEventListener("pointercancel", handlePointerUp);
  range.addEventListener("keydown", handleKeyDown);
  range.addEventListener("keyup", handleKeyUp);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  cleanup.push(
    () => range.removeEventListener("input", handleInput),
    () => range.removeEventListener("pointerdown", handlePointerDown),
    () => range.removeEventListener("pointerup", handlePointerUp),
    () => range.removeEventListener("pointercancel", handlePointerUp),
    () => range.removeEventListener("keydown", handleKeyDown),
    () => range.removeEventListener("keyup", handleKeyUp),
    () => document.removeEventListener("visibilitychange", handleVisibilityChange),
  );

  const intersectionObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        ([entry]) => {
          inViewport = entry.isIntersecting;

          if (inViewport) {
            start();
          } else {
            pause();
          }
        },
        { threshold: 0.05 },
      )
    : null;

  intersectionObserver?.observe(root);

  const unsubscribeMotion = typeof motion?.subscribe === "function"
    ? motion.subscribe(
        ({ allowed } = {}) => {
          motionAllowed = allowed === true;

          if (!motionAllowed) {
            pause();

            if (phase === "intro" && !hasInteracted) {
              setSplit(100);
              setState("idle");
            }
          } else {
            start();
          }
        },
        { immediate: false },
      )
    : noop;

  labels.forEach((label) => {
    label.hidden = root.dataset.labels === "false";
  });

  if (handle instanceof HTMLElement) {
    handle.hidden = root.dataset.handle === "false";
  }

  root.dataset.beforeAfterReady = "";
  playIntro();

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    stop();
    unsubscribeMotion();
    intersectionObserver?.disconnect();

    while (cleanup.length) {
      cleanup.pop()?.();
    }

    root.removeAttribute("data-before-after-ready");
    root.removeAttribute("data-before-after-state");
    root.style.removeProperty("--before-after-split");

    if (root[BEFORE_AFTER_INSTANCE]?.destroy === destroy) {
      delete root[BEFORE_AFTER_INSTANCE];
    }
  }

  const api = Object.freeze({
    root,
    start,
    pause,
    restart: playIntro,
    destroy,
  });

  root[BEFORE_AFTER_INSTANCE] = api;
  return api;
}

export function createBeforeAfters({ root = document, motion } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return noop;
  }

  const instances = Array.from(root.querySelectorAll("[data-before-after]"))
    .map((element) => createBeforeAfterInstance({ root: element, motion }))
    .filter(Boolean);

  return () => {
    while (instances.length) {
      instances.pop()?.destroy();
    }
  };
}
