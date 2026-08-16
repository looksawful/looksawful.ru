const DIGITAL_GALLERY_DESTROY = Symbol.for(
  "looksawful.digitalScrollGallery.destroy",
);

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function readScreenMultiplier(element) {
  const value = Number.parseFloat(element.dataset.cvScrollScreens ?? "4.5");
  return Number.isFinite(value) && value > 0 ? value : 4.5;
}

export function createDigitalScrollGallery(element, { sceneRuntime } = {}) {
  if (!(element instanceof HTMLElement)) return null;
  element[DIGITAL_GALLERY_DESTROY]?.();

  const track = element.querySelector("[data-gallery-track]");
  const accordion = element.closest("[data-cv-sheets]");
  if (!(track instanceof HTMLElement) || !(accordion instanceof HTMLElement)) return null;

  const itemIndex = sceneRuntime?.indexForElement?.(element) ?? -1;
  if (itemIndex < 0) return null;

  const screenMultiplier = readScreenMultiplier(element);
  const resizeObserver = new ResizeObserver(measure);
  let destroyed = false;
  let sceneActive = false;
  let panelViewportSize = 1;
  let viewportSize = 1;
  let physicalTravel = 0;
  let scrollDistance = 1;
  let lastProgress = -1;

  function measure() {
    if (destroyed || !sceneActive) return;
    panelViewportSize = Math.max(1, element.clientHeight || 1);
    viewportSize = Math.max(1, accordion.getBoundingClientRect().height || window.innerHeight);
    physicalTravel = Math.max(0, track.scrollHeight - panelViewportSize);
    scrollDistance = Math.max(viewportSize * screenMultiplier, physicalTravel, viewportSize);
  }

  function renderFrame(frame, index) {
    if (destroyed || !sceneActive || index !== itemIndex) return;
    const nextPanelViewport = Math.max(1, Number(frame.panelViewportSizes?.[itemIndex]) || panelViewportSize);
    if (Math.abs(nextPanelViewport - panelViewportSize) > 0.5) {
      panelViewportSize = nextPanelViewport;
      physicalTravel = Math.max(0, track.scrollHeight - panelViewportSize);
      scrollDistance = Math.max(viewportSize * screenMultiplier, physicalTravel, viewportSize);
    }
    const contentOffset = Number(frame.contentOffsets?.[itemIndex] ?? 0);
    const progress = clamp(contentOffset / scrollDistance);
    const rounded = Number(progress.toFixed(4));
    if (rounded === lastProgress) return;
    lastProgress = rounded;
    track.style.transform = `translate3d(0, ${-physicalTravel * progress}px, 0)`;
    element.style.setProperty("--digital-gallery-progress", rounded.toFixed(4));
    element.toggleAttribute("data-active", progress > 0 && progress < 1);
  }

  const unsubscribeScene = sceneRuntime.subscribeScene(itemIndex, ({ active }) => {
    if (sceneActive === active) return;
    sceneActive = active;
    lastProgress = -1;
    resizeObserver.disconnect();
    if (sceneActive) {
      resizeObserver.observe(element);
      resizeObserver.observe(track);
      measure();
    } else {
      track.style.removeProperty("transform");
      element.style.removeProperty("--digital-gallery-progress");
      element.removeAttribute("data-active");
    }
  });
  const unsubscribeFrame = sceneRuntime.subscribeFrame(itemIndex, renderFrame);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    resizeObserver.disconnect();
    unsubscribeScene();
    unsubscribeFrame();
    track.style.removeProperty("transform");
    element.style.removeProperty("--digital-gallery-progress");
    element.removeAttribute("data-active");
    if (element[DIGITAL_GALLERY_DESTROY] === destroy) delete element[DIGITAL_GALLERY_DESTROY];
  };

  element[DIGITAL_GALLERY_DESTROY] = destroy;
  return destroy;
}

export function createDigitalScrollGalleries({ root = document, sceneRuntime } = {}) {
  if (!root || typeof root.querySelectorAll !== "function" || !sceneRuntime) return () => {};
  const destroys = Array.from(
    root.querySelectorAll("[data-digital-scroll-gallery]"),
    (element) => createDigitalScrollGallery(element, { sceneRuntime }),
  ).filter(Boolean);
  return () => {
    while (destroys.length) destroys.pop()?.();
  };
}
