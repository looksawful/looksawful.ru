import "./styles/safe-visible-repairs.css";
import { initShowcaseBeforeAfter } from "./visuals/canvas/before-after/index.js";
import { mountJesteiProcessScene } from "./visuals/dom/jestei-process-scene-live.js";

const DELAYS = [0, 120, 600, 1600, 3600, 6500];
const STYX_IDS = ["styx-graphics", "styx-print", "styx-photo-art", "styx-scanography"];
const FAVICON_HREF = "/awfulface-favicon.svg";
let tariffsMounted = false;
let processCard = null;
let disposeProcessScene = null;

const normalize = (value) =>
  String(value || "").replace(/\s+/gu, " ").trim().toLocaleLowerCase("ru");

function preferredDpr() {
  const memory = Number(navigator.deviceMemory) || 8;
  const cores = Number(navigator.hardwareConcurrency) || 8;
  const cap = memory >= 8 && cores >= 8 ? 2.25 : memory >= 4 && cores >= 4 ? 2 : 1.5;
  return Math.max(1, Math.min(Number(window.devicePixelRatio) || 1, cap));
}

function applyCanvasQuality(root = document) {
  const dpr = preferredDpr();
  root.querySelectorAll("[data-animation] canvas").forEach((canvas) => {
    if ((Number(canvas.dataset.animationDpr) || 0) < dpr) {
      canvas.dataset.animationDpr = String(dpr);
    }
  });
}

function ensureAwfulfaceFavicon(root = document) {
  const doc = root.nodeType === 9 ? root : root.ownerDocument || document;
  let icon = doc.head?.querySelector('link[rel~="icon"]');

  if (!icon) {
    icon = doc.createElement("link");
    icon.rel = "icon";
    doc.head?.append(icon);
  }

  if (icon.getAttribute("href") !== FAVICON_HREF) {
    icon.setAttribute("href", FAVICON_HREF);
  }
  icon.setAttribute("type", "image/svg+xml");
}

function repairJesteiProductTitle(root = document) {
  const title = root.querySelector(
    '#jestei-results [data-bento-card="products"] .jestei-bento__title',
  );
  if (!title) return;

  const expected = "расширили продуктовую линейку";
  if (normalize(title.textContent) !== expected) {
    title.textContent = expected;
  }
}

function placeJesteiWordsAfterBranding(root = document) {
  const words = root.getElementById?.("jestei-words");
  const anchor = root.getElementById?.("jestei-color") || root.getElementById?.("jestei-logo");
  if (!words || !anchor || anchor.nextElementSibling === words) return;

  anchor.insertAdjacentElement("afterend", words);
}

function repairJesteiProcess(root = document) {
  const card = root.querySelector('#jestei-results [data-bento-card="manual"]');
  if (!card) return;

  const scene = card.querySelector("#jestei-process-scene");
  const isHealthy =
    scene &&
    scene.dataset.processState !== "error" &&
    Number(scene.dataset.processFrame || 0) > 1;

  if (card === processCard && isHealthy) return;

  disposeProcessScene?.();
  disposeProcessScene = null;
  processCard = card;

  try {
    const disposers = mountJesteiProcessScene(root);
    if (Array.isArray(disposers)) {
      disposeProcessScene = () => disposers.forEach((dispose) => dispose?.());
    } else if (typeof disposers === "function") {
      disposeProcessScene = disposers;
    }
    card.dataset.processRepairMounted = "true";
  } catch (error) {
    card.dataset.processRepairMounted = "error";
    console.warn("[local-repairs] failed to remount Jestei process animation", error);
  }
}

function repairTariffs(root = document) {
  const section = root.getElementById("jestei-tariffs");
  if (!section) return;

  const title =
    section.querySelector("[data-chapter-head] [data-section-title]") ||
    section.querySelector("[data-section-title]");

  if (title) {
    const main = title.querySelector("[data-section-title-main]");
    const accent = title.querySelector("[data-section-title-accent]");
    if (main && accent) {
      main.textContent = "пересобрали";
      accent.textContent = "тарифные сценарии";
    } else if (normalize(title.textContent) !== "пересобрали тарифные сценарии") {
      title.textContent = "пересобрали тарифные сценарии";
    }
    title.setAttribute("aria-label", "пересобрали тарифные сценарии");
  }

  applyCanvasQuality(section);
  if (!tariffsMounted && section.querySelector('[data-animation="before-after"] canvas')) {
    tariffsMounted = true;
    initShowcaseBeforeAfter(section);
  }
}

function removeShootingsHeading(root = document) {
  const section = root.getElementById("shootings");
  if (!section) return;
  section.querySelectorAll("h1, h2, h3, [data-section-title]").forEach((heading) => {
    const text = normalize(heading.textContent);
    if (text === "творческие съёмки" || text === "творческие съемки") heading.remove();
  });
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

function repairStyx(root = document) {
  STYX_IDS.forEach((id) => {
    const section = root.getElementById(id);
    if (!section) return;
    reveal(section);
    section
      .querySelectorAll(
        "[data-section-screen], [data-chapter-head], [data-section-body], [data-section-media], [data-media-gallery], [data-animation], [data-scanography-videos]",
      )
      .forEach(reveal);
  });

  root.querySelectorAll("#styx-scanography [data-scanography-videos] video").forEach((video) => {
    Object.assign(video, {
      autoplay: true,
      loop: true,
      muted: true,
      defaultMuted: true,
      volume: 0,
      playsInline: true,
      preload: "auto",
    });
    ["autoplay", "loop", "muted", "playsinline", "webkit-playsinline"].forEach((name) =>
      video.setAttribute(name, ""),
    );
    video.setAttribute("preload", "auto");
    if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
    video.play()?.catch?.(() => {});
  });
}

function apply(root = document) {
  ensureAwfulfaceFavicon(root);
  applyCanvasQuality(root);
  repairJesteiProductTitle(root);
  placeJesteiWordsAfterBranding(root);
  repairJesteiProcess(root);
  repairTariffs(root);
  removeShootingsHeading(root);
  repairStyx(root);
}

function start() {
  DELAYS.forEach((delay) => window.setTimeout(() => apply(document), delay));
  window.addEventListener("load", () => apply(document), { once: true });
  window.addEventListener("pageshow", () => apply(document));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      repairJesteiProcess(document);
      repairStyx(document);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
