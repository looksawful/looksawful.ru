import { initShowcaseBeforeAfter } from "./visuals/canvas/before-after/index.js";
import { mountJesteiProcessScene } from "./visuals/dom/jestei-process-scene-live.js";

const APPLY_DELAYS = [0, 80, 240, 700, 1600, 3200, 6000, 10000];
const PROCESS_CARD_SELECTOR = '#jestei-results [data-bento-card="manual"]';
const PROCESS_SCENE_SELECTOR = "#jestei-process-scene";
const FAVICON_HREF = "/awfulface-favicon.svg?v=3";
const STYX_IDS = ["styx-graphics", "styx-print", "styx-photo-art", "styx-scanography"];

let queued = false;
let observer = null;

function isVisible(element) {
  if (!element || element.hidden) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0 &&
    rect.width > 1 &&
    rect.height > 1
  );
}

function reveal(element) {
  if (!element) return;
  element.hidden = false;
  element.removeAttribute("aria-hidden");
  element.removeAttribute("data-homepage-hidden");
  if (element.style.display === "none") element.style.removeProperty("display");
  if (element.style.visibility === "hidden") element.style.removeProperty("visibility");
  if (element.style.opacity === "0") element.style.removeProperty("opacity");
}

function ensureFavicon(root = document) {
  const doc = root.nodeType === 9 ? root : root.ownerDocument || document;
  let icon = doc.head?.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = doc.createElement("link");
    icon.rel = "icon";
    doc.head?.append(icon);
  }
  icon.type = "image/svg+xml";
  icon.href = FAVICON_HREF;
}

function ensureProcessAnimation(root = document) {
  const cards = [...root.querySelectorAll(PROCESS_CARD_SELECTOR)];
  if (!cards.length) return;

  const visibleCard = cards.find(isVisible) || cards[0];
  const visibleScene = visibleCard.querySelector(PROCESS_SCENE_SELECTOR);
  const visibleVisual = visibleCard.querySelector(".jestei-bento__process-visual");
  const state = visibleScene?.dataset.processState || "";
  const mountedOnVisibleCard =
    visibleScene &&
    visibleVisual &&
    isVisible(visibleVisual) &&
    ["ready", "running", "paused", "static"].includes(state);

  if (!mountedOnVisibleCard) {
    mountJesteiProcessScene(root);
  }

  const scene = visibleCard.querySelector(PROCESS_SCENE_SELECTOR);
  if (scene) {
    scene.dataset.finalProcessTarget = "visible";
    scene.closest(".jestei-bento__process-visual")?.removeAttribute("hidden");
  }
}

function ensureBeforeAfter(root = document) {
  const section = root.getElementById?.("jestei-tariffs");
  if (!section) return;

  const canvases = [...section.querySelectorAll('[data-animation="before-after"] canvas')];
  if (!canvases.length) return;

  const needsMount = canvases.some((canvas) => canvas.dataset.finalBeforeAfterMounted !== "true");
  if (!needsMount) return;

  initShowcaseBeforeAfter(section);
  canvases.forEach((canvas) => {
    canvas.dataset.finalBeforeAfterMounted = "true";
  });
}

function repairSectionTitle(section, exactText) {
  if (!section) return;
  const title =
    section.querySelector("[data-chapter-head] [data-section-title]") ||
    section.querySelector("[data-section-title]") ||
    section.querySelector("h2");
  if (!title) return;

  const normalized = title.textContent?.replace(/\s+/gu, " ").trim().toLocaleLowerCase("ru") || "";
  if (normalized !== exactText) {
    const main = title.querySelector("[data-section-title-main]");
    const accent = title.querySelector("[data-section-title-accent]");
    if (main && accent && exactText === "пересобрали тарифные сценарии") {
      main.textContent = "пересобрали";
      accent.textContent = "тарифные сценарии";
    } else {
      title.textContent = exactText;
    }
  }
  title.setAttribute("aria-label", exactText);
}

function repairTitles(root = document) {
  repairSectionTitle(root.getElementById?.("jestei-tariffs"), "пересобрали тарифные сценарии");
}

function repairStyx(root = document) {
  for (const id of STYX_IDS) {
    const section = root.getElementById?.(id);
    if (!section) continue;
    reveal(section);
    section
      .querySelectorAll(
        "[data-section-screen], [data-chapter-head], [data-section-body], [data-section-media], [data-media-gallery], [data-animation], [data-scanography-videos]",
      )
      .forEach(reveal);
  }

  root.querySelectorAll("#styx-scanography [data-scanography-videos] video").forEach((video) => {
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.preload = "auto";
    ["autoplay", "loop", "muted", "playsinline", "webkit-playsinline"].forEach((name) =>
      video.setAttribute(name, ""),
    );
    video.setAttribute("preload", "auto");
    if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
    video.play()?.catch?.(() => {});
  });
}

function removeShootingsHeading(root = document) {
  const section = root.getElementById?.("shootings");
  if (!section) return;
  section.querySelectorAll("h1, h2, h3, [data-section-title]").forEach((heading) => {
    const text = heading.textContent?.replace(/\s+/gu, " ").trim().toLocaleLowerCase("ru") || "";
    if (text === "творческие съёмки" || text === "творческие съемки") heading.remove();
  });
}

export function applyFinalSiteRepairs(root = document) {
  ensureFavicon(root);
  ensureProcessAnimation(root);
  ensureBeforeAfter(root);
  repairTitles(root);
  repairStyx(root);
  removeShootingsHeading(root);
  root.documentElement?.setAttribute("data-final-site-repairs", "applied");
}

function queueApply() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    applyFinalSiteRepairs(document);
  });
}

function start() {
  APPLY_DELAYS.forEach((delay) => window.setTimeout(queueApply, delay));
  window.addEventListener("load", queueApply, { once: true });
  window.addEventListener("pageshow", queueApply);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) queueApply();
  });

  requestAnimationFrame(() => requestAnimationFrame(queueApply));

  observer = new MutationObserver(queueApply);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "style", "aria-hidden", "data-homepage-hidden"],
  });

  window.setTimeout(() => {
    observer?.disconnect();
    observer = null;
    applyFinalSiteRepairs(document);
  }, 14000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
