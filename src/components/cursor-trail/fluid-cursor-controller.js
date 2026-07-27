const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const DEFAULT_PRELOAD_MARGIN = "200px 0px";

export function createFluidCursorController({
  root,
  canvas,
  motion,
  preloadMargin = DEFAULT_PRELOAD_MARGIN,
} = {}) {
  if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY);

  let destroyed = false;
  let requestId = 0;
  let observer = null;
  let destroyFluid = null;

  const motionIsAllowed = () => typeof motion?.allowsMotion === "function" && motion.allowsMotion();

  const unmountFluid = () => {
    requestId += 1;

    observer?.disconnect();
    observer = null;

    destroyFluid?.();
    destroyFluid = null;

    canvas.hidden = true;
  };

  const mountFluid = async (currentRequest) => {
    try {
      const { createFluidCursor } = await import("./fluid-cursor.js");

      if (
        destroyed ||
        currentRequest !== requestId ||
        !motionIsAllowed() ||
        !precisePointer.matches
      ) {
        return;
      }

      destroyFluid =
        createFluidCursor({
          root,
          canvas,
        }) ?? null;
    } catch (error) {
      if (!destroyed && currentRequest === requestId) {
        canvas.hidden = true;

        console.warn("Fluid cursor module could not be loaded.", error);
      }
    }
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
        observer = null;

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

    if (!motionIsAllowed() || !precisePointer.matches) {
      return;
    }

    armFluid();
  };

  precisePointer.addEventListener("change", syncAvailability);

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(syncAvailability, {
          immediate: false,
        })
      : () => {};

  syncAvailability();

  return () => {
    destroyed = true;

    unsubscribeMotion();
    unmountFluid();

    precisePointer.removeEventListener("change", syncAvailability);
  };
}
