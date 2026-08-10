import { createCvAccordionScroll } from "./cv-accordion-scroll.js";
import { createCvAccordionRuntime } from "./cv-accordion-runtime.js";

const ACCORDION_DESTROY = Symbol.for("looksawful.cvAccordion.destroy");
const VALID_MODES = new Set(["scroll", "click", "static"]);
const VALID_REDUCED_MODES = new Set(["click", "static"]);
const noop = () => {};

function normalizeMode(value, fallback = "scroll") {
  return VALID_MODES.has(value) ? value : fallback;
}

function normalizeReducedMode(value, fallback = "click") {
  return VALID_REDUCED_MODES.has(value) ? value : fallback;
}

function readInitialIndex(value, count) {
  if (!value || value === "none") return -1;
  if (value === "first") return count > 0 ? 0 : -1;
  const index = Number.parseInt(String(value).split(",")[0].trim(), 10);
  return Number.isInteger(index) && index >= 0 && index < count ? index : -1;
}

function directElementChildren(element) {
  return Array.from(element.children).filter((child) => child instanceof HTMLElement);
}

function createRecord(item, index) {
  const header = item.firstElementChild;
  const panel = header?.nextElementSibling ?? null;
  if (!(header instanceof HTMLElement)) return null;
  if (panel && !(panel instanceof HTMLElement)) return null;
  if (panel && !(header instanceof HTMLButtonElement)) return null;
  return {
    index,
    item,
    header,
    panel,
    content: panel?.firstElementChild ?? panel,
    expandable: panel instanceof HTMLElement && header instanceof HTMLButtonElement,
    styleCache: new Map(),
    headerVisible: null,
  };
}

function setCachedStyle(record, property, value) {
  if (record.styleCache.get(property) === value) return false;
  record.styleCache.set(property, value);
  record.item.style.setProperty(property, value);
  return true;
}

