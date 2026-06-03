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

export function initCvGroupAnimations(root = document) {
  const previews = [...root.querySelectorAll("[data-cv-animation]")];

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
  };
}
