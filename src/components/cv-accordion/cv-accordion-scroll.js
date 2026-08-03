import {
  clamp,
  computeAccordionFrame,
  createScrollMap,
} from "./cv-accordion-frame.js";

const VISIBLE_HEADER_COUNT = 3;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readCssLength(element, propertyName, fallback) {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();

  if (!value) {
    return fallback;
  }

  if (/^-?\d*\.?\d+px$/i.test(value)) {
    return toFiniteNumber(Number.parseFloat(value), fallback);
  }

  const probe = document.createElement("span");

  Object.assign(probe.style, {
    position: "absolute",
    inlineSize: "0",
    blockSize: value,
    visibility: "hidden",
    pointerEvents: "none",
  });

  element.append(probe);
  const pixels = probe.getBoundingClientRect().height;
  probe.remove();

  return pixels > 0 ? pixels : fallback;
}

function getActiveIndex(activities) {
  let activeIndex = -1;
  let strongestActivity = 0.001;

  activities.forEach((activity, index) => {
    if (activity > strongestActivity) {
      strongestActivity = activity;
      activeIndex = index;
    }
  });

  return activeIndex;
}

export function createCvAccordionScroll({
  scene,
  component,
  list,
  records,
  onFrame,
  onActiveIndexChange,
} = {}) {
  if (
    !(scene instanceof HTMLElement) ||
    !(component instanceof HTMLElement) ||
    !(list instanceof HTMLElement) ||
    !Array.isArray(records) ||
    records.length === 0
  ) {
    return null;
  }

  const resizeObserver = new ResizeObserver(() => {
    schedule(true);
  });

  let active = false;
  let destroyed = false;
  let frameId = 0;
  let needsMeasure = true;
  let geometry = null;
  let activeIndex = -1;

  function measure() {
    const itemCount = records.length;
    const listSize = Math.max(1, list.clientHeight);
    const componentSize = Math.max(1, component.getBoundingClientRect().height);
    const initialHeaderSize = listSize / itemCount;
    const desiredCompactHeaderSize = readCssLength(
      scene,
      "--cv-compact-header-size",
      54,
    );
    const minimumPanelSize = readCssLength(scene, "--cv-min-panel-size", 140);
    const maximumVisibleHeaderCount = Math.min(
      VISIBLE_HEADER_COUNT,
      itemCount,
    );
    const maximumCompactHeaderSize = Math.max(
      42,
      (listSize - minimumPanelSize) / maximumVisibleHeaderCount,
    );
    const compactHeaderSize = Math.min(
      initialHeaderSize,
      desiredCompactHeaderSize,
      maximumCompactHeaderSize,
    );
    const panelViewportSizes = records.map((_, index) => {
      const visibleHeaderCount = Math.min(
        VISIBLE_HEADER_COUNT,
        itemCount - index,
      );

      return Math.max(
        0,
        listSize - compactHeaderSize * visibleHeaderCount,
      );
    });

    records.forEach(({ item }, index) => {
      item.style.setProperty("--cv-header-height", `${compactHeaderSize}px`);
      item.style.setProperty(
        "--cv-panel-viewport-height",
        `${panelViewportSizes[index]}px`,
      );
    });

    const contentTravels = records.map(({ item, panel, content }, index) => {
      if (!(panel instanceof HTMLElement) || !(content instanceof HTMLElement)) {
        return 0;
      }

      const scrollOwner = item.querySelector("[data-cv-scroll-owner]");
      const scrollTrack = scrollOwner?.querySelector("[data-cv-scroll-track]");

      if (
        scrollOwner instanceof HTMLElement &&
        scrollTrack instanceof HTMLElement
      ) {
        const multiplier = Number.parseFloat(
          scrollOwner.dataset.cvScrollScreens ?? "4.5",
        );
        const screenMultiplier =
          Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 4.5;
        const physicalTravel = Math.max(
          0,
          scrollTrack.scrollHeight - panelViewportSizes[index],
        );

        return Math.max(
          componentSize * screenMultiplier,
          physicalTravel,
          componentSize,
        );
      }

      return Math.max(0, content.scrollHeight - panelViewportSizes[index]);
    });
    const baseDistance = readCssLength(
      scene,
      "--cv-scroll-distance",
      window.innerHeight * 7.2,
    );
    const map = createScrollMap({
      count: itemCount,
      baseDistance,
      contentTravels,
    });
    const sceneRect = scene.getBoundingClientRect();

    geometry = {
      listSize,
      initialHeaderSize,
      compactHeaderSize,
      panelViewportSizes,
      map,
      sceneStart: sceneRect.top + window.scrollY,
    };

    scene.style.setProperty(
      "--cv-scroll-runtime-size",
      `${componentSize + map.totalDistance}px`,
    );

    needsMeasure = false;
  }

  function render() {
    frameId = 0;

    if (!active || destroyed) {
      return;
    }

    if (needsMeasure || !geometry) {
      measure();
    }

    const offset = clamp(
      window.scrollY - geometry.sceneStart,
      0,
      geometry.map.totalDistance,
    );
    const frame = computeAccordionFrame({
      offset,
      map: geometry.map,
      listSize: geometry.listSize,
      initialHeaderSize: geometry.initialHeaderSize,
      compactHeaderSize: geometry.compactHeaderSize,
      panelViewportSizes: geometry.panelViewportSizes,
      visibleHeaderCount: VISIBLE_HEADER_COUNT,
    });
    const nextActiveIndex = getActiveIndex(frame.activities);

    onFrame?.(frame);

    if (nextActiveIndex !== activeIndex) {
      activeIndex = nextActiveIndex;
      onActiveIndexChange?.(activeIndex);
    }
  }

  function schedule(remeasure = false) {
    if (!active || destroyed) {
      return;
    }

    needsMeasure ||= remeasure;

    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(render);
  }

  function handleScroll() {
    schedule(false);
  }

  function handleResize() {
    schedule(true);
  }

  function activate() {
    if (active || destroyed) {
      return;
    }

    active = true;
    activeIndex = -1;
    needsMeasure = true;

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    resizeObserver.observe(component);
    records.forEach(({ item, content }) => {
      if (content instanceof HTMLElement) {
        resizeObserver.observe(content);
      }

      item.querySelectorAll("[data-cv-scroll-track]").forEach((track) => {
        if (track instanceof HTMLElement) {
          resizeObserver.observe(track);
        }
      });
    });

    render();

    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (active && !destroyed) {
          schedule(true);
        }
      });
    }
  }

  function deactivate() {
    if (!active) {
      return;
    }

    active = false;
    activeIndex = -1;
    geometry = null;
    needsMeasure = true;

    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
    window.visualViewport?.removeEventListener("resize", handleResize);

    resizeObserver.disconnect();
    scene.style.removeProperty("--cv-scroll-runtime-size");
  }

  function scrollToIndex(index, { behavior = "smooth" } = {}) {
    if (!active || destroyed) {
      return;
    }

    if (needsMeasure || !geometry) {
      measure();
    }

    const anchor = geometry.map.anchors[index];

    if (!Number.isFinite(anchor)) {
      return;
    }

    window.scrollTo({
      top: geometry.sceneStart + anchor,
      behavior,
    });
  }

  function scrollToStart({ behavior = "smooth" } = {}) {
    if (!active || destroyed) {
      return;
    }

    if (needsMeasure || !geometry) {
      measure();
    }

    window.scrollTo({
      top: geometry.sceneStart,
      behavior,
    });
  }

  function rebuild() {
    schedule(true);
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    deactivate();
    destroyed = true;
  }

  return Object.freeze({
    activate,
    deactivate,
    rebuild,
    scrollToIndex,
    scrollToStart,
    destroy,
  });
}
