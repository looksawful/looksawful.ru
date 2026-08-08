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
  let pointerActivated = false;
  let pointerArmed = false;

  const motionIsAllowed = () => typeof motion?.allowsMotion === "function" && motion.allowsMotion();

  const unmountFluid = () => {
    requestId += 1;

    observer?.disconnect();
    observer = null;

    destroyFluid?.();
    destroyFluid = null;

    canvas.hidden = true;
  };

  const disarmPointerActivation = () => {
    if (!pointerArmed) {
      return;
    }

    pointerArmed = false;
    root.removeEventListener("pointerenter", handlePointerActivation);
    root.removeEventListener("pointermove", handlePointerActivation);
    root.removeEventListener("pointerdown", handlePointerActivation);
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

  function handlePointerActivation() {
    if (pointerActivated) {
      return;
    }

    pointerActivated = true;
    disarmPointerActivation();

    if (!motionIsAllowed() || !precisePointer.matches) {
      return;
    }

    armFluid();
  }

  const armPointerActivation = () => {
    if (pointerArmed || pointerActivated) {
      return;
    }

    pointerArmed = true;
    root.addEventListener("pointerenter", handlePointerActivation, {
      passive: true,
    });
    root.addEventListener("pointermove", handlePointerActivation, {
      passive: true,
    });
    root.addEventListener("pointerdown", handlePointerActivation, {
      passive: true,
    });
  };

  const syncAvailability = () => {
    unmountFluid();

    if (!motionIsAllowed() || !precisePointer.matches) {
      disarmPointerActivation();
      return;
    }

    if (pointerActivated) {
      armFluid();
      return;
    }

    armPointerActivation();
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
    disarmPointerActivation();

    precisePointer.removeEventListener("change", syncAvailability);
  };
}
