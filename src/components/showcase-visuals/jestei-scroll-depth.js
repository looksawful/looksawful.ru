const controllers = new WeakMap();

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_QUERY = "(max-width: 43rem)";
const LANE_DEPTH_FACTORS = [0.82, -0.38, 0.58, -0.16, 0.28, -0.54, 0.42, -0.7, 0.34];

const noop = () => {};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (current, target, amount) => current + (target - current) * amount;

const getNow = () => globalThis.performance?.now?.() || Date.now();
const getScrollY = (win) => win?.scrollY || win?.pageYOffset || 0;

const resizePresentationCanvas = (canvas, ctx) => {
  const width = Math.max(1, canvas.clientWidth || 0);
  const height = Math.max(1, canvas.clientHeight || 0);
  const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;

  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }

  return { width, height };
};

const drawPresentationFrame = ({ source, target, ctx, laneShift }) => {
  const { width, height } = resizePresentationCanvas(target, ctx);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  if (!source.width || !source.height || width <= 1 || height <= 1) {
    ctx.restore();
    return;
  }

  const laneCount = width < 560 ? 5 : width < 920 ? 7 : 9;
  const sourceScaleX = source.width / width;
  const overscan = Math.max(5, Math.min(11, height * 0.055));

  for (let index = 0; index < laneCount; index += 1) {
    const x = Math.floor((width * index) / laneCount);
    const nextX = index === laneCount - 1 ? width : Math.ceil((width * (index + 1)) / laneCount);
    const laneWidth = Math.max(1, nextX - x);
    const sourceX = Math.max(0, Math.floor(x * sourceScaleX));
    const sourceNextX = index === laneCount - 1 ? source.width : Math.ceil(nextX * sourceScaleX);
    const sourceWidth = Math.max(1, sourceNextX - sourceX);
    const depthFactor = LANE_DEPTH_FACTORS[index % LANE_DEPTH_FACTORS.length];
    const offsetY = laneShift * depthFactor;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, laneWidth, height);
    ctx.clip();
    ctx.globalAlpha = 0.992 + Math.abs(depthFactor) * 0.008;
    ctx.drawImage(
      source,
      sourceX,
      0,
      sourceWidth,
      source.height,
      x,
      -overscan + offsetY,
      laneWidth,
      height + overscan * 2,
    );
    ctx.restore();
  }

  ctx.restore();
};

