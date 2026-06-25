const MIN_CANVAS_SCALE = 0.72;
const MAX_CANVAS_SCALE = 1.45;
const WHEEL_ZOOM_FACTOR = 0.00045;
const MAX_WHEEL_ZOOM_DELTA = 0.07;
const ZOOM_EASING_FACTOR = 0.18;
const DRAG_SENSITIVITY = 0.88;
const PINCH_SENSITIVITY = 0.92;
const PAN_VERTICAL_LEEWAY = 120;

const STYLE_ID = "newsletter-canvas-module-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .newsletter-canvas-stage {
      position: relative;
      width: min(100%, 34rem);
      min-width: 0;
      height: clamp(32rem, 70vw, var(--newsletter-canvas-max-height, 48rem));
      min-height: min(var(--newsletter-canvas-min-height, 32rem), 82vh);
      max-height: min(var(--newsletter-canvas-max-height, 48rem), 88vh);
      margin-inline: auto;
      background: transparent;
      border: 0;
      overflow: hidden;
      contain: layout paint;
      touch-action: none;
      user-select: none;
    }

    .newsletter-canvas-surface {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      background: transparent;
    }
  `;

  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
    image.src = imageSrc;
  });
}

async function buildCanvasSource(src) {
  const srcList = (Array.isArray(src) ? src : [src]).filter(Boolean);

  if (srcList.length === 0) {
    return null;
  }

  const loadedImages = await Promise.all(srcList.map(loadImage));

  if (loadedImages.length === 1) {
    const single = loadedImages[0];
    return {
      source: single,
      width: single.naturalWidth,
      height: single.naturalHeight,
    };
  }

  const mergedWidth = loadedImages.reduce((sum, image) => sum + image.naturalWidth, 0);
  const mergedHeight = loadedImages.reduce((max, image) => Math.max(max, image.naturalHeight), 1);

  const mergedCanvas = document.createElement("canvas");
  mergedCanvas.width = mergedWidth;
  mergedCanvas.height = mergedHeight;

  const mergedContext = mergedCanvas.getContext("2d");
  if (!mergedContext) {
    return null;
  }

  let currentX = 0;
  for (const image of loadedImages) {
    const offsetY = Math.round((mergedHeight - image.naturalHeight) / 2);
    mergedContext.drawImage(image, currentX, offsetY);
    currentX += image.naturalWidth;
  }

  return {
    source: mergedCanvas,
    width: mergedCanvas.width,
    height: mergedCanvas.height,
  };
}

export function createNewsletterCanvas(target, options = {}) {
  ensureStyles();

  const container = typeof target === "string" ? document.querySelector(target) : target;
  if (!container) {
    throw new Error("createNewsletterCanvas: target container not found");
  }

  const {
    src = [],
    alt = "Newsletter canvas",
    className = "",
    minHeight = 320,
  } = options;

  const stage = document.createElement("div");
  stage.className = `newsletter-canvas-stage ${className}`.trim();
  const safeMinHeight = clamp(Number(minHeight) || 520, 420, 680);
  const safeMaxHeight = clamp(safeMinHeight + 260, 560, 860);
  stage.style.setProperty("--newsletter-canvas-min-height", `${safeMinHeight}px`);
  stage.style.setProperty("--newsletter-canvas-max-height", `${safeMaxHeight}px`);

  const canvas = document.createElement("canvas");
  canvas.className = "newsletter-canvas-surface";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", alt);

  stage.appendChild(canvas);
  container.appendChild(stage);

  const state = {
    viewport: { width: 0, height: 0 },
    canvasSource: null,
    transform: { scale: 1, offsetX: 0, offsetY: 0 },
    zoomTarget: null,
    animationFrame: null,
    activePointerId: null,
    pointerPositions: new Map(),
    pinchState: null,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragBase: { x: 0, y: 0 },
    destroyed: false,
    version: 0,
  };

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("createNewsletterCanvas: 2D context is unavailable");
  }

  const fitScale = () => {
    if (!state.canvasSource || state.viewport.width === 0 || state.viewport.height === 0) return 1;
    return Math.min(
      state.viewport.width / state.canvasSource.width,
      state.viewport.height / state.canvasSource.height,
    ) * 0.96;
  };

  const clampTransform = (next) => {
    if (!state.canvasSource || state.viewport.width === 0 || state.viewport.height === 0) {
      return next;
    }

    const scale = clamp(next.scale, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);
    const drawWidth = state.canvasSource.width * fitScale() * scale;
    const drawHeight = state.canvasSource.height * fitScale() * scale;

    const maxX = Math.max(0, (drawWidth - state.viewport.width) / 2);
    const maxY = Math.max(PAN_VERTICAL_LEEWAY, (drawHeight - state.viewport.height) / 2);

    return {
      scale,
      offsetX: drawWidth <= state.viewport.width ? 0 : clamp(next.offsetX, -maxX, maxX),
      offsetY: drawHeight <= state.viewport.height ? 0 : clamp(next.offsetY, -maxY, maxY),
    };
  };

  const draw = () => {
    const { width, height } = state.viewport;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!state.canvasSource) return;

    const drawWidth = state.canvasSource.width * fitScale() * state.transform.scale;
    const drawHeight = state.canvasSource.height * fitScale() * state.transform.scale;
    const drawX = width / 2 - drawWidth / 2 + state.transform.offsetX;
    const drawY = height / 2 - drawHeight / 2 + state.transform.offsetY;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(state.canvasSource.source, drawX, drawY, drawWidth, drawHeight);
  };

  const stopZoomAnimation = () => {
    if (state.animationFrame !== null) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
    state.zoomTarget = null;
  };

  const getStagePoint = (clientX, clientY) => {
    const bounds = stage.getBoundingClientRect();
    return { x: clientX - bounds.left, y: clientY - bounds.top };
  };

  const setTransform = (next) => {
    state.transform = clampTransform(next);
    draw();
  };

  const zoomAtPoint = (clientX, clientY, zoomDelta) => {
    if (!state.canvasSource || state.viewport.width === 0 || state.viewport.height === 0) {
      return;
    }

    const stagePoint = getStagePoint(clientX, clientY);
    const baseTransform = state.zoomTarget || state.transform;
    const currentScale = baseTransform.scale;
    const nextScale = clamp(currentScale * (1 + zoomDelta), MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);

    if (nextScale === currentScale) return;

    const localFit = fitScale();
    const toImageX = (stagePoint.x - state.viewport.width / 2 - baseTransform.offsetX) / (localFit * currentScale);
    const toImageY = (stagePoint.y - state.viewport.height / 2 - baseTransform.offsetY) / (localFit * currentScale);

    state.zoomTarget = clampTransform({
      scale: nextScale,
      offsetX: stagePoint.x - state.viewport.width / 2 - toImageX * localFit * nextScale,
      offsetY: stagePoint.y - state.viewport.height / 2 - toImageY * localFit * nextScale,
    });

    const animate = () => {
      if (!state.zoomTarget) {
        state.animationFrame = null;
        return;
      }

      const current = state.transform;
      const target = state.zoomTarget;
      const eased = clampTransform({
        scale: current.scale + (target.scale - current.scale) * ZOOM_EASING_FACTOR,
        offsetX: current.offsetX + (target.offsetX - current.offsetX) * ZOOM_EASING_FACTOR,
        offsetY: current.offsetY + (target.offsetY - current.offsetY) * ZOOM_EASING_FACTOR,
      });

      const done =
        Math.abs(eased.scale - target.scale) < 0.001 &&
        Math.abs(eased.offsetX - target.offsetX) < 0.5 &&
        Math.abs(eased.offsetY - target.offsetY) < 0.5;

      setTransform(done ? target : eased);

      if (done) {
        state.zoomTarget = null;
        state.animationFrame = null;
        return;
      }

      state.animationFrame = requestAnimationFrame(animate);
    };

    if (state.animationFrame === null) {
      state.animationFrame = requestAnimationFrame(animate);
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const zoomDelta = Math.exp(-event.deltaY * WHEEL_ZOOM_FACTOR) - 1;
    const boundedZoomDelta = clamp(zoomDelta, -MAX_WHEEL_ZOOM_DELTA, MAX_WHEEL_ZOOM_DELTA);
    zoomAtPoint(event.clientX, event.clientY, boundedZoomDelta);
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    stopZoomAnimation();

    state.pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activePointers = [...state.pointerPositions.values()];

    if (activePointers.length >= 2) {
      state.isDragging = false;
      state.activePointerId = null;

      const [a, b] = activePointers;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const center = getStagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);

      state.pinchState = {
        initialDistance: Math.max(1, distance),
        initialScale: state.transform.scale,
        initialOffsetX: state.transform.offsetX,
        initialOffsetY: state.transform.offsetY,
        initialCenterX: center.x,
        initialCenterY: center.y,
      };
    } else {
      state.pinchState = null;
      state.isDragging = true;
      state.activePointerId = event.pointerId;
      state.dragStart = { x: event.clientX, y: event.clientY };
      state.dragBase = { x: state.transform.offsetX, y: state.transform.offsetY };
    }

    try {
      stage.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const onWindowPointerMove = (event) => {
    if (!state.pointerPositions.has(event.pointerId)) return;

    event.preventDefault();
    state.pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const activePointers = [...state.pointerPositions.values()];

    if (state.pinchState && activePointers.length >= 2) {
      const [a, b] = activePointers;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const center = getStagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      const ratio = distance / Math.max(1, state.pinchState.initialDistance);

      const nextScale = clamp(
        state.pinchState.initialScale * (1 + (ratio - 1) * PINCH_SENSITIVITY),
        MIN_CANVAS_SCALE,
        MAX_CANVAS_SCALE,
      );

      const localFit = fitScale();
      const toImageX =
        (state.pinchState.initialCenterX - state.viewport.width / 2 - state.pinchState.initialOffsetX) /
        (localFit * state.pinchState.initialScale);
      const toImageY =
        (state.pinchState.initialCenterY - state.viewport.height / 2 - state.pinchState.initialOffsetY) /
        (localFit * state.pinchState.initialScale);

      setTransform({
        scale: nextScale,
        offsetX: center.x - state.viewport.width / 2 - toImageX * localFit * nextScale,
        offsetY: center.y - state.viewport.height / 2 - toImageY * localFit * nextScale,
      });

      return;
    }

    if (!state.isDragging) return;
    if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;

    const dx = (event.clientX - state.dragStart.x) * DRAG_SENSITIVITY;
    const dy = (event.clientY - state.dragStart.y) * DRAG_SENSITIVITY;

    setTransform({
      ...state.transform,
      offsetX: state.dragBase.x + dx,
      offsetY: state.dragBase.y + dy,
    });
  };

  const stopDragging = () => {
    state.isDragging = false;
    state.activePointerId = null;
  };

  const onWindowPointerUp = (event) => {
    if (!state.pointerPositions.has(event.pointerId)) return;

    state.pointerPositions.delete(event.pointerId);
    const activePointers = [...state.pointerPositions.entries()];

    if (activePointers.length >= 2) {
      const [a, b] = activePointers.map(([, point]) => point);
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const center = getStagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);

      state.pinchState = {
        initialDistance: Math.max(1, distance),
        initialScale: state.transform.scale,
        initialOffsetX: state.transform.offsetX,
        initialOffsetY: state.transform.offsetY,
        initialCenterX: center.x,
        initialCenterY: center.y,
      };
      state.isDragging = false;
      state.activePointerId = null;
      return;
    }

    state.pinchState = null;

    if (activePointers.length === 1) {
      const [remainingId, point] = activePointers[0];
      state.isDragging = true;
      state.activePointerId = remainingId;
      state.dragStart = { x: point.x, y: point.y };
      state.dragBase = { x: state.transform.offsetX, y: state.transform.offsetY };
      return;
    }

    stopDragging();
  };

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;

    const bounds = stage.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width || entry.contentRect.width || 1));
    const nextHeight = Math.max(1, Math.round(bounds.height || entry.contentRect.height || safeMinHeight || 1));

    if (state.viewport.width === nextWidth && state.viewport.height === nextHeight) {
      return;
    }

    state.viewport = { width: nextWidth, height: nextHeight };
    setTransform(state.transform);
  });

  resizeObserver.observe(stage);

  stage.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointerup", onWindowPointerUp);
  stage.addEventListener("pointercancel", onWindowPointerUp);

  window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
  window.addEventListener("pointerup", onWindowPointerUp);
  window.addEventListener("pointercancel", onWindowPointerUp);

  const setSource = async (nextSrc) => {
    const currentVersion = ++state.version;

    try {
      const nextCanvasSource = await buildCanvasSource(nextSrc);
      if (state.destroyed || currentVersion !== state.version) return;

      state.canvasSource = nextCanvasSource;
      setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    } catch {
      if (state.destroyed || currentVersion !== state.version) return;

      state.canvasSource = null;
      draw();
    }
  };

  void setSource(src);

  return {
    element: stage,
    setSource,
    reset() {
      setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    },
    destroy() {
      if (state.destroyed) return;
      state.destroyed = true;

      stopZoomAnimation();
      resizeObserver.disconnect();

      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onWindowPointerUp);
      stage.removeEventListener("pointercancel", onWindowPointerUp);

      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);

      stage.remove();
    },
  };
}
