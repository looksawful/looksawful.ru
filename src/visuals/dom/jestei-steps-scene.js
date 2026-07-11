import dataA from "./jestei-steps-data-a.js";
import dataB from "./jestei-steps-data-b.js";
import dataC from "./jestei-steps-data-c.js";

const CARD_SELECTOR = "#jestei-results .jestei-bento__card--steps";
const VISUAL_CLASS = "jestei-bento__steps-visual";
const CANVAS_CLASS = "jestei-bento__steps-canvas";
const VIEWBOX = { width: 1515, height: 1567 };
const COMPRESSED_SOURCE = dataA + dataB + dataC;
const CENTERS = [[89.997,1313.37],[232.565,966.562],[184.252,523.236],[465.674,476.337],[837.997,159.432],[609.913,106.868],[1204.795,128.195],[1206.425,1042.527],[625.48,1394.175],[1342.345,409.718],[1404.39,855.269],[833.081,1508.31]];
const STEP_ORDER = [0, 1, 2, 3, 5, 4, 6, 9, 10, 7, 11, 8];
const BLACK_FINAL = new Set([0, 1, 2, 3]);
const TIMING = {
  initialHold: 1050,
  footDelay: 380,
  footDuration: 720,
  beforeDissolve: 1150,
  dissolveStagger: 125,
  dissolveDuration: 1900,
  finalHold: 2600,
  fadeOut: 900,
};
const PAKO_MODULE_URL = "https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm";

let sourceGroupsPromise;

