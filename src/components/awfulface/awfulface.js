import { gsap } from "gsap";

const FACE_SIZE = 220;
const FACE_HALF = FACE_SIZE / 2;

const EYE_TRACK_STRENGTH_X = 7.5;
const EYE_TRACK_STRENGTH_Y = 6;

const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const MAX_CANVAS_DPR = 1.5;
const MIN_RENDER_INTERVAL_MS = 1000 / 30;

const EYES = {
  left: {
    x: -62,
    y: -8,
  },

  right: {
    x: 26,
    y: -24,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawStroke(context, draw) {
  context.beginPath();
  draw(context);
  context.stroke();
}

function withTransform(context, transform, draw) {
  context.save();

  context.translate(transform.x ?? 0, transform.y ?? 0);

  context.rotate(transform.rotation ?? 0);

  draw();

  context.restore();
}

function drawFace(context, state, metrics) {
  const { pixelWidth, pixelHeight, cssWidth, cssHeight, dpr, ink } = metrics;

  context.setTransform(1, 0, 0, 1, 0, 0);

  context.clearRect(0, 0, pixelWidth, pixelHeight);

  const scale = Math.min(cssWidth, cssHeight) / FACE_SIZE;

  context.setTransform(dpr * scale, 0, 0, dpr * scale, pixelWidth / 2, pixelHeight / 2);

  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = 8.5;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.translate(10, -8);

  const idleX = (state.idle - 0.5) * 2.4;

  const idleY = (state.idleY - 0.5) * 1.8;

  context.save();

  context.translate(
    state.pointerX * 2.5 + idleX,
    state.pointerY * 1.7 + state.scroll * 3.2 + idleY,
  );

  const pointerFaceX = state.pointerX * FACE_HALF;

  const pointerFaceY = state.pointerY * FACE_HALF;

  const pointerInfluence = state.pointerActive;

  const leftEyeX =
    ((pointerFaceX - EYES.left.x) / FACE_HALF) * EYE_TRACK_STRENGTH_X * pointerInfluence;

  const leftEyeY =
    ((pointerFaceY - EYES.left.y) / FACE_HALF) * EYE_TRACK_STRENGTH_Y * pointerInfluence;

  const rightEyeX =
    ((pointerFaceX - EYES.right.x) / FACE_HALF) * EYE_TRACK_STRENGTH_X * pointerInfluence;

  const rightEyeY =
    ((pointerFaceY - EYES.right.y) / FACE_HALF) * 0.5 * EYE_TRACK_STRENGTH_Y * pointerInfluence;

  withTransform(
    context,
    {
      x: state.pointerX * -2.6,

      y: state.pointerY * -1.8 + state.scroll * -1.4,

      rotation: state.pointerX * -0.012,
    },
    () => {
      context.beginPath();

      context.ellipse(EYES.left.x + leftEyeX, EYES.left.y + leftEyeY, 7, 5, 0, 0, Math.PI * 2);

      context.fill();

      context.beginPath();

      context.ellipse(EYES.right.x + rightEyeX, EYES.right.y + rightEyeY, 7, 5, 0, 0, Math.PI * 2);

      context.fill();
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 3.4,

      y: state.pointerY * 2.2 + state.scroll * -2.2,

      rotation: state.pointerX * 0.018,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-25, -28);
        path.lineTo(30, -65);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * -2.2,

      y: state.pointerY * 1.8 + state.scroll * 1.8,

      rotation: state.pointerX * -0.01,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-25, 67);
        path.lineTo(10, 87);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 2.1,

      y: state.pointerY * 1.6 + state.scroll * 1.1,

      rotation: state.pointerX * 0.009,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-75, -48);

        path.quadraticCurveTo(-30, -45, -25, -32);

        path.quadraticCurveTo(-20, 0, -20, -5);

        path.quadraticCurveTo(-20, 15, -5, 7);

        path.quadraticCurveTo(15, -10, 1, 0);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 1.5,

      y: state.pointerY * 2.7 + state.scroll * 2.8,

      rotation: state.pointerX * 0.012,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-60, 55);

        path.quadraticCurveTo(-35, 27, -20, 48);

        path.quadraticCurveTo(-15, 70, 10, 35);

        path.quadraticCurveTo(22, 32, 35, 48);

        path.quadraticCurveTo(55, 42, 50, 46);
      });
    },
  );

  context.restore();
}