export const mountJesteiScrollDepth = (sourceCanvas) => {
  const CanvasConstructor = globalThis.HTMLCanvasElement;

  if (!CanvasConstructor || !(sourceCanvas instanceof CanvasConstructor)) {
    return noop;
  }

  controllers.get(sourceCanvas)?.();

  const surface = sourceCanvas.closest?.(".jestei-archive-media__surface--interface");
  const doc = sourceCanvas.ownerDocument || globalThis.document;
  const win = doc?.defaultView || globalThis.window;

  if (!surface || !doc || !win) {
    return noop;
  }

  const presentationCanvas = doc.createElement("canvas");
  const presentationContext = presentationCanvas.getContext("2d", { alpha: false });

  if (!presentationContext) {
    return noop;
  }

  presentationCanvas.className = "jestei-archive-media__depth-canvas";
  presentationCanvas.setAttribute("aria-hidden", "true");
  presentationCanvas.tabIndex = -1;
  sourceCanvas.insertAdjacentElement("afterend", presentationCanvas);

  const motionQuery = win.matchMedia?.(REDUCED_MOTION_QUERY);
  const mobileQuery = win.matchMedia?.(MOBILE_QUERY);
  const resizeObserver = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(() => {
        resizePresentationCanvas(presentationCanvas, presentationContext);
      })
    : null;

  let disposed = false;
  let frameId;
  let lastScrollY = getScrollY(win);
  let lastScrollTime = getNow();
  let positionTarget = 0;
  let position = 0;
  let impulseTarget = 0;
  let impulse = 0;

  const reducedMotion = () => Boolean(motionQuery?.matches);
  const isMobile = () => Boolean(mobileQuery?.matches);

  const updatePositionTarget = () => {
    if (reducedMotion()) {
      positionTarget = 0;
      impulseTarget = 0;
      return;
    }

    const rect = surface.getBoundingClientRect();
    const viewportHeight = Math.max(1, win.innerHeight || doc.documentElement?.clientHeight || 1);
    const surfaceCenter = rect.top + rect.height * 0.5;
    const viewportCenter = viewportHeight * 0.5;

    positionTarget = clamp((viewportCenter - surfaceCenter) / (viewportHeight * 0.72), -1, 1);
  };

  const handleScroll = () => {
    const now = getNow();
    const nextScrollY = getScrollY(win);
    const elapsed = Math.max(16, now - lastScrollTime);
    const scrollVelocity = (nextScrollY - lastScrollY) / elapsed;

    impulseTarget = reducedMotion() ? 0 : clamp(scrollVelocity * 0.52, -1, 1);
    lastScrollY = nextScrollY;
    lastScrollTime = now;
    updatePositionTarget();
  };

  const clearDepthStyles = () => {
    surface.style.removeProperty("--jestei-depth-y");
    surface.style.removeProperty("--jestei-depth-scale");
    surface.style.removeProperty("--jestei-depth-space-x");
    surface.style.removeProperty("--jestei-depth-space-y");
  };

  const render = () => {
    if (disposed) {
      return;
    }

    updatePositionTarget();

    if (reducedMotion()) {
      position = 0;
      impulse = 0;
      impulseTarget = 0;
      clearDepthStyles();
      drawPresentationFrame({
        source: sourceCanvas,
        target: presentationCanvas,
        ctx: presentationContext,
        laneShift: 0,
      });
    } else {
      position = lerp(position, positionTarget, 0.065);
      impulse = lerp(impulse, impulseTarget, 0.14);
      impulseTarget *= 0.86;

      const mobile = isMobile();
      const surfaceAmplitude = mobile ? 5.5 : 12;
      const laneAmplitude = mobile ? 3.2 : 7;
      const positionShift = position * (mobile ? 3.6 : 7.5);
      const impulseShift = impulse * (mobile ? 1.8 : 4.2);
      const surfaceShift = clamp(positionShift + impulseShift, -surfaceAmplitude, surfaceAmplitude);
      const laneShift = clamp(
        position * (mobile ? 2.1 : 4.4) + impulse * (mobile ? 1.4 : 3.1),
        -laneAmplitude,
        laneAmplitude,
      );
      const baseScale = mobile ? 0.006 : 0.011;
      const scale = 1 + (1 - Math.min(1, Math.abs(position))) * baseScale + Math.abs(impulse) * 0.0025;
      const spaceX = position * (mobile ? 2.5 : 5) + impulse * (mobile ? 1.5 : 3.5);
      const spaceY = -position * (mobile ? 1.5 : 3) - impulse * (mobile ? 1 : 2.25);

      surface.style.setProperty("--jestei-depth-y", `${surfaceShift.toFixed(3)}px`);
      surface.style.setProperty("--jestei-depth-scale", scale.toFixed(5));
      surface.style.setProperty("--jestei-depth-space-x", `${spaceX.toFixed(3)}px`);
      surface.style.setProperty("--jestei-depth-space-y", `${spaceY.toFixed(3)}px`);

      drawPresentationFrame({
        source: sourceCanvas,
        target: presentationCanvas,
        ctx: presentationContext,
        laneShift,
      });
    }

    frameId = win.requestAnimationFrame(render);
  };

  const start = () => {
    if (disposed || frameId !== undefined || doc.hidden) {
      return;
    }

    frameId = win.requestAnimationFrame(render);
  };

  const stop = () => {
    if (frameId === undefined) {
      return;
    }

    win.cancelAnimationFrame(frameId);
    frameId = undefined;
  };

  const handleVisibilityChange = () => {
    if (doc.hidden) {
      stop();
      return;
    }

    lastScrollY = getScrollY(win);
    lastScrollTime = getNow();
    updatePositionTarget();
    start();
  };

  const handleMotionChange = () => {
    if (reducedMotion()) {
      positionTarget = 0;
      impulseTarget = 0;
      clearDepthStyles();
    } else {
      updatePositionTarget();
    }
  };

  sourceCanvas.classList.add("jestei-archive-media__source-canvas");
  surface.classList.add("is-scroll-depth-active");
  resizeObserver?.observe(surface);
  win.addEventListener("scroll", handleScroll, { passive: true });
  win.addEventListener("resize", updatePositionTarget, { passive: true });
  doc.addEventListener("visibilitychange", handleVisibilityChange);

  if (motionQuery?.addEventListener) {
    motionQuery.addEventListener("change", handleMotionChange);
  } else {
    motionQuery?.addListener?.(handleMotionChange);
  }

  updatePositionTarget();
  drawPresentationFrame({
    source: sourceCanvas,
    target: presentationCanvas,
    ctx: presentationContext,
    laneShift: 0,
  });
  start();

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    stop();
    resizeObserver?.disconnect();
    win.removeEventListener("scroll", handleScroll);
    win.removeEventListener("resize", updatePositionTarget);
    doc.removeEventListener("visibilitychange", handleVisibilityChange);

    if (motionQuery?.removeEventListener) {
      motionQuery.removeEventListener("change", handleMotionChange);
    } else {
      motionQuery?.removeListener?.(handleMotionChange);
    }

    presentationCanvas.remove();
    sourceCanvas.classList.remove("jestei-archive-media__source-canvas");
    surface.classList.remove("is-scroll-depth-active");
    clearDepthStyles();
    controllers.delete(sourceCanvas);
  };

  controllers.set(sourceCanvas, dispose);
  return dispose;
};
