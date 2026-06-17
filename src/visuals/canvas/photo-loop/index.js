import {
  beginMount,
  completeMount,
  createAnimationKey,
  createCanvasAnimation,
  createMediaLoader,
  getCanvasMountOptions,
  limitAnimationItems,
  noop,
  roundedRect,
} from "../../shared/canvas-animation.js";
import { ANIMATION_SCENES, createAnimationItems } from "../showcase-animation-assets.js";

const KEY_PREFIX = "showcase-photo-loop:";
const DEFAULT_SCENE = "jesteiColorPhotoLoop";

const CONFIG = {
  maxItems: 24,
  initialCount: 8,
  batchSize: 4,
  fps: 60,
  speedScale: 1,
  autoSpeed: 0.034,
  dragFactor: 1,
  momentumFriction: 0.92,
  hoverScale: 1.035,
  cardRatio: 1.25,
  gap: 14,
  radius: 14,
};

const noopDispose = () => {};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrap = (value, size) => ((value % size) + size) % size;

const getCanvas = (canvasOrId) => {
  if (typeof canvasOrId === "string") {
    return document.getElementById(canvasOrId);
  }

  return canvasOrId;
};

const ensureCanvasId = (canvas) => {
  if (!canvas.id) {
    canvas.id = "showcase-photo-loop-" + Math.random().toString(36).slice(2, 9);
  }

  return canvas.id;
};

const getMedia = (item) => item?.imageElement || item?.mediaElement || null;

const getMediaDimensions = (media) => ({
  width: Math.max(1, media?.videoWidth || media?.naturalWidth || media?.width || 1),
  height: Math.max(1, media?.videoHeight || media?.naturalHeight || media?.height || 1),
});

