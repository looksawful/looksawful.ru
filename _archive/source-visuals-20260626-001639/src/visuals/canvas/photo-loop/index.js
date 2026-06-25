import {
  beginMount,
  completeMount,
  createAnimationKey,
  createCanvasAnimation,
  createMediaLoader,
  getCanvasMountOptions,
  limitAnimationItems,
  noop,
} from "../../shared/canvas-animation.js";
import { ANIMATION_SCENES, createAnimationItems } from "../showcase-animation-assets.js";

const CONFIG = {
  autoSpeed: 42,
  direction: 1,
  hoverAutoFactor: 0,
  hoverStopEase: 0.075,
  resumeEase: 0.045,
  dragSensitivity: 1.12,
  dragFriction: 0.82,
  momentumFriction: 0.92,
  dragReleaseBoost: 0.62,
  cardSize: {
    min: 120,
    max: 320,
    viewportRatio: 0.42,
    containerHeightRatio: 0.72,
  },
  gap: {
    min: 36,
    max: 96,
    cardRatio: 0.28,
  },
  hoverScale: 1.08,
  hoverEase: 0.13,
  offscreenSteps: 3,
  minimumTrackCopies: 2,
  imageSmoothing: true,
  background: "#fff",
  pixelRatioLimit: 2,
};

const KEY_PREFIX = "showcase-photo-loop:";
const DEFAULT_SCENE = "jesteiColorPhotoLoop";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function positiveModulo(value, modulus) {
  if (!modulus) return value;
  return ((value % modulus) + modulus) % modulus;
}

const getCanvas = (canvasOrId) => {
  if (typeof canvasOrId === "string") {
    return document.getElementById(canvasOrId);
  }

  return canvasOrId;
};

const ensureCanvasId = (canvas) => {
  if (!canvas.id) {
    canvas.id = "photo-loop-canvas-" + Math.random().toString(36).slice(2, 9);
  }

  return canvas.id;
};

const getMedia = (item) => item?.imageElement || item?.mediaElement || null;

const getMediaSize = (media) => ({
  width: Math.max(1, media?.videoWidth || media?.naturalWidth || media?.width || 1),
  height: Math.max(1, media?.videoHeight || media?.naturalHeight || media?.height || 1),
});

