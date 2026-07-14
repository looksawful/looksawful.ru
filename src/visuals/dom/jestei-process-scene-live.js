import { mountJesteiProcessScene as mountGeometry } from "./jestei-process-scene.js";

const CARD_SELECTOR = "#jestei-results .jestei-bento__card--manual";
const VISUAL_SELECTOR = ".jestei-bento__process-visual";
const SCENE_SELECTOR = "#jestei-process-scene";
const NS = "http://www.w3.org/2000/svg";

const DRAW = 7600;
const HOLD = 250;
const ERASE = 7600;
const CYCLE = DRAW + HOLD + ERASE;
const SPEED = 1.012;
const START_OFFSET = 900;

const TIMELINE = [
  ["lead", 0, 420],
  ["b1", 420, 980],
  ["bw1", 980, 1570],
  ["bw2", 980, 1570],
  ["bw3", 980, 1680],
  ["b2", 1570, 2220],
  ["b3", 1570, 2220],
  ["b4", 1680, 2300],
  ["bw4", 2220, 2810],
  ["bw5", 2220, 2810],
  ["bw6", 2300, 2900],
  ["b5", 2900, 3700],
  ["bw13", 3300, 3750],
  ["b9", 3750, 4420],
  ["bw7", 3700, 4260],
  ["bw8", 3700, 4260],
  ["bw9", 3700, 4350],
  ["b6", 4260, 4900],
  ["b7", 4260, 4860],
  ["b8", 4350, 4990],
  ["bw10", 4900, 5420],
  ["bw11", 4860, 5380],
  ["bw12", 4990, 5580],
  ["b10", 5580, 6250],
  ["bw14", 6250, 6670],
  ["bw15", 6250, 6670],
  ["b11", 6670, 7130],
  ["b12", 6670, 7130],
  ["exit", 7130, 7500],
  ["pw0", 0, 500],
  ["p4t", 500, 1500],
  ["p4b", 500, 1500],
  ["pw1", 1500, 1900],
  ["p1t", 1900, 2800],
  ["p1b", 1900, 2800],
  ["pw2", 2800, 3250],
  ["p3t", 3250, 4450],
  ["p3b", 3250, 4450],
  ["pw3", 4450, 4900],
  ["p5t", 4900, 5800],
  ["p5b", 4900, 5800],
  ["pw4", 5800, 6200],
  ["p6t", 6200, 6900],
  ["p6b", 6200, 6900],
  ["pw5", 6900, 7300],
];

const controllers = new WeakMap();

