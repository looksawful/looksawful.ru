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

const KEY_PREFIX = "showcase-before-after:";
const DEFAULT_SCENE = "jesteiColorBeforeAfter";

const POINTER_HIT_SLOP = 22;

const CONFIG = {
  maxItems: 2,
  initialCount: 2,
  batchSize: 2,
  fps: 60,
  speedScale: 1,
  dividerMin: 0.14,
  dividerMax: 0.86,
  autoSpeed: 0.00018,
  lineWidth: 2,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getCanvas = (canvasOrId) => {
  if (typeof canvasOrId === "string") {
    return document.getElementById(canvasOrId);
  }

  return canvasOrId;
};

const ensureCanvasId = (canvas) => {
  if (!canvas.id) {
    canvas.id = "showcase-before-after-" + Math.random().toString(36).slice(2, 9);
  }

  return canvas.id;
};

const getMedia = (item) => item?.imageElement || item?.mediaElement || null;

const getMediaDimensions = (media) => ({
  width: Math.max(1, media?.videoWidth || media?.naturalWidth || media?.width || 1),
  height: Math.max(1, media?.videoHeight || media?.naturalHeight || media?.height || 1),
});

const drawCover = (ctx, media, x, y, width, height) => {
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

  ctx.drawImage(media, sx, sy, sw, sh, x, y, width, height);
  return true;
};

const drawEmptyState = (ctx, width, height, divider) => {
  const splitX = width * divider;

  ctx.save();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, splitX, height);

  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(splitX, 0, width - splitX, height);

  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = -height; x < width + height; x += 28) {
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
  }

  ctx.stroke();
  ctx.restore();
};

const drawChip = (ctx, text, x, y, fontSize = 12) => {
  const paddingX = Math.round(fontSize * 0.95);
  const paddingY = Math.round(fontSize * 0.55);

  ctx.save();
  ctx.font = "700 " + fontSize + "px Rubik, Arial, sans-serif";

  const chipWidth = Math.ceil(ctx.measureText(text).width + paddingX * 2);
  const chipHeight = Math.ceil(fontSize + paddingY * 2);

  ctx.beginPath();
  roundedRect(ctx, x - chipWidth * 0.5, y - chipHeight * 0.5, chipWidth, chipHeight, 999);
  ctx.closePath();

  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);

  ctx.restore();
};

const getSceneItems = (canvas, options, maxItems) => {
  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_SCENE;
  const scene = ANIMATION_SCENES[sceneId] || ANIMATION_SCENES[DEFAULT_SCENE];
  const items = createAnimationItems(scene?.modules || {});

  return limitAnimationItems(items, sceneId, {
    maxItems,
    defaultMaxItems: maxItems,
  });
};

export const mountShowcaseBeforeAfter = (canvasOrId, options = {}) => {
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
    divider: 0.5,
    direction: 1,
    dragging: false,
    hovering: false,
  };

  const getPointerRatio = (event) => {
    const rect = canvas.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0.02, 0.98);
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    state.dragging = true;
    state.hovering = true;
    state.divider = getPointerRatio(event);
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    state.hovering = true;

    if (state.dragging) {
      event.preventDefault();
      state.divider = getPointerRatio(event);
    }
  };

  const handlePointerUp = (event) => {
    state.dragging = false;
    canvas.style.cursor = "";
    canvas.releasePointerCapture?.(event.pointerId);
  };

  const handlePointerLeave = () => {
    state.hovering = false;
  };

  canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerLeave);

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

      const before = getMedia(loader.items[0]);
      const after = getMedia(loader.items[1]) || before;

      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion && !state.dragging && !state.hovering) {
        state.divider += state.direction * (delta || 16.67) * CONFIG.autoSpeed * tuning.speedScale;

        if (state.divider >= CONFIG.dividerMax || state.divider <= CONFIG.dividerMin) {
          state.direction *= -1;
          state.divider = clamp(state.divider, CONFIG.dividerMin, CONFIG.dividerMax);
        }
      }

      if (!before && !after) {
        drawEmptyState(ctx, width, height, state.divider);
      } else {
        const drewBefore = drawCover(ctx, before, 0, 0, width, height);

        if (!drewBefore) {
          drawEmptyState(ctx, width, height, state.divider);
        }

        const splitX = width * state.divider;

        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, width - splitX, height);
        ctx.clip();
        drawCover(ctx, after || before, 0, 0, width, height);
        ctx.restore();
      }

      const splitX = width * state.divider;

      ctx.save();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = CONFIG.lineWidth + 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = CONFIG.lineWidth;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();

      ctx.restore();

      drawChip(ctx, canvas.dataset.beforeLabel || "до", 36, 28, 11);
      drawChip(ctx, canvas.dataset.afterLabel || "после", width - 48, 28, 11);
      drawChip(ctx, canvas.dataset.centerLabel || "нажми меня", splitX, height * 0.5, 13);
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

    dispose();
  };
};

export const initShowcaseBeforeAfter = (root = document) => {
  const mounted = [];

  root.querySelectorAll('[data-animation="before-after"] canvas').forEach((canvas) => {
    if (canvas.dataset.beforeAfterMounted === "true") {
      return;
    }

    canvas.dataset.beforeAfterMounted = "true";
    mounted.push(mountShowcaseBeforeAfter(canvas));
  });

  return mounted;
};