const drawImageCover = (ctx, media, x, y, width, height) => {
  if (!media || !width || !height) return;

  const source = getMediaSize(media);
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

class PhotoLoopCanvas {
  constructor(canvas, ctx, loader, config) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.loader = loader;
    this.config = config;
    this.images = [];
    this.items = [];
    this.width = 0;
    this.height = 0;
    this.cardSize = 0;
    this.gap = 0;
    this.step = 0;
    this.trackLength = 0;
    this.offset = 0;
    this.hoveredId = null;
    this.pointer = { x: 0, y: 0, active: false };
    this.drag = { active: false, id: null, lastX: 0, velocity: 0 };
    this.autoFactor = 1;
    this.targetAutoFactor = 1;
    this.externalVelocity = 0;
    this.disposed = false;
    this.lastImageCount = -1;

    this.onPointerEnter = (event) => {
      this.pointer.active = true;
      this.setPointer(event);
    };

    this.onPointerMove = (event) => {
      this.pointer.active = true;
      this.setPointer(event);

      if (!this.drag.active) return;

      const dx = event.clientX - this.drag.lastX;
      this.offset += dx * this.config.dragSensitivity;
      this.drag.velocity = dx;
      this.drag.lastX = event.clientX;
      this.keepOffsetInRange();
    };

    this.onPointerLeave = () => {
      this.pointer.active = false;
      this.hoveredId = null;

      if (this.drag.active) this.endDrag();
    };

    this.onPointerDown = (event) => {
      this.canvas.setPointerCapture?.(event.pointerId);
      this.canvas.classList.add("is-dragging");
      this.drag.active = true;
      this.drag.id = event.pointerId;
      this.drag.lastX = event.clientX;
      this.drag.velocity = 0;
      this.setPointer(event);
    };

    this.onPointerUp = () => this.endDrag();
    this.onPointerCancel = () => this.endDrag();
this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener("pointerenter", this.onPointerEnter);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  destroy() {
    this.disposed = true;
    this.canvas.classList.remove("is-dragging");

    this.canvas.removeEventListener("pointerenter", this.onPointerEnter);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
  }

  syncImages() {
    const nextImages = this.loader.items.map((item) => getMedia(item)).filter(Boolean);

    if (nextImages.length === this.lastImageCount) {
      return;
    }

    this.images = nextImages;
    this.lastImageCount = nextImages.length;
    this.buildItems();
  }

  setPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
  }

  endDrag() {
    if (!this.drag.active) return;

    this.canvas.classList.remove("is-dragging");
    this.externalVelocity += this.drag.velocity * this.config.dragReleaseBoost;
    this.drag.active = false;
    this.drag.id = null;
  }

  resize(width, height) {
    const previousTrackLength = this.trackLength;

    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.ctx.imageSmoothingEnabled = this.config.imageSmoothing;

    const sizeByWidth = this.width * this.config.cardSize.viewportRatio;
    const sizeByHeight = this.height * this.config.cardSize.containerHeightRatio;

    this.cardSize = clamp(Math.min(sizeByWidth, sizeByHeight), this.config.cardSize.min, this.config.cardSize.max);

    this.gap = clamp(this.cardSize * this.config.gap.cardRatio, this.config.gap.min, this.config.gap.max);

    this.step = this.cardSize + this.gap;

    this.buildItems();

    if (previousTrackLength > 0 && this.trackLength > 0) {
      this.offset = (this.offset / previousTrackLength) * this.trackLength;
    }

    this.keepOffsetInRange();
  }

  buildItems() {
    if (!this.images.length || !this.step) {
      this.items = [];
      this.trackLength = 0;
      return;
    }

    const visibleWidth = this.width + this.step * this.config.offscreenSteps * 2;
    const visibleItems = Math.ceil(visibleWidth / this.step) + 1;
    const imageCount = this.images.length;

    const requiredCopies = Math.max(this.config.minimumTrackCopies, Math.ceil(visibleItems / imageCount) + 1);

    const total = imageCount * requiredCopies;

    this.items = Array.from({ length: total }, (_, index) => ({
      id: index,
      image: this.images[index % imageCount],
      scale: 1,
      targetScale: 1,
    }));

    this.trackLength = total * this.step;
  }

  tick(deltaSeconds, reducedMotion) {
    this.syncImages();

    if (!this.items.length) return;

    if (!reducedMotion) {
      this.update(deltaSeconds);
    } else {
      this.updateHover();

      for (const item of this.items) {
        item.targetScale = item.id === this.hoveredId ? this.config.hoverScale : 1;
        item.scale += (item.targetScale - item.scale) * this.config.hoverEase;
      }
    }
  }

  update(dt) {
    this.updateHover();

    this.targetAutoFactor = this.hoveredId !== null || this.drag.active ? this.config.hoverAutoFactor : 1;

    const ease = this.targetAutoFactor < this.autoFactor ? this.config.hoverStopEase : this.config.resumeEase;

    this.autoFactor += (this.targetAutoFactor - this.autoFactor) * ease;

    this.offset += this.config.autoSpeed * this.config.direction * this.autoFactor * dt;
    this.offset += this.externalVelocity;

    this.externalVelocity *= this.drag.active ? this.config.dragFriction : this.config.momentumFriction;

    if (Math.abs(this.externalVelocity) < 0.01) {
      this.externalVelocity = 0;
    }

    this.keepOffsetInRange();

    for (const item of this.items) {
      item.targetScale = item.id === this.hoveredId ? this.config.hoverScale : 1;
      item.scale += (item.targetScale - item.scale) * this.config.hoverEase;
    }
  }

  updateHover() {
    if (!this.pointer.active || this.drag.active || !this.items.length) {
      this.hoveredId = null;
      return;
    }

    let hit = null;
    const y = (this.height - this.cardSize) / 2;

    for (const item of this.items) {
      const x = this.getItemX(item.id);
      const currentScale = item.id === this.hoveredId ? this.config.hoverScale : item.scale;

      const size = this.cardSize * currentScale;
      const drawX = x - (size - this.cardSize) / 2;
      const drawY = y - (size - this.cardSize) / 2;

      const insideX = this.pointer.x >= drawX && this.pointer.x <= drawX + size;
      const insideY = this.pointer.y >= drawY && this.pointer.y <= drawY + size;

      if (insideX && insideY) {
        hit = item.id;
        break;
      }
    }

    this.hoveredId = hit;
  }

  getItemX(index) {
    if (!this.trackLength) return 0;

    const start = -this.step * this.config.offscreenSteps;

    return start + positiveModulo(index * this.step + this.offset - start, this.trackLength);
  }

  keepOffsetInRange() {
    if (!this.trackLength) return;

    this.offset = positiveModulo(this.offset, this.trackLength);
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.config.background;
    ctx.fillRect(0, 0, this.width, this.height);

    if (!this.items.length) return;

    const y = (this.height - this.cardSize) / 2;

    for (const item of this.items) {
      const x = this.getItemX(item.id);

      if (x > this.width + this.step || x + this.cardSize < -this.step) {
        continue;
      }

      const size = this.cardSize * item.scale;
      const drawX = x - (size - this.cardSize) / 2;
      const drawY = y - (size - this.cardSize) / 2;

      drawImageCover(ctx, item.image, drawX, drawY, size, size);
    }
  }
}

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

  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_SCENE;
  const scene = ANIMATION_SCENES[sceneId];
  const tuning = getCanvasMountOptions(canvas, options, {
    maxItems: options.maxItems || scene?.defaultMaxItems || 24,
    initialCount: options.initialCount || 8,
    batchSize: options.batchSize || 4,
    fps: options.fps || 60,
    speedScale: options.speedScale || 1,
  });

  const sourceItems = getSceneItems(canvas, options, tuning.maxItems);

  const loader = createMediaLoader(sourceItems, {
    maxItems: tuning.maxItems,
    initialCount: tuning.initialCount,
    batchSize: tuning.batchSize,
    sceneId,
  });

  const controller = new PhotoLoopCanvas(canvas, ctx, loader, {
    ...CONFIG,
    pixelRatioLimit: tuning.maxDpr || CONFIG.pixelRatioLimit,
  });

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    maxDpr: tuning.maxDpr || CONFIG.pixelRatioLimit,
    fps: tuning.fps,
    onActiveChange: (isActive) => loader.setPlaybackEnabled(isActive),
    renderFrame: ({ delta, width, height, reducedMotion }) => {
      if (controller.disposed) return;

      controller.resize(width, height);
      controller.tick(Math.min((delta || 16.67) / 1000, 0.05) * tuning.speedScale, reducedMotion);
      controller.draw();
    },
  });

  const dispose = completeMount(key, token, baseDispose);

  return () => {
    controller.destroy();
    loader.cancel();
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
