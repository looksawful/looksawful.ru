import { createCvAccordionScroll } from "./cv-accordion-scroll.js";

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

function readInitialIndexes(value, count, multiple) {
  if (!value || value === "none") {
    return [];
  }

  if (value === "first") {
    return count > 0 ? [0] : [];
  }

  const indexes = String(value)
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < count);

  return multiple ? [...new Set(indexes)] : indexes.slice(0, 1);
}

function directElementChildren(element) {
  return Array.from(element.children).filter(
    (child) => child instanceof HTMLElement,
  );
}

function createRecord(item, index) {
  const header = item.firstElementChild;
  const panel = header?.nextElementSibling ?? null;

  if (!(header instanceof HTMLElement)) {
    return null;
  }

  if (panel && !(panel instanceof HTMLElement)) {
    return null;
  }

  if (panel && !(header instanceof HTMLButtonElement)) {
    return null;
  }

  return {
    index,
    item,
    header,
    panel,
    content: panel?.firstElementChild ?? panel,
    expandable: panel instanceof HTMLElement && header instanceof HTMLButtonElement,
  };
}

export function createCvAccordion({ root = document, motion } = {}) {
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }

  const scene = root.querySelector("[data-cv-accordion-scene]");

  if (!(scene instanceof HTMLElement)) {
    return null;
  }

  scene[ACCORDION_DESTROY]?.();

  const component = scene.querySelector("[data-cv-accordion]");
  const list = component?.querySelector("[data-cv-accordion-list]");

  if (!(component instanceof HTMLElement) || !(list instanceof HTMLElement)) {
    return null;
  }

  const records = directElementChildren(list).map(createRecord);

  if (records.length === 0 || records.some((record) => record === null)) {
    return null;
  }

  const requestedMode = normalizeMode(scene.dataset.mode, "scroll");
  const reducedMode = normalizeReducedMode(scene.dataset.reducedMode, "click");
  const multiple = scene.hasAttribute("data-multiple");
  const initialIndexes = readInitialIndexes(
    scene.dataset.initial,
    records.length,
    multiple,
  );
  const clickCleanups = [];
  const openIndexes = new Set();

  let destroyed = false;
  let resolvedMode = null;
  let scrollActiveIndex = -1;
  let motionAllowed =
    typeof motion?.allowsMotion === "function" ? motion.allowsMotion() : false;

  function clearRuntimeStyles() {
    component.style.removeProperty("--cv-progress");

    records.forEach(({ item, header }) => {
      item.style.removeProperty("--cv-header-height");
      item.style.removeProperty("--cv-header-presence");
      item.style.removeProperty("--cv-panel-height");
      item.style.removeProperty("--cv-panel-viewport-height");
      item.style.removeProperty("--cv-open-progress");
      item.style.removeProperty("--cv-content-offset");
      item.removeAttribute("data-cv-header-visible");
      header.inert = false;
    });
  }

  function setExpanded(record, expanded, { hidePanel } = {}) {
    if (!record.expandable) {
      return;
    }

    record.item.toggleAttribute("data-open", expanded);
    record.header.setAttribute("aria-expanded", String(expanded));
    record.panel.inert = !expanded;

    if (typeof hidePanel === "boolean") {
      record.panel.hidden = hidePanel && !expanded;
    }
  }

  function closeClickRecord(record) {
    openIndexes.delete(record.index);
    setExpanded(record, false, { hidePanel: true });
  }

  function openClickRecord(record) {
    if (!multiple) {
      records.forEach((candidate) => {
        if (candidate !== record && candidate.expandable) {
          closeClickRecord(candidate);
        }
      });
    }

    openIndexes.add(record.index);
    setExpanded(record, true, { hidePanel: true });
  }

  function toggleClickRecord(record) {
    if (openIndexes.has(record.index)) {
      closeClickRecord(record);
    } else {
      openClickRecord(record);
    }
  }

  function setScrollActiveIndex(index) {
    if (scrollActiveIndex === index) {
      return;
    }

    scrollActiveIndex = index;

    records.forEach((record) => {
      if (record.expandable) {
        setExpanded(record, record.index === scrollActiveIndex, {
          hidePanel: false,
        });
      }
    });
  }

  function renderScrollFrame(frame) {
    component.style.setProperty("--cv-progress", frame.progress.toFixed(4));

    records.forEach(({ item, header }, index) => {
      const activity = frame.activities[index] ?? 0;
      const contentOffset = frame.contentOffsets[index] ?? 0;
      const headerPresence = frame.headerPresences[index] ?? 0;
      const headerVisible = headerPresence > 0.01;

      item.style.setProperty(
        "--cv-header-height",
        `${frame.headerSizes[index] ?? 0}px`,
      );
      item.style.setProperty(
        "--cv-header-presence",
        headerPresence.toFixed(4),
      );
      item.style.setProperty(
        "--cv-panel-height",
        `${frame.panelHeights[index] ?? 0}px`,
      );
      item.style.setProperty(
        "--cv-panel-viewport-height",
        `${frame.panelViewportSizes[index] ?? 0}px`,
      );
      item.style.setProperty("--cv-open-progress", activity.toFixed(4));
      item.style.setProperty("--cv-content-offset", `${contentOffset}px`);
      item.dataset.cvHeaderVisible = String(headerVisible);
      header.inert = !headerVisible;
    });

    component.dispatchEvent(
      new CustomEvent("cvaccordionframe", {
        detail: { frame },
      }),
    );
  }

  const scroll = createCvAccordionScroll({
    scene,
    component,
    list,
    records,
    onFrame: renderScrollFrame,
    onActiveIndexChange: setScrollActiveIndex,
  });

  if (!scroll) {
    return null;
  }

  function applyClickMode() {
    scroll.deactivate();
    clearRuntimeStyles();

    openIndexes.clear();
    scrollActiveIndex = -1;

    scene.dataset.resolvedMode = "click";
    scene.removeAttribute("data-mounted");

    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.item.removeAttribute("data-cv-header-visible");
      record.header.inert = false;

      if (!record.expandable) {
        return;
      }

      record.header.disabled = false;
      setExpanded(record, false, { hidePanel: true });
    });

    initialIndexes.forEach((index) => {
      const record = records[index];

      if (record?.expandable) {
        openClickRecord(record);
      }
    });
  }

  function applyStaticMode() {
    scroll.deactivate();
    clearRuntimeStyles();

    openIndexes.clear();
    scrollActiveIndex = -1;

    scene.dataset.resolvedMode = "static";
    scene.removeAttribute("data-mounted");

    records.forEach((record) => {
      if (!record.expandable) {
        return;
      }

      record.header.disabled = true;
      record.panel.hidden = false;
      setExpanded(record, true, { hidePanel: false });
    });
  }

  function applyScrollMode() {
    clearRuntimeStyles();

    openIndexes.clear();
    scrollActiveIndex = -1;

    scene.dataset.resolvedMode = "scroll";
    scene.dataset.mounted = "true";

    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.item.removeAttribute("data-cv-header-visible");
      record.header.inert = false;

      if (!record.expandable) {
        return;
      }

      record.header.disabled = false;
      record.header.inert = false;
      record.header.setAttribute("aria-expanded", "false");
      record.panel.hidden = false;
      record.panel.inert = true;
    });

    scroll.activate();
  }

  function resolveMode() {
    if (requestedMode === "static") {
      return "static";
    }

    if (requestedMode === "scroll" && !motionAllowed) {
      return reducedMode;
    }

    return requestedMode;
  }

  function applyResolvedMode() {
    const nextMode = resolveMode();

    if (nextMode === resolvedMode) {
      return;
    }

    resolvedMode = nextMode;

    if (resolvedMode === "scroll") {
      applyScrollMode();
    } else if (resolvedMode === "click") {
      applyClickMode();
    } else {
      applyStaticMode();
    }
  }

  records.forEach((record) => {
    if (!record.expandable) {
      return;
    }

    const handleClick = () => {
      if (resolvedMode === "click") {
        toggleClickRecord(record);
        return;
      }

      if (resolvedMode === "scroll") {
        const behavior = motionAllowed ? "smooth" : "auto";

        if (scrollActiveIndex === record.index) {
          scroll.scrollToStart({ behavior });
        } else {
          scroll.scrollToIndex(record.index, { behavior });
        }
      }
    };

    record.header.addEventListener("click", handleClick);
    clickCleanups.push(() => record.header.removeEventListener("click", handleClick));
  });

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(
          ({ allowed } = {}) => {
            motionAllowed = allowed === true;
            applyResolvedMode();
          },
          { immediate: false },
        )
      : noop;

  applyResolvedMode();

  const destroyCvAccordion = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    unsubscribeMotion();
    scroll.destroy();

    while (clickCleanups.length) {
      clickCleanups.pop()?.();
    }

    records.forEach((record) => {
      record.item.removeAttribute("data-open");
      record.item.removeAttribute("data-cv-header-visible");
      record.header.inert = false;

      if (!record.expandable) {
        return;
      }

      record.header.disabled = false;
      record.header.inert = false;
      record.header.setAttribute("aria-expanded", "false");
      record.panel.hidden = false;
      record.panel.inert = false;
    });

    scene.removeAttribute("data-resolved-mode");
    scene.removeAttribute("data-mounted");
    scene.style.removeProperty("--cv-scroll-runtime-size");

    clearRuntimeStyles();

    if (scene[ACCORDION_DESTROY] === destroyCvAccordion) {
      delete scene[ACCORDION_DESTROY];
    }
  };

  scene[ACCORDION_DESTROY] = destroyCvAccordion;

  return destroyCvAccordion;
}
