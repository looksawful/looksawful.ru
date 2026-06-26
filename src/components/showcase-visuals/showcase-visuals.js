import { observeOnceVisible } from "./observer.js";
import {
  LOGO_INSPECTOR_MODEL_URL,
  loadAnimationMount,
  loadThreeDemoMount,
} from "./showcase-visual-registry.js";

const mountedAnimations = new WeakMap();
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
  return target.dataset.visualDemo?.split(":") ?? [];
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

async function mountLogoInspector(target) {
  const { createLogoInspector3D } = await import("../showcase-task-previews/logo-inspector-3d.js");
  const controller = createLogoInspector3D(target, {
    modelUrl: LOGO_INSPECTOR_MODEL_URL,
    minHeight: target.dataset.cvMinHeight ? Number(target.dataset.cvMinHeight) : 560,
    initialVariantId: target.dataset.cvVariant || "brand-orange",
    autoSpin: target.dataset.cvAutoSpin !== "false",
    assets: {
      poster: target.dataset.cvPoster || undefined,
    },
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
  } else if (type === "logo-inspector" && target instanceof HTMLElement) {
    dispose = await mountLogoInspector(target);
  }

  mountedVisualDemos.set(target, dispose);
  return dispose;
}

async function safeMountVisualDemo(target) {
  try {
    return await mountVisualDemo(target);
  } catch (error) {
    mountedVisualDemos.delete(target);
    console.error("[showcase-visuals] failed to mount visual demo", error);
    return noop;
  }
}

async function mountAnimationPreview(preview) {
  if (mountedAnimations.has(preview)) {
    return;
  }

  const animationType = preview.dataset.animation;
  const loadMount = loadAnimationMount(animationType);
  const canvas = preview.querySelector(".visual-canvas");

  if (!(canvas instanceof HTMLCanvasElement) || !loadMount) {
    return;
  }

  mountedAnimations.set(preview, noop);

  try {
    const mount = await loadMount;
    const dispose = await mount(canvas.id, {
      scene: canvas.dataset.animationScene,
      variant: canvas.dataset.animationVariant,
    });

    mountedAnimations.set(preview, normalizeDispose(dispose));
  } catch (error) {
    mountedAnimations.delete(preview);
    console.error(`[showcase-visuals] failed to mount animation "${animationType}"`, error);
  }
}

export async function initShowcaseVisuals(root = document) {
  const visualTargets = [...root.querySelectorAll("[data-visual-demo]")];
  const animationPreviews = [...root.querySelectorAll("[data-animation]")];

  const stopAnimationObserver =
    observeOnceVisible(
      animationPreviews,
      (preview) => {
        void mountAnimationPreview(preview);
      },
      {
        rootMargin: globalThis.window?.matchMedia?.("(pointer: coarse), (max-width: 760px)")?.matches
          ? "35% 0px"
          : "70% 0px",
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
        rootMargin: globalThis.window?.matchMedia?.("(pointer: coarse), (max-width: 760px)")?.matches
          ? "30% 0px"
          : "60% 0px",
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
  };
}

