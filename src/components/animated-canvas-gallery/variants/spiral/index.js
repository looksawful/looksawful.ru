import { createCanvasInteractions } from "../../runtime/interactions.js";

const activeInstances = new WeakMap();
const imageCache = new Map();

export const SPIRAL_DEFAULTS = Object.freeze({
  speed: 0.00004,
  turns: 1.5,
  cardScale: 0.25,
  cardGrowthScale: 1.5,
  radiusScale: 0.4,
  alphaScale: 2,
  cardRadiusScale: 0.1,
  direction: -1,
  rotationOffset: Math.PI / 2,
  maxDpr: 2,
  paused: false,
  pauseOnReducedMotion: true,
  interaction: {},
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

const resolveCanvas = (target) => {
  if (target?.getContext) return target;
  if (typeof target !== "string" || typeof document === "undefined") return null;
  return document.querySelector(target) || document.getElementById(target.replace(/^#/, ""));
};

const sourceOf = (item) =>
  typeof item === "string" ? item : item?.src || item?.imageUrl || item?.url || "";

const loadImage = (source, label) => {
  if (!source) return Promise.reject(new Error(`${label} item has no image source.`));
  if (imageCache.has(source)) return imageCache.get(source);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* loaded images remain drawable */ }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`${label} failed to load ${source}`));
    image.src = source;
  }).catch((error) => {
    imageCache.delete(source);
    throw error;
  });
  imageCache.set(source, promise);
  return promise;
};

const loadItems = async (items, label) => {
  const results = await Promise.allSettled(
    (Array.isArray(items) ? items : []).map(async (item, sourceIndex) => ({
      ...(typeof item === "object" ? item : {}),
      sourceIndex,
      src: sourceOf(item),
      title: typeof item === "object" ? item.title || "" : "",
      image: await loadImage(sourceOf(item), label),
    })),
  );
  return results.filter((result) => result.status === "fulfilled").map((result) => result.value);
};

const roundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(Math.max(0, radius), width * 0.5, height * 0.5);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawCover = (ctx, image, x, y, width, height, radius) => {
  if (!image?.naturalWidth || !image?.naturalHeight || width <= 0 || height <= 0) return;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = sourceHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) * 0.5;
  } else {
    sourceHeight = sourceWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) * 0.5;
  }
  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
};

const mergeOptions = (current, next = {}) => ({
  ...current,
  ...next,
  interaction: {
    ...(current?.interaction || {}),
    ...(next?.interaction || {}),
  },
});

const createLoop = ({ canvas, ctx, getOptions, render, invalidate = () => {} }) => {
  let disposed = false;
  let frameId = null;
  let lastTime = 0;
  let elapsed = 0;
  let manuallyPaused = Boolean(getOptions().paused);
  let documentHidden = Boolean(document.hidden);
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const measure = () => ({
    width: Math.max(1, canvas.clientWidth || 1),
    height: Math.max(1, canvas.clientHeight || 1),
  });

  const redraw = () => {
    if (disposed) return;
    const { width, height } = measure();
    const dpr = Math.min(Math.max(1, devicePixelRatio || 1), Math.max(1, getOptions().maxDpr || 2));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      invalidate();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render({ elapsed, width, height, reducedMotion });
  };

  const shouldAnimate = () =>
    !disposed && !manuallyPaused && !documentHidden && !(reducedMotion && getOptions().pauseOnReducedMotion);

  const cancel = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastTime = 0;
  };

  const frame = (time) => {
    if (!shouldAnimate()) {
      cancel();
      redraw();
      return;
    }
    const dt = lastTime ? Math.min(64, time - lastTime) : 0;
    lastTime = time;
    elapsed += dt;
    const { width, height } = measure();
    render({ elapsed, width, height, reducedMotion });
    frameId = requestAnimationFrame(frame);
  };

  const sync = () => {
    cancel();
    redraw();
    if (shouldAnimate()) frameId = requestAnimationFrame(frame);
  };

  const handleVisibility = () => { documentHidden = document.hidden; sync(); };
  const handleMotion = () => { reducedMotion = motionQuery.matches; sync(); };
  const resizeObserver = new ResizeObserver(redraw);
  resizeObserver.observe(canvas);
  addEventListener("resize", redraw, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  motionQuery.addEventListener?.("change", handleMotion);
  sync();

  return {
    pause() { manuallyPaused = true; sync(); },
    play() { manuallyPaused = false; sync(); },
    redraw,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      resizeObserver.disconnect();
      removeEventListener("resize", redraw);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotion);
    },
    getState() { return { paused: manuallyPaused, reducedMotion, elapsed }; },
  };
};

