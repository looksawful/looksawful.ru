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

const CONFIG = {
  motion: {
    cardIntervalSec: 3.4,
    centerPauseSec: 1.45,
    direction: 1,
    minSlots: 5,
    visibleSlotSpan: 0.74,
    startPhase: 0,
    easeMotion: true,
  },

  path: {
    overscan: 0.42,
    rotationDeg: -7,
    start: [-0.08, 1.1],
    controlA: [0.12, 0.78],
    center: [0.5, 0.5],
    controlB: [0.78, 0.22],
    end: [1.1, -0.08],
  },

  card: {
    maxSizeRatio: 0.9,
    maxSizePx: 620,
    minSizePx: 12,
    minScale: 0.045,
    centerHold: 0.08,
    scaleCurve: 1.15,
    imageFit: "contain",
  },

  perspective: {
    focalLength: 0.72,
    depth: 0.95,
    edgePush: 0.18,
    sizeInfluence: 0.16,
    center: [0.5, 0.5],
  },

  render: {
    background: "#ffffff",
    smoothing: true,
    maxDpr: 2,
  },
};

const KEY_PREFIX = "showcase-diagonal-loop:";
const DEFAULT_SCENE = "jesteiDepthDiagonalLoop";
const DEFAULT_CARD_RADIUS = 12;

const parseCssLength = (value, fallback = DEFAULT_CARD_RADIUS, elementStyles = null, rootStyles = null) => {
  const input = String(value || "").trim();

  if (!input) {
    return fallback;
  }

  const numeric = Number.parseFloat(input);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (input.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(rootStyles?.fontSize) || 16;
    return numeric * rootFontSize;
  }

  if (input.endsWith("em")) {
    const fontSize = Number.parseFloat(elementStyles?.fontSize) || Number.parseFloat(rootStyles?.fontSize) || 16;
    return numeric * fontSize;
  }

  return numeric;
};

const getDesignRadius = (canvas) => {
  const win = globalThis.window;
  const doc = globalThis.document;
  const elementStyles = win?.getComputedStyle?.(canvas) || null;
  const rootStyles = doc?.documentElement ? win?.getComputedStyle?.(doc.documentElement) || null : null;
  const radiusToken = elementStyles?.getPropertyValue("--r") || rootStyles?.getPropertyValue("--r");

  return parseCssLength(radiusToken, DEFAULT_CARD_RADIUS, elementStyles, rootStyles);
};

const getCanvas = (canvasOrId) => {
  if (typeof canvasOrId === "string") {
    return document.getElementById(canvasOrId);
  }

  return canvasOrId;
};

const ensureCanvasId = (canvas) => {
  if (!canvas.id) {
    canvas.id = "diagonal-loop-canvas-" + Math.random().toString(36).slice(2, 9);
  }

  return canvas.id;
};

const getMedia = (item) => item?.imageElement || item?.mediaElement || null;

const getMediaSize = (media) => ({
  width: Math.max(1, media?.videoWidth || media?.naturalWidth || media?.width || 1),
  height: Math.max(1, media?.videoHeight || media?.naturalHeight || media?.height || 1),
});

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

class DiagonalLoopCanvas {
  constructor(canvas, ctx, loader, config) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.loader = loader;
    this.config = config;

    this.state = {
      width: 0,
      height: 0,
      phase: this.config.motion.startPhase,
      images: [],
    };

