const DIGITAL_GALLERY_DESTROY = Symbol.for(
  "looksawful.digitalScrollGallery.destroy",
);

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function directCvItems(list) {
  return Array.from(list?.children ?? []).filter(
    (item) => item instanceof HTMLElement && item.matches(".cv-item"),
  );
}

function readScreenMultiplier(element) {
  const value = Number.parseFloat(element.dataset.cvScrollScreens ?? "4.5");
  return Number.isFinite(value) && value > 0 ? value : 4.5;
}

export function createDigitalScrollGallery(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  element[DIGITAL_GALLERY_DESTROY]?.();

  const track = element.querySelector("[data-gallery-track]");
  const item = element.closest(".cv-item");
  const accordion = element.closest("[data-cv-accordion]");
  const list = accordion?.querySelector("[data-cv-accordion-list]");

  if (
    !(track instanceof HTMLElement) ||
    !(item instanceof HTMLElement) ||
    !(accordion instanceof HTMLElement) ||
    !(list instanceof HTMLElement)
  ) {
    return null;
  }

  const itemIndex = directCvItems(list).indexOf(item);

  if (itemIndex < 0) {
    return null;
  }

  const screenMultiplier = readScreenMultiplier(element);
  let destroyed = false;
  let latestFrame = null;
  let frameId = 0;

  function render() {
    frameId = 0;

    if (destroyed) {
      return;
    }

    const frame = latestFrame;
    const resolvedMode = element
      .closest("[data-cv-accordion-scene]")
      ?.dataset.resolvedMode;

    if (resolvedMode !== "scroll" || !frame) {
      track.style.removeProperty("transform");
      element.style.removeProperty("--digital-gallery-progress");
      element.removeAttribute("data-active");
      return;
    }

    const panelViewportSize = Math.max(
      1,
      Number(frame.panelViewportSizes?.[itemIndex]) || element.clientHeight || 1,
    );
    const viewportSize = Math.max(
      1,
      accordion.getBoundingClientRect().height || window.innerHeight,
    );
    const physicalTravel = Math.max(
      0,
      track.scrollHeight - panelViewportSize,
    );
    const scrollDistance = Math.max(
      viewportSize * screenMultiplier,
      physicalTravel,
      viewportSize,
    );
    const contentOffset = Number(frame.contentOffsets?.[itemIndex] ?? 0);
    const progress = clamp(contentOffset / scrollDistance);

    track.style.transform = `translate3d(0, ${
      -physicalTravel * progress
    }px, 0)`;
    element.style.setProperty(
      "--digital-gallery-progress",
      progress.toFixed(4),
    );
    element.toggleAttribute("data-active", progress > 0 && progress < 1);
  }

  function schedule() {
    if (!frameId) {
      frameId = requestAnimationFrame(render);
    }
  }

  function handleFrame(event) {
    latestFrame = event.detail?.frame ?? null;
    schedule();
  }

  const resizeObserver = new ResizeObserver(schedule);

  accordion.addEventListener("cvaccordionframe", handleFrame);
  resizeObserver.observe(element);
  resizeObserver.observe(track);
  schedule();

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    resizeObserver.disconnect();
    accordion.removeEventListener("cvaccordionframe", handleFrame);

    if (frameId) {
      cancelAnimationFrame(frameId);
    }

    track.style.removeProperty("transform");
    element.style.removeProperty("--digital-gallery-progress");
    element.removeAttribute("data-active");

    if (element[DIGITAL_GALLERY_DESTROY] === destroy) {
      delete element[DIGITAL_GALLERY_DESTROY];
    }
  };

  element[DIGITAL_GALLERY_DESTROY] = destroy;
  return destroy;
}

export function createDigitalScrollGalleries({ root = document } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return () => {};
  }

  const destroys = Array.from(
    root.querySelectorAll("[data-digital-scroll-gallery]"),
    (element) => createDigitalScrollGallery(element),
  ).filter(Boolean);

  return () => {
    while (destroys.length) {
      destroys.pop()?.();
    }
  };
}
