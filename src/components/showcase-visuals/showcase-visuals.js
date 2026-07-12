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


function canUseHeavy3DVisuals() {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection?.saveData) {
    return false;
  }

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return false;
  }

  if (window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches) {
    return false;
  }

  if (window.innerWidth < 900) {
    return false;
  }

  const memory = Number(nav.deviceMemory || 0);

  if (memory > 0 && memory < 4) {
    return false;
  }

  return true;
}


function canUseLogo3DVisuals() {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection?.saveData) {
    return false;
  }

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return false;
  }

  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

function mountVisualPosterFallback(target) {
  const poster =
    target.dataset.cvPoster ||
    target.dataset.threePoster ||
    target.querySelector?.("canvas")?.dataset.threePoster;

  if (!poster || target.querySelector?.(".visual-poster-fallback")) {
    return noop;
  }

  const fallback = document.createElement("img");
  fallback.className = "visual-poster-fallback";
  fallback.src = poster;
  fallback.alt = "";
  fallback.decoding = "async";
  fallback.loading = "lazy";
  fallback.setAttribute("aria-hidden", "true");

  const canvas = target instanceof HTMLCanvasElement ? target : target.querySelector?.("canvas");

  if (canvas instanceof HTMLCanvasElement) {
    canvas.replaceWith(fallback);
  } else {
    target.append(fallback);
  }

  target.classList?.add("has-visual-poster-fallback");

  return noop;
}
function getDemoParts(target) {
  return target.dataset.visualDemo?.split(":") ?? [];
}

async function mountThreeDemo(canvas) {
  const [, sceneName] = getDemoParts(canvas);
  const canMount =
    sceneName === "logo" ? canUseLogo3DVisuals() : canUseHeavy3DVisuals();

  if (!canMount) {
    return mountVisualPosterFallback(canvas);
  }

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
  if (!canUseLogo3DVisuals()) {
    target.dataset.cvPoster ||= "/assets/media/cases/jesteipool/01-logo/01/02.webp";
    return mountVisualPosterFallback(target);
  }

  const [, inspectorMode] = getDemoParts(target);
  const module =
    inspectorMode === "jestei"
      ? await import("../showcase-task-previews/logo-inspector-grid-3d.js")
      : await import("../showcase-task-previews/logo-inspector-3d.js");
  const controller = module.createLogoInspector3D(target, {
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
          ? "8% 0px"
          : "12% 0px",
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
