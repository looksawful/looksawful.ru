import gsap from "gsap";

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getDistanceToElement = (event, element) => {
  const rect = element.getBoundingClientRect();

  const nearestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
  const nearestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));

  const distanceX = event.clientX - nearestX;
  const distanceY = event.clientY - nearestY;

  return Math.hypot(distanceX, distanceY);
};

export const getProximityProgress = ({
  distance,
  showStart = 220,
  showEnd = 24
}) => {
  if (showStart === showEnd) {
    return distance <= showEnd ? 1 : 0;
  }

  return clamp(1 - (distance - showEnd) / (showStart - showEnd), 0, 1);
};

export const canUsePointerProximity = () => {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

export const createProximityMotion = ({
  root,
  target,
  distanceTarget = target,
  listenRoot = root,

  showStart = 220,
  showEnd = 24,

  opacityFrom = 0,
  opacityTo = 1,

  yFrom = 8,
  yTo = 0,

  scaleXFrom = 0.94,
  scaleXTo = 1,

  scaleYFrom = scaleXFrom,
  scaleYTo = scaleXTo,

  transformOrigin = "center",

  interactiveClass = "is-proximity-interactive",
  activeClassTarget = target,

  hideOnRootLeave = listenRoot !== document,

  onProgress = null,
  onReady = null
}) => {
  if (!root || !target || !distanceTarget || !listenRoot) {
    return null;
  }

  const setProgress = (progress) => {
    const value = clamp(progress, 0, 1);

    const opacity = opacityFrom + (opacityTo - opacityFrom) * value;
    const y = yFrom + (yTo - yFrom) * value;
    const scaleX = scaleXFrom + (scaleXTo - scaleXFrom) * value;
    const scaleY = scaleYFrom + (scaleYTo - scaleYFrom) * value;

    gsap.set(target, {
      opacity,
      visibility: "visible",
      y,
      scaleX,
      scaleY,
      transformOrigin
    });

    if (activeClassTarget?.classList) {
      activeClassTarget.classList.toggle(interactiveClass, value > 0.08);
    }

    if (onProgress) {
      onProgress(value);
    }
  };

  const show = () => {
    setProgress(1);
  };

  const hide = () => {
    setProgress(0);
  };

  if (!canUsePointerProximity()) {
    hide();

    if (onReady) {
      onReady();
    }

    return {
      destroy: () => {}
    };
  }

  hide();

  const update = (event) => {
    const distance = getDistanceToElement(event, distanceTarget);
    const progress = getProximityProgress({
      distance,
      showStart,
      showEnd
    });

    setProgress(progress);
  };

  const hideOnViewportLeave = (event) => {
    if (!event.relatedTarget) {
      hide();
    }
  };

  const hideOnVisibilityChange = () => {
    if (document.hidden) {
      hide();
    }
  };

  listenRoot.addEventListener("pointermove", update);

  if (hideOnRootLeave) {
    root.addEventListener("pointerleave", hide);
  }

  window.addEventListener("blur", hide);
  window.addEventListener("pointerout", hideOnViewportLeave);
  window.addEventListener("scroll", hide, { passive: true });
  document.addEventListener("visibilitychange", hideOnVisibilityChange);

  target.addEventListener("focusin", show);
  target.addEventListener("focusout", hide);

  if (onReady) {
    onReady();
  }

  return {
    destroy: () => {
      listenRoot.removeEventListener("pointermove", update);

      if (hideOnRootLeave) {
        root.removeEventListener("pointerleave", hide);
      }

      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerout", hideOnViewportLeave);
      window.removeEventListener("scroll", hide);
      document.removeEventListener("visibilitychange", hideOnVisibilityChange);

      target.removeEventListener("focusin", show);
      target.removeEventListener("focusout", hide);
    }
  };
};

export const createObservedInitializer = (init) => {
  let observer = null;

  const run = () => {
    init();
  };

  const start = () => {
    run();

    observer = new MutationObserver(() => {
      run();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    return {
      destroy: () => {
        observer?.disconnect();
        observer = null;
      }
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {
      once: true
    });

    return {
      destroy: () => {
        document.removeEventListener("DOMContentLoaded", start);
      }
    };
  }

  return start();
};

