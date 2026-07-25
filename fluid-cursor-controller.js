const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_PRELOAD_MARGIN = "200px 0px";

export function createFluidCursorController({
  root,
  canvas,
  preloadMargin = DEFAULT_PRELOAD_MARGIN,
} = {}) {
  if (!(root instanceof HTMLElement)) {
    return undefined;
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    return undefined;
  }

  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  let destroyed = false;
  let requestId = 0;
  let observer;
  let destroyFluid;

  const unmountFluid = () => {
    requestId += 1;
    observer?.disconnect();
    observer = undefined;
    destroyFluid?.();
    destroyFluid = undefined;
    canvas.hidden = true;
  };

  const mountFluid = async (currentRequest) => {
    const { createHeroFluid } = await import("./fluid-cursor.js");

    if (destroyed || currentRequest !== requestId) {
      return;
    }

    destroyFluid = createHeroFluid({ root, canvas }) ?? undefined;
  };

  const armFluid = () => {
    const currentRequest = ++requestId;

    if (!("IntersectionObserver" in window)) {
      void mountFluid(currentRequest);
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        observer?.disconnect();
        observer = undefined;
        void mountFluid(currentRequest);
      },
      {
        rootMargin: preloadMargin,
      },
    );

    observer.observe(root);
  };

  const syncAvailability = () => {
    unmountFluid();

    if (!precisePointer.matches || reducedMotion.matches) {
      return;
    }

    armFluid();
  };

  precisePointer.addEventListener("change", syncAvailability);
  reducedMotion.addEventListener("change", syncAvailability);
  syncAvailability();

  return () => {
    destroyed = true;
    unmountFluid();
    precisePointer.removeEventListener("change", syncAvailability);
    reducedMotion.removeEventListener("change", syncAvailability);
  };
}
