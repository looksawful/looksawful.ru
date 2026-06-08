import { initCvScrollRows } from "../../visuals/dom/cv-scroll-row.js";
import { initCvMediaScenes } from "../../visuals/dom/cv-media-scenes.js";
import { observeOnceVisible } from "./observer.js";
import {
  LOGO_INSPECTOR_MODEL_URL,
  loadAnimationMount,
  loadCanvasDemoMount,
  loadThreeDemoMount,
} from "./cv-visual-registry.js";

const mountedAnimations = new WeakMap();
const mountedSliders = new WeakMap();
const mountedVisualDemos = new WeakMap();

const noop = () => {};

function normalizeDispose(dispose) {
  if (typeof dispose === "function") {
    return dispose;
  }

  if (typeof dispose?.dispose === "function") {
    return () => dispose.dispose();
  }

  return noop;
}

function getDemoParts(target) {
  return target.dataset.cvVisualDemo?.split(":") ?? [];
}

async function mountThreeDemo(canvas) {
  const [, sceneName] = getDemoParts(canvas);
  const loadMount = loadThreeDemoMount(sceneName);

  if (!loadMount) {
    return noop;
  }

  canvas.dataset.threeScene = sceneName;

  const mount = await loadMount;
  const dispose = mount(canvas);

  return normalizeDispose(dispose);
}

async function mountCanvasDemo(canvas) {
  const [, demoName] = getDemoParts(canvas);
  const loadMount = loadCanvasDemoMount(demoName);

  if (!loadMount) {
    return noop;
  }

  const mount = await loadMount;
  const dispose = await mount(canvas.id);

  return normalizeDispose(dispose);
}

async function mountLogoInspector(target) {
  const { createLogoInspector3D } = await import("../cv-task-previews/logo-inspector-3d.js");
  const controller = createLogoInspector3D(target, {
    modelUrl: LOGO_INSPECTOR_MODEL_URL,
    minHeight: target.dataset.cvMinHeight ? Number(target.dataset.cvMinHeight) : 560,
    initialVariantId: target.dataset.cvVariant || "brand-orange",
    autoSpin: target.dataset.cvAutoSpin !== "false",
  });

  return normalizeDispose(controller);
}

async function mountNewsletterCanvas(target) {
  const { createNewsletterCanvas } = await import("../cv-task-previews/newsletter-canvas.js");
  const sources = JSON.parse(target.dataset.cvNewsletterSources || "[]");
  const controller = createNewsletterCanvas(target, {
    src: sources,
    alt: target.dataset.cvAlt || "Newsletter canvas",
    minHeight: target.dataset.cvMinHeight ? Number(target.dataset.cvMinHeight) : 560,
  });

  return normalizeDispose(controller);
}

async function mountVisualDemo(target) {
  if (mountedVisualDemos.has(target)) {
    return noop;
  }

  mountedVisualDemos.set(target, noop);

  const [type] = getDemoParts(target);
  let dispose = noop;

  if (type === "three" && target instanceof HTMLCanvasElement) {
    dispose = await mountThreeDemo(target);
  } else if (type === "canvas" && target instanceof HTMLCanvasElement) {
    dispose = await mountCanvasDemo(target);
  } else if (type === "logo-inspector" && target instanceof HTMLElement) {
    dispose = await mountLogoInspector(target);
  } else if (type === "newsletter-canvas" && target instanceof HTMLElement) {
    dispose = await mountNewsletterCanvas(target);
  }

  mountedVisualDemos.set(target, dispose);
  return dispose;
}

async function safeMountVisualDemo(target) {
  try {
    return await mountVisualDemo(target);
  } catch (error) {
    mountedVisualDemos.delete(target);
    console.error("[cv-visuals] failed to mount visual demo", error);
    return noop;
  }
}

async function mountAnimationPreview(preview) {
  if (mountedAnimations.has(preview)) {
    return;
  }

  const animationType = preview.dataset.cvAnimation;
  const loadMount = loadAnimationMount(animationType);
  const canvas = preview.querySelector(".cv-canvas");

  if (!(canvas instanceof HTMLCanvasElement) || !loadMount) {
    return;
  }

  mountedAnimations.set(preview, noop);

  try {
    const mount = await loadMount;
    const dispose = await mount(canvas.id, {
      scene: canvas.dataset.cvAnimationScene,
      variant: canvas.dataset.cvAnimationVariant,
    });

    mountedAnimations.set(preview, normalizeDispose(dispose));
  } catch (error) {
    mountedAnimations.delete(preview);
    console.error(`[cv-visuals] failed to mount animation "${animationType}"`, error);
  }
}

function initPreviewSlider(slider) {
  if (!(slider instanceof HTMLElement) || mountedSliders.has(slider)) {
    return noop;
  }

  const track = slider.querySelector(".cv-preview-row--slider");
  const prev = slider.querySelector("[data-cv-slider-prev]");
  const next = slider.querySelector("[data-cv-slider-next]");

  if (!(track instanceof HTMLElement)) {
    return noop;
  }

  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;

  const getStep = () => {
    const item = track.querySelector(".cv-preview");
    const itemWidth = item instanceof HTMLElement ? item.getBoundingClientRect().width : track.clientWidth * 0.8;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0") || 0;
    return itemWidth + gap;
  };

  const scrollByStep = (direction) => {
    track.scrollBy({ left: getStep() * direction, behavior: "smooth" });
  };

  const onPointerDown = (event) => {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScrollLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();
    track.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
  };

  const onPointerUp = (event) => {
    isDragging = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
  };

  const onPrev = () => scrollByStep(-1);
  const onNext = () => scrollByStep(1);

  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove, { passive: false });
  track.addEventListener("pointerup", onPointerUp);
  track.addEventListener("pointercancel", onPointerUp);
  track.addEventListener("pointerleave", onPointerUp);

  const dispose = () => {
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
    track.removeEventListener("pointerdown", onPointerDown);
    track.removeEventListener("pointermove", onPointerMove);
    track.removeEventListener("pointerup", onPointerUp);
    track.removeEventListener("pointercancel", onPointerUp);
    track.removeEventListener("pointerleave", onPointerUp);
    mountedSliders.delete(slider);
  };

  mountedSliders.set(slider, dispose);
  return dispose;
}

export async function initCvVisuals(root = document) {
  initCvMediaScenes(typeof root !== "undefined" ? root : document);
  initCvScrollRows(typeof root !== "undefined" ? root : document);
  const visualTargets = [...root.querySelectorAll("[data-cv-visual-demo]")];
  const animationPreviews = [...root.querySelectorAll("[data-cv-animation]")];
  const sliders = [...root.querySelectorAll("[data-cv-preview-slider]")];

  const sliderDisposers = sliders.map(initPreviewSlider);

  const stopAnimationObserver =
    observeOnceVisible(
      animationPreviews,
      (preview) => {
        void mountAnimationPreview(preview);
      },
      {
        rootMargin: "70% 0px",
        threshold: 0,
      },
    ) || noop;

  const stopVisualObserver =
    observeOnceVisible(
      visualTargets,
      (target) => {
        void safeMountVisualDemo(target);
      },
      {
        rootMargin: '60% 0px',
        threshold: 0,
      },
    ) || noop;

  return () => {
    stopAnimationObserver();
    stopVisualObserver();
    animationPreviews.forEach((preview) => {
      mountedAnimations.get(preview)?.();
      mountedAnimations.delete(preview);
    });
    visualTargets.forEach((target) => {
      mountedVisualDemos.get(target)?.();
      mountedVisualDemos.delete(target);
    });
    sliderDisposers.forEach((dispose) => dispose());
  };
}

