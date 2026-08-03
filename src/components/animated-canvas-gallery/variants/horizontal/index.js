import { createCanvasInteractions } from "../../runtime/interactions.js";

const activeInstances = new WeakMap();
const imageCache = new Map();

export const HORIZONTAL_DEFAULTS = Object.freeze({
  rows: 4,
  gap: 8,
  speed: 0.04,
  rowSpeeds: null,
  directions: null,
  rowOffsets: null,
  angle: 0,
  radius: 8,
  minRatio: 0.55,
  maxRatio: 2.4,
  overscan: 0,
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

const getPlaneSize = (width, height, angle, overscan) => angle === 0
  ? { width, height }
  : {
      width: Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle)) + overscan * 2,
      height: Math.abs(height * Math.cos(angle)) + Math.abs(width * Math.sin(angle)) + overscan * 2,
    };

const buildRow = ({ items, rowIndex, rowHeight, planeWidth, gap, minRatio, maxRatio }) => {
  if (!items.length) return { tiles: [], cycleLength: 1 };
  const tiles = [];
  let length = 0;
  let cursor = rowIndex * 5;
  const required = planeWidth * 1.35;
  while (length < required || tiles.length < items.length) {
    const item = items[cursor % items.length];
    const ratio = clamp(item.image.naturalWidth / item.image.naturalHeight, minRatio, maxRatio);
    const width = rowHeight * ratio;
    tiles.push({ item, width });
    length += width + gap;
    cursor += 1;
  }
  return { tiles, cycleLength: Math.max(1, length) };
};

const transformPoint = (x, y, plane, canvasWidth, canvasHeight, angle) => {
  if (angle === 0) return { x, y };
  const localX = x - plane.width * 0.5;
  const localY = y - plane.height * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: canvasWidth * 0.5 + localX * cos - localY * sin,
    y: canvasHeight * 0.5 + localX * sin + localY * cos,
  };
};

const drawRow = ({ ctx, row, rowIndex, y, rowHeight, plane, canvasWidth, canvasHeight, angle, offset, direction, gap, radius, interaction, regions }) => {
  if (!row.tiles.length) return;
  const cycle = row.cycleLength;
  const normalized = mod(offset, cycle);
  let start = direction < 0 ? -normalized : normalized - cycle;
  while (start > -cycle) start -= cycle;
  let copyIndex = -1;
  for (let cycleStart = start; cycleStart < plane.width + cycle; cycleStart += cycle) {
    copyIndex += 1;
    let x = cycleStart;
    for (let tileIndex = 0; tileIndex < row.tiles.length; tileIndex += 1) {
      const tile = row.tiles[tileIndex];
      if (x < plane.width && x + tile.width > 0) {
        const baseRegion = { key: `horizontal:${rowIndex}:${tileIndex}:${copyIndex}`, item: tile.item, width: tile.width, height: rowHeight };
        const scale = interaction.getCardScale(baseRegion, gap);
        const drawWidth = tile.width * scale;
        const drawHeight = rowHeight * scale;
        const drawX = x - (drawWidth - tile.width) * 0.5;
        const drawY = y - (drawHeight - rowHeight) * 0.5;
        drawCover(ctx, tile.item.image, drawX, drawY, drawWidth, drawHeight, radius * scale);
        const polygon = [
          transformPoint(drawX, drawY, plane, canvasWidth, canvasHeight, angle),
          transformPoint(drawX + drawWidth, drawY, plane, canvasWidth, canvasHeight, angle),
          transformPoint(drawX + drawWidth, drawY + drawHeight, plane, canvasWidth, canvasHeight, angle),
          transformPoint(drawX, drawY + drawHeight, plane, canvasWidth, canvasHeight, angle),
        ];
        regions.push({ ...baseRegion, width: drawWidth, height: drawHeight, polygon });
      }
      x += tile.width + gap;
    }
  }
};

export async function mountHorizontal(target, userOptions = {}) {
  const canvas = resolveCanvas(target);
  if (!canvas) throw new Error("mountHorizontal: canvas not found.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mountHorizontal: 2D context is unavailable.");
  activeInstances.get(canvas)?.dispose();

  let options = mergeOptions(HORIZONTAL_DEFAULTS, userOptions);
  let items = await loadItems(options.items, "Horizontal");
  let layout = null;
  let requestRender = () => {};
  const interaction = createCanvasInteractions({ canvas, getOptions: () => options, laneAxis: "rows", requestRender: () => requestRender() });

  const ensureLayout = (width, height) => {
    const rowCount = Math.max(1, Math.floor(options.rows));
    const plane = getPlaneSize(width, height, options.angle, options.overscan);
    const rowHeight = Math.max(1, (plane.height - options.gap * (rowCount - 1)) / rowCount);
    if (layout && layout.width === width && layout.height === height && layout.itemCount === items.length && layout.rowCount === rowCount && layout.angle === options.angle && layout.gap === options.gap) return layout;
    layout = {
      width, height, plane, rowCount, rowHeight, itemCount: items.length, angle: options.angle, gap: options.gap,
      rows: Array.from({ length: rowCount }, (_, rowIndex) => buildRow({ items, rowIndex, rowHeight, planeWidth: plane.width, gap: options.gap, minRatio: options.minRatio, maxRatio: options.maxRatio })),
    };
    return layout;
  };

  const render = ({ elapsed, width, height, reducedMotion }) => {
    ctx.clearRect(0, 0, width, height);
    if (!items.length) { interaction.setRegions([]); return; }
    const current = ensureLayout(width, height);
    const motionState = interaction.advance({ elapsed, laneCount: current.rowCount });
    const regions = [];
    ctx.save();
    if (options.angle !== 0) {
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(options.angle);
      ctx.translate(-current.plane.width * 0.5, -current.plane.height * 0.5);
    }
    current.rows.forEach((row, rowIndex) => {
      const speed = options.rowSpeeds?.[rowIndex] ?? options.speed * (0.82 + (rowIndex % 4) * 0.11);
      const direction = options.directions?.[rowIndex] ?? (rowIndex % 2 ? 1 : -1);
      const initialOffset = options.rowOffsets?.[rowIndex] ?? rowIndex * 137;
      const motionTime = reducedMotion && options.pauseOnReducedMotion ? 0 : (motionState.laneTimes[rowIndex] ?? motionState.globalTime);
      drawRow({
        ctx, row, rowIndex, y: rowIndex * (current.rowHeight + options.gap), rowHeight: current.rowHeight,
        plane: current.plane, canvasWidth: width, canvasHeight: height, angle: options.angle,
        offset: initialOffset + motionTime * speed, direction, gap: options.gap, radius: options.radius,
        interaction, regions,
      });
    });
    ctx.restore();
    interaction.setRegions(regions);
  };

  const loop = createLoop({ canvas, ctx, getOptions: () => options, invalidate: () => { layout = null; }, render });
  requestRender = loop.redraw;
  const controller = {
    pause: loop.pause,
    play: loop.play,
    async update(nextOptions = {}) {
      options = mergeOptions(options, nextOptions);
      if (Object.hasOwn(nextOptions, "items")) items = await loadItems(nextOptions.items, "Horizontal");
      layout = null;
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