const drawCover = (ctx, media, x, y, width, height, radius) => {
  if (!media || width <= 0 || height <= 0) {
    return false;
  }

  const source = getMediaDimensions(media);
  const sourceRatio = source.width / source.height;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;

  if (sourceRatio > targetRatio) {
    sw = source.height * targetRatio;
    sx = (source.width - sw) * 0.5;
  } else {
    sh = source.width / targetRatio;
    sy = (source.height - sh) * 0.5;
  }

  ctx.save();

  if (radius > 0) {
    ctx.beginPath();
    roundedRect(ctx, x, y, width, height, Math.min(radius, width * 0.5, height * 0.5));
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(media, sx, sy, sw, sh, x, y, width, height);
  ctx.restore();

  return true;
};

const drawPlaceholder = (ctx, x, y, width, height, radius) => {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawEmptyState = (ctx, width, height) => {
  ctx.save();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;

  for (let x = -height; x < width + height; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.font = "700 12px Rubik, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("add images: 01.webp, 02.webp, ...", width * 0.5, height * 0.5);

  ctx.restore();
};

const getSceneItems = (canvas, options, maxItems) => {
  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_SCENE;
  const scene = ANIMATION_SCENES[sceneId];

  if (!scene) {
    return [];
  }

  const items = createAnimationItems(scene.modules || {});

  return limitAnimationItems(items, sceneId, {
    maxItems,
    defaultMaxItems: maxItems,
  });
};

const getMetrics = (width, height) => {
  const cardHeight = Math.max(96, height * 0.78);
  const cardWidth = cardHeight * CONFIG.cardRatio;

  return {
    cardWidth,
    cardHeight,
    step: cardWidth + CONFIG.gap,
    y: (height - cardHeight) * 0.5,
  };
};

export const mountShowcasePhotoLoop = (canvasOrId, options = {}) => {
  const canvas = getCanvas(canvasOrId);

  if (!canvas) {
    return noop;
  }

  const ctx = canvas.getContext("2d", { alpha: true });

  if (!ctx) {
    return noop;
  }

  const canvasId = ensureCanvasId(canvas);
  const key = createAnimationKey(KEY_PREFIX, canvasId);
  const token = beginMount(key);

  const tuning = getCanvasMountOptions(canvas, options, {
    maxItems: CONFIG.maxItems,
    initialCount: CONFIG.initialCount,
    batchSize: CONFIG.batchSize,
    fps: CONFIG.fps,
    speedScale: CONFIG.speedScale,
  });

  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_SCENE;
  const sourceItems = getSceneItems(canvas, options, tuning.maxItems);

  const loader = createMediaLoader(sourceItems, {
    maxItems: tuning.maxItems,
    initialCount: tuning.initialCount,
    batchSize: tuning.batchSize,
    sceneId,
  });

  const state = {
    disposed: false,
    offset: 0,
    velocity: 0,
    dragging: false,
    pointerX: 0,
    hoverX: null,
    hoverY: null,
  };

  const getPointer = (event) => {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event) => {
    state.dragging = true;
    state.pointerX = event.clientX;
    state.velocity = 0;
    canvas.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const pointer = getPointer(event);

    state.hoverX = pointer.x;
    state.hoverY = pointer.y;

    if (!state.dragging) {
      return;
    }

    const dx = event.clientX - state.pointerX;
    state.pointerX = event.clientX;
    state.offset -= dx * CONFIG.dragFactor;
    state.velocity = -dx;
  };

  const handlePointerUp = (event) => {
    state.dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
  };

  const handlePointerLeave = () => {
    state.hoverX = null;
    state.hoverY = null;
  };

  const handleWheel = (event) => {
    event.preventDefault();
    state.offset += event.deltaY || event.deltaX || 0;
  };

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    maxDpr: tuning.maxDpr,
    fps: tuning.fps,
    onActiveChange: (isActive) => loader.setPlaybackEnabled(isActive),
    renderFrame: ({ delta, width, height, reducedMotion }) => {
      if (state.disposed) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const loadedItems = loader.items.filter((item) => getMedia(item));

      if (!loadedItems.length) {
        drawEmptyState(ctx, width, height);
        return;
      }

      const metrics = getMetrics(width, height);
      const cycle = Math.max(1, metrics.step * loadedItems.length);

      if (!reducedMotion && !state.dragging) {
        state.offset += (delta || 16.67) * CONFIG.autoSpeed * tuning.speedScale + state.velocity;
        state.velocity *= CONFIG.momentumFriction;
      }

      state.offset = wrap(state.offset, cycle);

      for (let index = 0; index < loadedItems.length + 3; index += 1) {
        const item = loadedItems[index % loadedItems.length];
        let x = index * metrics.step - state.offset;

        while (x < -metrics.step) {
          x += cycle;
        }

        while (x > width + metrics.step) {
          x -= cycle;
        }

        const isHovered =
          state.hoverX !== null &&
          state.hoverX >= x &&
          state.hoverX <= x + metrics.cardWidth &&
          state.hoverY >= metrics.y &&
          state.hoverY <= metrics.y + metrics.cardHeight;

        const scale = isHovered ? CONFIG.hoverScale : 1;
        const drawWidth = metrics.cardWidth * scale;
        const drawHeight = metrics.cardHeight * scale;
        const drawX = x - (drawWidth - metrics.cardWidth) * 0.5;
        const drawY = metrics.y - (drawHeight - metrics.cardHeight) * 0.5;
        const media = getMedia(item);

        if (media) {
          drawCover(ctx, media, drawX, drawY, drawWidth, drawHeight, CONFIG.radius);
        } else {
          drawPlaceholder(ctx, drawX, drawY, drawWidth, drawHeight, CONFIG.radius);
        }
      }
    },
  });

  const dispose = completeMount(key, token, baseDispose);

  return () => {
    state.disposed = true;
    loader.cancel();

    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerUp);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("wheel", handleWheel);

    dispose();
  };
};

export const initShowcasePhotoLoop = (root = document) => {
  const mounted = [];

  root.querySelectorAll('[data-animation="photo-loop"] canvas').forEach((canvas) => {
    if (canvas.dataset.photoLoopMounted === "true") {
      return;
    }

    canvas.dataset.photoLoopMounted = "true";
    mounted.push(mountShowcasePhotoLoop(canvas));
  });

  return mounted;
};

export const disposeShowcasePhotoLoop = noopDispose;