export function createAwfulface({ element, trackingRoot = element, motion } = {}) {
  if (!(element instanceof HTMLElement) || !(trackingRoot instanceof HTMLElement)) {
    return null;
  }

  const canvas = element.querySelector("[data-awfulface-canvas]");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    return null;
  }

  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY);

  if (!precisePointer.matches) {
    element.removeAttribute("data-animated");
    return () => {};
  }

  const state = {
    pointerX: 0,
    pointerY: 0,
    pointerActive: 0,
    scroll: 0,
    idle: 0,
    idleY: 1,
  };

  const metrics = {
    cssWidth: 1,
    cssHeight: 1,
    pixelWidth: 1,
    pixelHeight: 1,
    dpr: 1,
    ink: "#000000",
  };

  let active = false;
  let visible = true;
  let tickerActive = false;

  let resizeObserver = null;
  let intersectionObserver = null;

  let idleXTween = null;
  let idleYTween = null;

  let setPointerX = null;
  let setPointerY = null;
  let setPointerActive = null;
  let setScroll = null;
  let lastRenderTime = 0;
  let scrollFrame = 0;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();

    const cssWidth = Math.max(1, rect.width);

    const cssHeight = Math.max(1, rect.height);

    const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_CANVAS_DPR);

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));

    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    const ink = getComputedStyle(element).color || "#000000";

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    Object.assign(metrics, {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      dpr,
      ink,
    });

    drawFace(context, state, metrics);
  };

  const render = () => {
    if (active && visible) {
      const now = performance.now();

      if (now - lastRenderTime < MIN_RENDER_INTERVAL_MS) {
        return;
      }

      lastRenderTime = now;
      drawFace(context, state, metrics);
    }
  };

  const syncTicker = () => {
    const shouldRun = active && visible;

    if (shouldRun && !tickerActive) {
      gsap.ticker.add(render);
      tickerActive = true;

      return;
    }

    if (!shouldRun && tickerActive) {
      gsap.ticker.remove(render);
      tickerActive = false;
    }
  };

  const resetPointer = () => {
    setPointerActive?.(0);
    setPointerX?.(0);
    setPointerY?.(0);
  };

  const updatePointer = (event) => {
    if (!active || !precisePointer.matches) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    setPointerActive?.(1);

    setPointerX?.(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1));

    setPointerY?.(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1));
  };

  const updateScroll = () => {
    scrollFrame = 0;

    if (!active) {
      return;
    }

    const rect = trackingRoot.getBoundingClientRect();

    const viewportCenter = window.innerHeight / 2;

    const rootCenter = rect.top + rect.height / 2;

    const range = Math.max(window.innerHeight, rect.height) / 2;

    setScroll?.(clamp((viewportCenter - rootCenter) / range, -1, 1));
  };

  const scheduleScrollUpdate = () => {
    if (scrollFrame || !active) {
      return;
    }

    scrollFrame = requestAnimationFrame(updateScroll);
  };

  const stopAnimatedVersion = () => {
    delete element.dataset.animated;

    if (!active) {
      return;
    }

    active = false;

    if (tickerActive) {
      gsap.ticker.remove(render);
      tickerActive = false;
    }

    idleXTween?.kill();
    idleYTween?.kill();

    idleXTween = null;
    idleYTween = null;

    gsap.killTweensOf(state);

    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    cancelAnimationFrame(scrollFrame);

    resizeObserver = null;
    intersectionObserver = null;
    scrollFrame = 0;
    lastRenderTime = 0;

    document.removeEventListener("pointermove", updatePointer);

    document.removeEventListener("pointerout", resetPointer);

    window.removeEventListener("blur", resetPointer);

    window.removeEventListener("scroll", scheduleScrollUpdate);

    precisePointer.removeEventListener("change", resetPointer);

    setPointerX = null;
    setPointerY = null;
    setPointerActive = null;
    setScroll = null;

    Object.assign(state, {
      pointerX: 0,
      pointerY: 0,
      pointerActive: 0,
      scroll: 0,
      idle: 0,
      idleY: 1,
    });
  };

  const startAnimatedVersion = () => {
    if (active) {
      return;
    }

    try {
      active = true;

      setPointerX = gsap.quickTo(state, "pointerX", {
        duration: 0.65,
        ease: "power3.out",
      });

      setPointerY = gsap.quickTo(state, "pointerY", {
        duration: 0.65,
        ease: "power3.out",
      });

      setPointerActive = gsap.quickTo(state, "pointerActive", {
        duration: 0.35,
        ease: "power2.out",
      });

      setScroll = gsap.quickTo(state, "scroll", {
        duration: 0.8,
        ease: "power3.out",
      });

      idleXTween = gsap.to(state, {
        idle: 1,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      idleYTween = gsap.to(state, {
        idleY: 0,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      resizeObserver = new ResizeObserver(resizeCanvas);

      resizeObserver.observe(canvas);

      if ("IntersectionObserver" in window) {
        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            visible = Boolean(entry?.isIntersecting);

            if (visible) {
              resizeCanvas();
            }

            syncTicker();
          },
          {
            threshold: 0.01,
          },
        );

        intersectionObserver.observe(element);
      }

      document.addEventListener("pointermove", updatePointer, {
        passive: true,
      });

      document.addEventListener("pointerout", resetPointer, {
        passive: true,
      });

      window.addEventListener("blur", resetPointer);

      window.addEventListener("scroll", scheduleScrollUpdate, {
        passive: true,
      });

      precisePointer.addEventListener("change", resetPointer);

      updateScroll();
      resizeCanvas();
      syncTicker();

      element.dataset.animated = "true";
    } catch (error) {
      stopAnimatedVersion();

      console.warn("Awfulface animation could not be initialized.", error);
    }
  };

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(({ allowed }) => {
          if (allowed) {
            startAnimatedVersion();
          } else {
            stopAnimatedVersion();
          }
        })
      : () => {};

  return () => {
    unsubscribeMotion();
    stopAnimatedVersion();
  };
}