export function createCvAccordion({ root = document, motion } = {}) {
  if (!root || typeof root.querySelector !== "function") return null;
  const scene = root.querySelector("[data-cv-accordion-scene]");
  if (!(scene instanceof HTMLElement)) return null;
  scene[ACCORDION_DESTROY]?.();

  const component = scene.querySelector("[data-cv-accordion]");
  const list = component?.querySelector("[data-cv-accordion-list]");
  if (!(component instanceof HTMLElement) || !(list instanceof HTMLElement)) return null;

  const records = directElementChildren(list).map(createRecord);
  if (records.length === 0 || records.some((record) => record === null)) return null;

  const requestedMode = normalizeMode(scene.dataset.mode, "scroll");
  const reducedMode = normalizeReducedMode(scene.dataset.reducedMode, "click");
  const initialIndex = readInitialIndex(scene.dataset.initial, records.length);
  const runtime = createCvAccordionRuntime({ records });
  const clickCleanups = [];
  let destroyed = false;
  let resolvedMode = null;
  let activeIndex = -1;
  let motionAllowed = typeof motion?.allowsMotion === "function" ? motion.allowsMotion() : false;
  let progressCache = "";

  function clearRuntimeStyles() {
    component.style.removeProperty("--cv-progress");
    progressCache = "";
    records.forEach((record) => {
      ["--cv-header-height", "--cv-header-presence", "--cv-panel-height", "--cv-panel-viewport-height", "--cv-open-progress", "--cv-content-offset"]
        .forEach((property) => record.item.style.removeProperty(property));
      record.styleCache.clear();
      record.item.removeAttribute("data-cv-header-visible");
      record.header.inert = false;
      record.headerVisible = null;
    });
  }

  function setExpanded(record, expanded, { hidePanel = false } = {}) {
    if (!record.expandable) return;
    if (record.header.getAttribute("aria-expanded") !== String(expanded)) {
      record.header.setAttribute("aria-expanded", String(expanded));
    }
    record.item.toggleAttribute("data-open", expanded);
    record.panel.inert = !expanded;
    if (hidePanel) record.panel.hidden = !expanded;
  }

  function commitActiveIndex(nextIndex, { hidePanel = false } = {}) {
    const normalized = Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < records.length ? nextIndex : -1;
    if (normalized === activeIndex) return;
    const previous = activeIndex;
    activeIndex = normalized;
    if (previous >= 0) setExpanded(records[previous], false, { hidePanel });
    if (activeIndex >= 0) setExpanded(records[activeIndex], true, { hidePanel });
    runtime.setActiveIndex(activeIndex);
  }

  function renderScrollFrame(frame) {
    const nextProgress = frame.progress.toFixed(4);
    if (progressCache !== nextProgress) {
      progressCache = nextProgress;
      component.style.setProperty("--cv-progress", nextProgress);
    }

    const frameTargets = new Set([frame.previousIndex, frame.nextIndex, activeIndex]);
    records.forEach((record, index) => {
      const activity = frame.activities[index] ?? 0;
      const headerPresence = frame.headerPresences[index] ?? 0;
      const headerVisible = headerPresence > 0.01;
      const values = [
        ["--cv-header-height", `${frame.headerSizes[index] ?? 0}px`],
        ["--cv-header-presence", headerPresence.toFixed(4)],
        ["--cv-panel-height", `${frame.panelHeights[index] ?? 0}px`],
        ["--cv-panel-viewport-height", `${frame.panelViewportSizes[index] ?? 0}px`],
        ["--cv-open-progress", activity.toFixed(4)],
        ["--cv-content-offset", `${frame.contentOffsets[index] ?? 0}px`],
      ];
      let changed = false;
      for (const [property, value] of values) changed = setCachedStyle(record, property, value) || changed;
      if (record.headerVisible !== headerVisible) {
        record.headerVisible = headerVisible;
        record.item.dataset.cvHeaderVisible = String(headerVisible);
        record.header.inert = !headerVisible;
        changed = true;
      }
      if (changed) frameTargets.add(index);
    });
    runtime.publishFrame(frame, [...frameTargets].filter((index) => index >= 0));
  }

  const scroll = createCvAccordionScroll({
    scene,
    component,
    list,
    records,
    runtime,
    onFrame: renderScrollFrame,
    onActiveIndexChange: (index) => commitActiveIndex(index, { hidePanel: false }),
  });
  if (!scroll) {
    runtime.destroy();
    return null;
  }

  function applyClickMode() {
    scroll.deactivate();
    clearRuntimeStyles();
    scene.dataset.resolvedMode = "click";
    scene.removeAttribute("data-mounted");
    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.header.disabled = false;
      record.header.inert = false;
      if (record.expandable) {
        record.panel.hidden = true;
        setExpanded(record, false, { hidePanel: true });
      }
    });
    activeIndex = -1;
    runtime.setActiveIndex(-1);
    if (initialIndex >= 0) commitActiveIndex(initialIndex, { hidePanel: true });
  }

  function applyStaticMode() {
    scroll.deactivate();
    clearRuntimeStyles();
    scene.dataset.resolvedMode = "static";
    scene.removeAttribute("data-mounted");
    activeIndex = -1;
    runtime.setActiveIndex(-1);
    records.forEach((record) => {
      if (!record.expandable) return;
      record.header.disabled = true;
      record.panel.hidden = false;
      setExpanded(record, true, { hidePanel: false });
    });
  }

  function applyScrollMode() {
    clearRuntimeStyles();
    activeIndex = -1;
    runtime.setActiveIndex(-1);
    scene.dataset.resolvedMode = "scroll";
    scene.dataset.mounted = "true";
    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.header.disabled = false;
      record.header.inert = false;
      if (!record.expandable) return;
      record.header.setAttribute("aria-expanded", "false");
      record.panel.hidden = false;
      record.panel.inert = true;
    });
    scroll.activate();
  }

  function resolveMode() {
    if (requestedMode === "static") return "static";
    if (requestedMode === "scroll" && !motionAllowed) return reducedMode;
    return requestedMode;
  }

  function applyResolvedMode() {
    const nextMode = resolveMode();
    if (nextMode === resolvedMode) return;
    resolvedMode = nextMode;
    runtime.setMode(resolvedMode);
    if (resolvedMode === "scroll") applyScrollMode();
    else if (resolvedMode === "click") applyClickMode();
    else applyStaticMode();
  }

  records.forEach((record) => {
    if (!record.expandable) return;
    const handleClick = () => {
      if (resolvedMode === "click") {
        commitActiveIndex(activeIndex === record.index ? -1 : record.index, { hidePanel: true });
        return;
      }
      if (resolvedMode === "scroll") {
        const behavior = motionAllowed ? "smooth" : "auto";
        if (activeIndex === record.index) scroll.scrollToStart({ behavior });
        else scroll.scrollToIndex(record.index, { behavior });
      }
    };
    record.header.addEventListener("click", handleClick);
    clickCleanups.push(() => record.header.removeEventListener("click", handleClick));
  });

  const unsubscribeMotion = typeof motion?.subscribe === "function"
    ? motion.subscribe(({ allowed } = {}) => {
        motionAllowed = allowed === true;
        applyResolvedMode();
      }, { immediate: false })
    : noop;

  applyResolvedMode();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    unsubscribeMotion();
    scroll.destroy();
    runtime.destroy();
    while (clickCleanups.length) clickCleanups.pop()?.();
    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.item.removeAttribute("data-cv-header-visible");
      record.header.disabled = false;
      record.header.inert = false;
      if (!record.expandable) return;
      record.header.setAttribute("aria-expanded", "false");
      record.panel.hidden = false;
      record.panel.inert = false;
    });
    scene.removeAttribute("data-resolved-mode");
    scene.removeAttribute("data-mounted");
    scene.style.removeProperty("--cv-scroll-runtime-size");
    clearRuntimeStyles();
    if (scene[ACCORDION_DESTROY] === destroy) delete scene[ACCORDION_DESTROY];
  };

  const api = Object.freeze({ runtime, destroy });
  scene[ACCORDION_DESTROY] = destroy;
  return api;
}