function svgElement(doc, name, attributes = {}) {
  const element = doc.createElementNS(NS, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

function mountStaticGeometry(root, doc, win) {
  const location = win.location;
  const history = win.history;
  const originalUrl = `${location.pathname}${location.search}${location.hash}`;
  const staticUrl = new URL(location.href);
  staticUrl.searchParams.set("static", "1");

  try {
    history.replaceState(history.state, "", `${staticUrl.pathname}${staticUrl.search}${staticUrl.hash}`);
    mountGeometry(root);
  } catch (error) {
    // The original renderer can fail in Safari when getTotalLength() is called
    // before SVG layout. Its geometry is already in the DOM, so the normalized
    // renderer below can safely take over.
    console.warn("[jestei-process] recovered from geometry initialization", error);
  } finally {
    history.replaceState(history.state, "", originalUrl);
  }
}

function progress(time, start, end) {
  if (time <= start) return 0;
  if (time >= end) return 1;
  return (time - start) / (end - start);
}

function createNormalizedMasks(svg) {
  const doc = svg.ownerDocument;
  const defs = svg.querySelector("#jestei-process-defs");
  if (!defs) return [];

  defs.querySelectorAll('[data-process-mask="normalized"]').forEach((mask) => mask.remove());
  svg.querySelectorAll(".jestei-process__stroke").forEach((path) => path.removeAttribute("mask"));

  const items = [];

  for (const [id, start, end] of TIMELINE) {
    const path = svg.querySelector(`#jestei-process-${id}`);
    if (!(path instanceof SVGPathElement)) continue;

    const maskId = `jestei-process-live-mask-${id}`;
    const mask = svgElement(doc, "mask", {
      id: maskId,
      x: 0,
      y: 0,
      width: 880,
      height: 720,
      maskUnits: "userSpaceOnUse",
      "data-process-mask": "normalized",
    });
    mask.append(svgElement(doc, "rect", { x: 0, y: 0, width: 880, height: 720, fill: "#000" }));

    const reveal = svgElement(doc, "path", {
      d: path.getAttribute("d") || "",
      fill: "none",
      stroke: "#fff",
      "stroke-width": 6,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      pathLength: 1,
      "data-process-reveal": id,
    });
    reveal.style.strokeDasharray = "0 1";
    reveal.style.strokeDashoffset = "0";
    mask.append(reveal);
    defs.append(mask);

    path.setAttribute("mask", `url(#${maskId})`);
    items.push({ id, path, reveal, start, end });
  }

  return items;
}

function setDraw(item, value) {
  const visible = Math.max(0, Math.min(1, value));
  item.reveal.style.strokeDasharray = `${visible.toFixed(5)} 1`;
  item.reveal.style.strokeDashoffset = "0";
}

function setErase(item, value) {
  const hidden = Math.max(0, Math.min(1, value));
  const visible = 1 - hidden;
  item.reveal.style.strokeDasharray = `${visible.toFixed(5)} 1`;
  item.reveal.style.strokeDashoffset = `${(-hidden).toFixed(5)}`;
}

function createController(svg) {
  const doc = svg.ownerDocument;
  const win = doc.defaultView || window;
  const items = createNormalizedMasks(svg);

  if (!items.length) {
    svg.dataset.processState = "error";
    throw new Error("Jestei process scene has no animatable paths");
  }

  let animationFrame = 0;
  let viewportFrame = 0;
  let frameCount = 0;
  let startTime = null;
  let active = false;
  let disposed = false;
  let observer = null;

  svg.dataset.processState = "ready";
  svg.dataset.processFrame = "0";

  function renderDraw(time) {
    items.forEach((item) => setDraw(item, progress(time, item.start, item.end)));
  }

  function renderErase(time) {
    items.forEach((item) => setErase(item, progress(time, item.start, item.end)));
  }

  function frame(now) {
    if (!active || disposed) return;
    if (startTime == null) startTime = now - START_OFFSET / SPEED;

    const time = ((now - startTime) * SPEED) % CYCLE;
    if (time < DRAW) {
      renderDraw(time);
    } else if (time < DRAW + HOLD) {
      renderDraw(DRAW);
    } else {
      renderErase(time - DRAW - HOLD);
    }

    frameCount += 1;
    svg.dataset.processFrame = String(frameCount);
    animationFrame = win.requestAnimationFrame(frame);
  }

  function setActive(nextActive) {
    if (disposed || active === nextActive) return;
    active = nextActive;
    win.cancelAnimationFrame(animationFrame);

    if (active) {
      startTime = null;
      svg.dataset.processState = "running";
      animationFrame = win.requestAnimationFrame(frame);
    } else {
      svg.dataset.processState = "paused";
    }
  }

  function isInViewport() {
    const rect = svg.getBoundingClientRect();
    const margin = Math.max(96, win.innerHeight * 0.22);
    return rect.width > 0 && rect.height > 0 && rect.bottom > -margin && rect.top < win.innerHeight + margin;
  }

  function syncViewport() {
    viewportFrame = 0;
    setActive(!doc.hidden && isInViewport());
  }

  function queueViewportSync() {
    if (viewportFrame || disposed) return;
    viewportFrame = win.requestAnimationFrame(syncViewport);
  }

  if ("IntersectionObserver" in win) {
    observer = new win.IntersectionObserver(
      (entries) => setActive(!doc.hidden && entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "22% 0px", threshold: 0.01 },
    );
    observer.observe(svg);
  }

  win.addEventListener("pageshow", queueViewportSync, { passive: true });
  win.addEventListener("resize", queueViewportSync, { passive: true });
  win.addEventListener("scroll", queueViewportSync, { passive: true });
  doc.addEventListener("visibilitychange", queueViewportSync);
  queueViewportSync();

  return () => {
    disposed = true;
    active = false;
    observer?.disconnect();
    win.cancelAnimationFrame(animationFrame);
    win.cancelAnimationFrame(viewportFrame);
    win.removeEventListener("pageshow", queueViewportSync);
    win.removeEventListener("resize", queueViewportSync);
    win.removeEventListener("scroll", queueViewportSync);
    doc.removeEventListener("visibilitychange", queueViewportSync);
    svg.dataset.processState = "disposed";
  };
}

export function mountJesteiProcessScene(root = document) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;
  const disposers = [];

  root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    const oldSvg = card.querySelector(SCENE_SELECTOR);
    controllers.get(oldSvg)?.();
    card.querySelector(VISUAL_SELECTOR)?.remove();

    mountStaticGeometry(root, doc, win);

    const svg = card.querySelector(SCENE_SELECTOR);
    if (!(svg instanceof SVGSVGElement)) {
      throw new Error("Jestei process scene was not created");
    }

    const dispose = createController(svg);
    controllers.set(svg, dispose);
    disposers.push(dispose);
  });

  return () => disposers.forEach((dispose) => dispose());
}