const rotatedPolygon = (centerX, centerY, width, height, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [-width / 2, -height / 2], [width / 2, -height / 2],
    [width / 2, height / 2], [-width / 2, height / 2],
  ].map(([x, y]) => ({ x: centerX + x * cos - y * sin, y: centerY + x * sin + y * cos }));
};

export async function mountSpiral(target, userOptions = {}) {
  const canvas = resolveCanvas(target);
  if (!canvas) throw new Error("mountSpiral: canvas not found.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mountSpiral: 2D context is unavailable.");
  activeInstances.get(canvas)?.dispose();

  let options = mergeOptions(SPIRAL_DEFAULTS, userOptions);
  let items = await loadItems(options.items, "Spiral");
  let requestRender = () => {};
  const interaction = createCanvasInteractions({ canvas, getOptions: () => options, requestRender: () => requestRender() });

  const render = ({ elapsed, width, height, reducedMotion }) => {
    ctx.clearRect(0, 0, width, height);
    if (!items.length) { interaction.setRegions([]); return; }
    const state = interaction.advance({ elapsed, laneCount: 0 });
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const minSide = Math.min(width, height);
    const maxSide = Math.max(width, height);
    const phase = reducedMotion && options.pauseOnReducedMotion ? 0 : state.globalTime * options.speed;
    const regions = [];

    items.forEach((item, index) => {
      const t = mod(index / items.length + phase, 1);
      const angle = options.direction * t * Math.PI * 2 * options.turns + options.rotationOffset;
      const size = Math.max(1, minSide * options.cardScale * t * options.cardGrowthScale);
      const radius = size + t * maxSide * options.radiusScale;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const rotation = angle + Math.PI / 2;
      const baseRegion = { key: `spiral:${item.sourceIndex}`, item, width: size, height: size };
      const scale = interaction.getCardScale(baseRegion, 0);
      const drawSize = size * scale;
      const region = { ...baseRegion, width: drawSize, height: drawSize, polygon: rotatedPolygon(x, y, drawSize, drawSize, rotation) };
      regions.push(region);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * options.alphaScale);
      ctx.translate(x, y);
      ctx.rotate(rotation);
      drawCover(ctx, item.image, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize, drawSize * options.cardRadiusScale);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    interaction.setRegions(regions);
  };

  const loop = createLoop({ canvas, ctx, getOptions: () => options, render });
  requestRender = loop.redraw;
  const controller = {
    pause: loop.pause,
    play: loop.play,
    async update(nextOptions = {}) {
      options = mergeOptions(options, nextOptions);
      if (Object.hasOwn(nextOptions, "items")) items = await loadItems(nextOptions.items, "Spiral");
      loop.redraw();
      return controller;
    },
    async setItems(nextItems) { return controller.update({ items: nextItems }); },
    dispose() {
      interaction.dispose();
      loop.dispose();
      if (activeInstances.get(canvas) === controller) activeInstances.delete(canvas);
    },
    getState() { return { ...loop.getState(), interaction: interaction.getState(), options: { ...options }, itemCount: items.length }; },
  };
  activeInstances.set(canvas, controller);
  return controller;
}
