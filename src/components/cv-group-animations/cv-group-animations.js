import { observeOnceVisible } from "../../lab/shared/observer.js";

const ANIMATION_MOUNTERS = {
  arc: () => import("../../lab/canvas/arc/index.js").then((module) => module.mountArc),
  carousel: () => import("../../lab/canvas/cv-carousel/index.js").then((module) => module.mountCvCarousel),
  diagonal: () => import("../../lab/canvas/cv-diagonal/index.js").then((module) => module.mountCvDiagonal),
  horizontal: () => import("../../lab/canvas/cv-horizontal/index.js").then((module) => module.mountCvHorizontal),
  masonry: () => import("../../lab/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../lab/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

const mountedPreviews = new WeakMap();
const mountedSliders = new WeakMap();

const normalizeDispose = (dispose) => {
  if (typeof dispose === "function") {
    return dispose;
  }

  if (typeof dispose?.dispose === "function") {
    return () => dispose.dispose();
  }

  return () => {};
};

async function mountPreview(preview) {
  if (mountedPreviews.has(preview)) {
    return;
  }

  const animationType = preview.dataset.cvAnimation;
  const loadMount = ANIMATION_MOUNTERS[animationType];
  const canvas = preview.querySelector(".cv-canvas");

  if (!(canvas instanceof HTMLCanvasElement) || !loadMount) {
    return;
  }

  mountedPreviews.set(preview, () => {});

  try {
    const mount = await loadMount();
    const dispose = await mount(canvas.id, {
      scene: canvas.dataset.cvAnimationScene,
      variant: canvas.dataset.cvAnimationVariant,
    });

    mountedPreviews.set(preview, normalizeDispose(dispose));
  } catch (error) {
    mountedPreviews.delete(preview);
    console.error(`[cv-group-animations] failed to mount "${animationType}"`, error);
  }
}

function initPreviewSlider(slider) {
  if (!(slider instanceof HTMLElement) || mountedSliders.has(slider)) {
    return () => {};
  }

  const track = slider.querySelector(".cv-preview-row--slider");
  const prev = slider.querySelector("[data-cv-slider-prev]");
  const next = slider.querySelector("[data-cv-slider-next]");

  if (!(track instanceof HTMLElement)) {
    return () => {};
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

export function initCvGroupAnimations(root = document) {
  const previews = [...root.querySelectorAll("[data-cv-animation]")];
  const sliders = [...root.querySelectorAll("[data-cv-preview-slider]")];
  const sliderDisposers = sliders.map(initPreviewSlider);

  observeOnceVisible(
    previews,
    (preview) => {
      void mountPreview(preview);
    },
    {
      rootMargin: "70% 0px",
      threshold: 0,
    },
  );

  return () => {
    previews.forEach((preview) => {
      mountedPreviews.get(preview)?.();
      mountedPreviews.delete(preview);
    });
    sliderDisposers.forEach((dispose) => dispose());
  };
}
