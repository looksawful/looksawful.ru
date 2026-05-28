import { gsap } from "gsap";

const DEFAULT_TEXT = "пум-пурум-пум-пум";
const DEFAULT_DELAY = 420;
const DEFAULT_MIN_VISIBLE = 520;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PRELOAD_SELECTOR = "[data-preload-state]";
const TRANSPARENT_ALPHA_LIMIT = 0.05;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function parseRgbColor(value) {
  const match = value.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const [red, green, blue, alpha = "1"] = match[1].split(",").map((part) => Number.parseFloat(part.trim()));

  if (![red, green, blue, alpha].every(Number.isFinite)) {
    return null;
  }

  return { red, green, blue, alpha };
}

function getRelativeLuminance({ red, green, blue }) {
  const channels = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getEffectiveBackgroundColor(element) {
  let current = element;

  while (current instanceof HTMLElement) {
    const color = parseRgbColor(getComputedStyle(current).backgroundColor);

    if (color && color.alpha > TRANSPARENT_ALPHA_LIMIT) {
      return color;
    }

    current = current.parentElement;
  }

  return { red: 255, green: 255, blue: 255, alpha: 1 };
}

function resolveTheme(host, theme) {
  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return getRelativeLuminance(getEffectiveBackgroundColor(host)) < 0.42 ? "dark" : "light";
}

function splitText(text) {
  return Array.from(text);
}

function buildPreloadElement(text, theme, isFixed) {
  const root = document.createElement("div");
  root.className = `preload-state${isFixed ? " preload-state--fixed" : ""}`;
  root.dataset.theme = theme;
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-label", text);

  const label = document.createElement("span");
  label.className = "preload-state__text";
  label.setAttribute("aria-hidden", "true");

  splitText(text).forEach((letter) => {
    const span = document.createElement("span");
    span.className = letter === " " ? "preload-state__space" : "preload-state__letter";
    span.textContent = letter;
    label.appendChild(span);
  });

  root.appendChild(label);
  return root;
}

function createRevealTimeline(letters, onComplete) {
  return gsap
    .timeline({ onComplete })
    .set(letters, { autoAlpha: 0, y: "0.48em", scale: 0.98 })
    .to(letters, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.46,
      ease: "sine.out",
      stagger: {
        each: 0.045,
        from: "start",
      },
    });
}

function createWaveTimeline(letters) {
  const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.08 });

  letters.forEach((letter, index) => {
    timeline.to(
      letter,
      {
        y: "-0.22em",
        duration: 0.34,
        ease: "sine.out",
        yoyo: true,
        repeat: 1,
      },
      index * 0.055,
    );
  });

  return timeline;
}

export function createPreloadState(host, options = {}) {
  if (!(host instanceof HTMLElement)) {
    return null;
  }

  const text = options.text || host.dataset.preloadText || DEFAULT_TEXT;
  const fixed = Boolean(options.fixed ?? host.matches("body"));
  const minVisible = options.minVisible ?? DEFAULT_MIN_VISIBLE;
  let element = null;
  let letters = [];
  let showTimer = null;
  let revealTimeline = null;
  let waveTimeline = null;
  let visible = false;
  let shownAt = 0;

  function mount() {
    if (element) {
      return;
    }

    const theme = resolveTheme(host, options.theme || host.dataset.preloadTheme || "auto");
    element = buildPreloadElement(text, theme, fixed);
    letters = [...element.querySelectorAll(".preload-state__letter")];
    host.classList.add("preload-state-host");
    host.appendChild(element);
  }

  function startWave() {
    if (!visible || isReducedMotion()) {
      return;
    }

    waveTimeline?.kill();
    waveTimeline = createWaveTimeline(letters);
  }

  function show() {
    window.clearTimeout(showTimer);
    showTimer = null;

    if (visible) {
      return;
    }

    mount();

    visible = true;
    shownAt = performance.now();
    element.classList.add("is-visible");

    if (isReducedMotion()) {
      gsap.set(letters, { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }

    revealTimeline?.kill();
    revealTimeline = createRevealTimeline(letters, startWave);
  }

  function showAfterDelay(delay = DEFAULT_DELAY) {
    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(show, delay);
  }

  async function hide() {
    window.clearTimeout(showTimer);
    showTimer = null;

    if (!element || !visible) {
      destroy();
      return;
    }

    const elapsed = performance.now() - shownAt;

    if (elapsed < minVisible) {
      await wait(minVisible - elapsed);
    }

    revealTimeline?.kill();
    waveTimeline?.kill();
    revealTimeline = null;
    waveTimeline = null;
    visible = false;

    await gsap.to(element, {
      autoAlpha: 0,
      duration: isReducedMotion() ? 0 : 0.22,
      ease: "sine.out",
    });

    destroy();
  }

  function destroy() {
    window.clearTimeout(showTimer);
    revealTimeline?.kill();
    waveTimeline?.kill();
    showTimer = null;
    revealTimeline = null;
    waveTimeline = null;
    visible = false;

    element?.remove();
    element = null;
    letters = [];

    if (!host.querySelector(".preload-state")) {
      host.classList.remove("preload-state-host");
    }
  }

  return {
    show,
    showAfterDelay,
    hide,
    destroy,
  };
}

export async function withPreloadState(host, work, options = {}) {
  const preloadState = createPreloadState(host, options);

  if (!preloadState) {
    return work();
  }

  preloadState.showAfterDelay(options.delay ?? DEFAULT_DELAY);

  try {
    return await work();
  } finally {
    await preloadState.hide();
  }
}

export function initPreloadStates(root = document) {
  const hosts = [...root.querySelectorAll(PRELOAD_SELECTOR)];

  hosts.forEach((host) => {
    if (!(host instanceof HTMLElement) || host.dataset.preloadMounted === "true") {
      return;
    }

    host.dataset.preloadMounted = "true";
    const preloadState = createPreloadState(host, {
      text: host.dataset.preloadText,
      theme: host.dataset.preloadTheme,
      fixed: host.dataset.preloadFixed === "true",
      minVisible: Number.parseInt(host.dataset.preloadMinVisible || "", 10) || DEFAULT_MIN_VISIBLE,
    });

    if (host.dataset.preloadActive === "true") {
      preloadState?.showAfterDelay(Number.parseInt(host.dataset.preloadDelay || "", 10) || 0);
    }
  });
}