    this.cardRadius = getDesignRadius(canvas);
    this.lastImageCount = -1;
    this.disposed = false;
  }

  syncImages() {
    const nextImages = this.loader.items.map((item) => getMedia(item)).filter(Boolean);

    if (nextImages.length === this.lastImageCount) {
      return;
    }

    this.state.images = nextImages;
    this.lastImageCount = nextImages.length;
  }

  resize(width, height) {
    this.state.width = Math.max(1, width);
    this.state.height = Math.max(1, height);
    this.ctx.imageSmoothingEnabled = this.config.render.smoothing;
    this.cardRadius = getDesignRadius(this.canvas);
  }

  tick(deltaSeconds, reducedMotion) {
    this.syncImages();

    if (!reducedMotion) {
      this.state.phase += (deltaSeconds / this.config.motion.cardIntervalSec) * this.config.motion.direction;
    }
  }

  draw() {
    const width = this.state.width;
    const height = this.state.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.config.render.background;
    ctx.fillRect(0, 0, width, height);

    if (!this.state.images.length) return;

    const slotCount = Math.max(this.state.images.length, this.config.motion.minSlots);
    const visibleSpan = this.config.motion.visibleSlotSpan;
    const cards = [];

    for (let slot = 0; slot < slotCount; slot += 1) {
      const local = this.signedLoopDistance(this.state.phase, slot, slotCount);

      if (Math.abs(local) > visibleSpan) continue;

      const progress = this.localToProgress(local, visibleSpan);
      const pulse = this.centerPulse(progress);
      const lens = this.perspectiveAt(progress);
      const size = this.cardSize(pulse, lens.scale, width, height);

      if (size < 1) continue;

      const point = this.projectPoint(this.trackPoint(progress, width, height), lens, width, height);
      const centerWeight = 1 - Math.min(1, Math.abs(local) / visibleSpan);
      const image = this.state.images[slot % this.state.images.length];
      const frame = this.cardFrame(image, size);

      cards.push({
        image,
        x: point.x,
        y: point.y,
        width: frame.width,
        height: frame.height,
        size: Math.max(frame.width, frame.height),
        z: centerWeight,
      });
    }

    cards.sort((a, b) => a.z - b.z);

    for (const card of cards) {
      this.drawCard(card);
    }
  }

  signedLoopDistance(phase, index, count) {
    let d = phase - index;

    d = ((((d + count * 0.5) % count) + count) % count) - count * 0.5;

    return d;
  }

  localToProgress(local, visibleSpan) {
    const pauseSlots = clamp(
      this.config.motion.centerPauseSec / this.config.motion.cardIntervalSec,
      0,
      visibleSpan * 1.4,
    );
    const pauseHalf = pauseSlots * 0.5;
    const moveSpan = Math.max(0.0001, visibleSpan - pauseHalf);

    if (local < -pauseHalf) {
      const t = (local + visibleSpan) / moveSpan;
      return this.ease01(t) * 0.5;
    }

    if (local > pauseHalf) {
      const t = (local - pauseHalf) / moveSpan;
      return 0.5 + this.ease01(t) * 0.5;
    }

    return 0.5;
  }

  ease01(t) {
    const x = clamp(t, 0, 1);

    if (!this.config.motion.easeMotion) return x;

    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  trackPoint(progress, width, height) {
    const point =
      progress < 0.5
        ? this.quadraticPoint(
            this.configPoint("start", width, height),
            this.configPoint("controlA", width, height),
            this.configPoint("center", width, height),
            progress * 2,
          )
        : this.quadraticPoint(
            this.configPoint("center", width, height),
            this.configPoint("controlB", width, height),
            this.configPoint("end", width, height),
            (progress - 0.5) * 2,
          );

    return this.rotatePoint(point.x, point.y, width * 0.5, height * 0.5, degToRad(this.config.path.rotationDeg));
  }

  configPoint(name, width, height) {
    const p = this.config.path[name];
    const overscan = Math.max(width, height) * this.config.path.overscan;

    return {
      x: p[0] * width + (p[0] < 0 ? -overscan : p[0] > 1 ? overscan : 0),
      y: p[1] * height + (p[1] < 0 ? -overscan : p[1] > 1 ? overscan : 0),
    };
  }

  quadraticPoint(a, b, c, t) {
    const mt = 1 - t;

    return {
      x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
      y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y,
    };
  }

  rotatePoint(x, y, cx, cy, angle) {
    const dx = x - cx;
    const dy = y - cy;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  }

  centerPulse(progress) {
    const d = Math.abs(progress - 0.5);
    const hold = this.config.card.centerHold;

    if (d <= hold) return 1;

    return 1 - smoothstep(hold, 0.5, d);
  }

  cardSize(pulse, perspectiveScale, width, height) {
    const maxSize = Math.min(Math.min(width, height) * this.config.card.maxSizeRatio, this.config.card.maxSizePx);
    const minSize = Math.max(this.config.card.minSizePx, maxSize * this.config.card.minScale);
    const shapedPulse = Math.pow(clamp(pulse, 0, 1), this.config.card.scaleCurve);
    const lensSize = 1 - (1 - perspectiveScale) * this.config.perspective.sizeInfluence;

    return (minSize + (maxSize - minSize) * shapedPulse) * lensSize;
  }

  perspectiveAt(progress) {
    const edge = Math.abs(progress - 0.5) * 2;
    const z = edge * this.config.perspective.depth;
    const scale = this.config.perspective.focalLength / (this.config.perspective.focalLength + z);

    return {
      edge,
      scale,
    };
  }

  projectPoint(point, lens, width, height) {
    const cx = width * this.config.perspective.center[0];
    const cy = height * this.config.perspective.center[1];
    const push = (1 / Math.max(lens.scale, 0.001) - 1) * this.config.perspective.edgePush;

    return {
      x: cx + (point.x - cx) * (1 + push),
      y: cy + (point.y - cy) * (1 + push),
    };
  }

  drawCard(card) {
    const x = card.x - card.width * 0.5;
    const y = card.y - card.height * 0.5;

    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    roundedRect(ctx, x, y, card.width, card.height, Math.min(this.cardRadius, card.width * 0.5, card.height * 0.5));
    ctx.closePath();
    ctx.clip();
    this.drawImageCover(card.image, x, y, card.width, card.height);
    ctx.restore();
  }

  cardFrame(image, maxSide) {
    const source = getMediaSize(image);
    const ratio = source.width / source.height;

    if (ratio >= 1) {
      return {
        width: maxSide,
        height: maxSide / ratio,
      };
    }

    return {
      width: maxSide * ratio,
      height: maxSide,
    };
  }

  drawImageCover(image, x, y, w, h) {
    const source = getMediaSize(image);
    const iw = source.width;
    const ih = source.height;

    const scale = this.config.card.imageFit === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
    const sw = iw * scale;
    const sh = ih * scale;

    this.ctx.drawImage(image, x + (w - sw) * 0.5, y + (h - sh) * 0.5, sw, sh);
  }
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export const mountShowcaseDiagonalLoop = (canvasOrId, options = {}) => {
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
    maxItems: options.maxItems || 18,
    initialCount: options.initialCount || 6,
    batchSize: options.batchSize || 4,
    fps: options.fps || 60,
    speedScale: options.speedScale || 1,
  });

  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_SCENE;
  const sourceItems = getSceneItems(canvas, options, tuning.maxItems);

  const loader = createMediaLoader(sourceItems, {
    maxItems: tuning.maxItems,
    initialCount: tuning.initialCount,
    batchSize: tuning.batchSize,
    sceneId,
  });

  const controller = new DiagonalLoopCanvas(canvas, ctx, loader, CONFIG);

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    maxDpr: tuning.maxDpr || CONFIG.render.maxDpr,
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
    controller.disposed = true;
    loader.cancel();
    dispose();
  };
};

export const initShowcaseDiagonalLoop = (root = document) => {
  const mounted = [];

  root.querySelectorAll('[data-animation="diagonal-loop"] canvas').forEach((canvas) => {
    if (canvas.dataset.diagonalLoopMounted === "true") {
      return;
    }

    canvas.dataset.diagonalLoopMounted = "true";
    mounted.push(mountShowcaseDiagonalLoop(canvas));
  });

  return mounted;
};