function decodeBase64(win, value) {
  const binary = win.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function loadSourceGroups(win) {
  sourceGroupsPromise ||= (async () => {
    const compressed = decodeBase64(win, COMPRESSED_SOURCE);
    let jsonText;

    if ("DecompressionStream" in win) {
      const stream = new Blob([compressed])
        .stream()
        .pipeThrough(new win.DecompressionStream("gzip"));
      jsonText = await new Response(stream).text();
    } else {
      const module = await import(/* @vite-ignore */ PAKO_MODULE_URL);
      jsonText = module.ungzip(compressed, { to: "string" });
    }

    return JSON.parse(jsonText);
  })();

  return sourceGroupsPromise;
}

function createCanvas(card) {
  const doc = card.ownerDocument;
  let visual = card.querySelector(`.${VISUAL_CLASS}`);

  if (!visual) {
    visual = doc.createElement("div");
    visual.className = VISUAL_CLASS;
    visual.setAttribute("aria-hidden", "true");
    card.append(visual);
  }

  let canvas = visual.querySelector(`.${CANVAS_CLASS}`);
  if (!canvas) {
    canvas = doc.createElement("canvas");
    canvas.className = CANVAS_CLASS;
    canvas.setAttribute("role", "presentation");
    visual.append(canvas);
  }

  return canvas;
}

function mountStepsCard(card, sourceGroups) {
  if (!(card instanceof HTMLElement) || card.dataset.stepsSceneMounted === "true") {
    return () => {};
  }

  const win = card.ownerDocument.defaultView || window;
  if (typeof win.Path2D !== "function") return () => {};

  const canvas = createCanvas(card);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return () => {};

  card.dataset.stepsSceneMounted = "true";

  const paths = sourceGroups.map((group) => group.map((data) => new win.Path2D(data)));
  const rank = new Map(STEP_ORDER.map((index, position) => [index, position]));
  const fadingOrder = STEP_ORDER.filter((index) => !BLACK_FINAL.has(index));
  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const staticMode = new URLSearchParams(win.location.search).has("static") || reducedMotion;

  const lastAppearanceStart = TIMING.initialHold + (STEP_ORDER.length - 3) * TIMING.footDelay;
  const allVisibleAt = lastAppearanceStart + TIMING.footDuration;
  const dissolveAt = allVisibleAt + TIMING.beforeDissolve;
  const dissolveEnd =
    dissolveAt +
    (fadingOrder.length - 1) * TIMING.dissolveStagger +
    TIMING.dissolveDuration;
  const fadeOutAt = dissolveEnd + TIMING.finalHold;
  const cycleDuration = fadeOutAt + TIMING.fadeOut;

  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;
  let startedAt = win.performance.now();
  let animationFrame = 0;
  let active = false;
  let disposed = false;
  let resizeObserver;
  let intersectionObserver;

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const easeOutSine = (value) => Math.sin((Math.PI * clamp01(value)) / 2);
  const easeInOutSine = (value) => -(Math.cos(Math.PI * clamp01(value)) - 1) / 2;
  const easeInOutQuad = (value) => {
    const time = clamp01(value);
    return time < 0.5 ? 2 * time * time : 1 - ((-2 * time + 2) ** 2) / 2;
  };

  function appearance(index, time) {
    const position = rank.get(index);
    if (position < 2) return 1;
    const start = TIMING.initialHold + (position - 2) * TIMING.footDelay;
    return easeOutSine((time - start) / TIMING.footDuration);
  }

  function whiteness(index, time) {
    if (BLACK_FINAL.has(index)) return 0;
    const position = fadingOrder.indexOf(index);
    const start = dissolveAt + position * TIMING.dissolveStagger;
    return easeInOutSine((time - start) / TIMING.dissolveDuration);
  }

  function resize() {
    if (disposed) return;

    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    dpr = Math.min(win.devicePixelRatio || 1, 2.5);

    const nextWidth = Math.max(1, Math.round(cssWidth * dpr));
    const nextHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== nextWidth) canvas.width = nextWidth;
    if (canvas.height !== nextHeight) canvas.height = nextHeight;
  }

  function drawFoot(index, time, globalAlpha) {
    const visible = appearance(index, time);
    if (visible <= 0) return;

    const [centerX, centerY] = CENTERS[index];
    const landing = 1 - visible;
    const settle = easeInOutQuad(visible);
    const scale = 0.982 + settle * 0.018;
    const offsetY = landing * 10;
    const white = whiteness(index, time);
    const channel = Math.round(255 * white);
    const strokeAlpha = 0.92 + (1 - white) * 0.08;

    context.save();
    context.globalAlpha = (0.1 + visible * 0.9) * globalAlpha;
    context.translate(centerX, centerY + offsetY);
    context.scale(scale, scale);
    context.translate(-centerX, -centerY);
    context.fillStyle = `rgb(${channel}, ${channel}, ${channel})`;
    context.strokeStyle = `rgba(0, 0, 0, ${strokeAlpha})`;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const path of paths[index]) {
      context.fill(path);
      context.stroke(path);
    }

    context.restore();
  }

  function renderTime(time, globalAlpha = 1) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const padding = Math.min(cssWidth, cssHeight) * 0.035;
    const availableWidth = Math.max(1, cssWidth - padding * 2);
    const availableHeight = Math.max(1, cssHeight - padding * 2);
    const scale = Math.min(
      availableWidth / VIEWBOX.width,
      availableHeight / VIEWBOX.height,
    );
    const offsetX = (cssWidth - VIEWBOX.width * scale) / 2;
    const offsetY = (cssHeight - VIEWBOX.height * scale) / 2;

    context.setTransform(
      dpr * scale,
      0,
      0,
      dpr * scale,
      dpr * offsetX,
      dpr * offsetY,
    );

    for (let index = 0; index < paths.length; index += 1) {
      drawFoot(index, time, globalAlpha);
    }
  }

  function frame(now) {
    if (!active || disposed) return;

    const time = (now - startedAt) % cycleDuration;
    let globalAlpha = 1;

    if (time >= fadeOutAt) {
      globalAlpha = 1 - easeInOutSine((time - fadeOutAt) / TIMING.fadeOut);
    }

    renderTime(time, globalAlpha);
    animationFrame = win.requestAnimationFrame(frame);
  }

  function setActive(nextActive) {
    if (staticMode || disposed || active === nextActive) return;

    active = nextActive;
    win.cancelAnimationFrame(animationFrame);

    if (active) {
      startedAt = win.performance.now();
      animationFrame = win.requestAnimationFrame(frame);
    }
  }

  function renderStatic() {
    resize();
    renderTime(dissolveEnd);
  }

  resize();

  if (staticMode) {
    renderStatic();
  } else {
    renderTime(0);

    if ("IntersectionObserver" in win) {
      intersectionObserver = new win.IntersectionObserver(
        (entries) => {
          setActive(entries.some((entry) => entry.isIntersecting));
        },
        { rootMargin: "15% 0px", threshold: 0.01 },
      );
      intersectionObserver.observe(card);
    } else {
      setActive(true);
    }
  }

  if ("ResizeObserver" in win) {
    resizeObserver = new win.ResizeObserver(() => {
      resize();
      if (staticMode) renderTime(dissolveEnd);
    });
    resizeObserver.observe(canvas);
  } else {
    win.addEventListener("resize", resize, { passive: true });
  }

  function handleVisibilityChange() {
    if (staticMode) return;

    if (card.ownerDocument.hidden) {
      setActive(false);
      return;
    }

    const rect = card.getBoundingClientRect();
    setActive(rect.bottom > 0 && rect.top < win.innerHeight);
  }

  card.ownerDocument.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    disposed = true;
    active = false;
    win.cancelAnimationFrame(animationFrame);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    win.removeEventListener("resize", resize);
    card.ownerDocument.removeEventListener("visibilitychange", handleVisibilityChange);
    card.querySelector(`.${VISUAL_CLASS}`)?.remove();
    delete card.dataset.stepsSceneMounted;
  };
}

export async function mountJesteiStepsScene(root = document) {
  const cards = [...root.querySelectorAll(CARD_SELECTOR)];
  if (!cards.length) return () => {};

  const win = cards[0].ownerDocument.defaultView || window;
  const sourceGroups = await loadSourceGroups(win);
  const disposers = cards.map((card) => mountStepsCard(card, sourceGroups));

  return () => {
    disposers.forEach((dispose) => dispose?.());
  };
}
