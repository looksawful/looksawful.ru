import { createCanvasInteractions } from "../../runtime/interactions.js";

const activeInstances = new WeakMap();
const imageCache = new Map();

export const MASONRY_DEFAULTS = Object.freeze({
  columnCount: "auto",
  preferredColumnWidth: 165,
  minColumnWidth: 96,
  maxColumnWidth: 260,
  maxColumnCount: 9,
  columnWeights: null,
  gap: 8,
  columnGap: null,
  rowGap: null,
  radius: 8,
  padding: 0,
  speed: 0.032,
  columnSpeeds: [0.028, 0.034, 0.03, 0.037, 0.026, 0.033, 0.029, 0.036, 0.031],
  direction: "up",
  fade: {
    enabled: true,
    size: 0.14,
    sizes: {},
    sides: { top: true, bottom: true },
  },
  preload: 260,
  minCycleRatio: 2.15,
  maxClonePasses: 24,
  minTileHeight: 72,
  maxTileHeight: 560,
  minLandscapeScale: 0.54,
  maxLandscapeScale: 0.82,
  minPortraitScale: 1.1,
  maxPortraitScale: 2.2,
  squareScale: 1,
  maxDpr: 2,
  paused: false,
  pausedColumns: [],
  pauseOnReducedMotion: true,
  interaction: {},
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const mergeOptions = (base, patch = {}) => ({
  ...base,
  ...patch,
  interaction: { ...(base.interaction || {}), ...(patch.interaction || {}) },
  fade: {
    ...base.fade,
    ...(patch.fade || {}),
    sizes: { ...base.fade.sizes, ...(patch.fade?.sizes || {}) },
    sides: { ...base.fade.sides, ...(patch.fade?.sides || {}) },
  },
});

const resolveCanvas = (target) => {
  if (target?.getContext) return target;
  if (typeof target !== "string" || typeof document === "undefined") return null;
  return document.querySelector(target) || document.getElementById(target.replace(/^#/, ""));
};

const sourceOf = (item) =>
  typeof item === "string" ? item : item?.src || item?.imageUrl || item?.url || "";

const loadImage = (source) => {
  if (!source) return Promise.reject(new Error("Masonry item has no image source."));
  if (imageCache.has(source)) return imageCache.get(source);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        // A loaded image remains drawable when decode() rejects.
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Masonry failed to load ${source}`));
    image.src = source;
  }).catch((error) => {
    imageCache.delete(source);
    throw error;
  });
  imageCache.set(source, promise);
  return promise;
};

const loadItems = async (items) => {
  const results = await Promise.allSettled(
    (Array.isArray(items) ? items : []).map(async (item, sourceIndex) => ({
      ...(typeof item === "object" ? item : {}),
      sourceIndex,
      src: sourceOf(item),
      image: await loadImage(sourceOf(item)),
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

const normalizePadding = (value) => {
  if (Number.isFinite(value)) {
    const size = Math.max(0, value);
    return { top: size, right: size, bottom: size, left: size };
  }
  return {
    top: Math.max(0, Number(value?.top) || 0),
    right: Math.max(0, Number(value?.right) || 0),
    bottom: Math.max(0, Number(value?.bottom) || 0),
    left: Math.max(0, Number(value?.left) || 0),
  };
};

const getLaneCount = ({ width, itemCount, padding, options }) => {
  if (!itemCount) return 0;
  if (Number.isFinite(options.columnCount)) {
    return clamp(Math.floor(options.columnCount), 1, Math.min(options.maxColumnCount, itemCount));
  }
  const columnGap = options.columnGap ?? options.gap;
  const innerWidth = Math.max(1, width - padding.left - padding.right);
  const preferred = clamp(options.preferredColumnWidth, options.minColumnWidth, options.maxColumnWidth);
  const count = Math.floor((innerWidth + columnGap) / (preferred + columnGap));
  return clamp(count || 1, 1, Math.min(options.maxColumnCount, itemCount));
};

const defaultWeights = [0.82, 1.02, 0.9, 1.22, 0.84, 1.08, 0.94, 1.16, 0.88];

const buildLanes = ({ width, count, padding, options }) => {
  const columnGap = options.columnGap ?? options.gap;
  const innerWidth = Math.max(1, width - padding.left - padding.right);
  const available = Math.max(1, innerWidth - columnGap * Math.max(0, count - 1));
  const rawWeights = Array.from({ length: count }, (_, index) =>
    Math.max(0.1, Number(options.columnWeights?.[index]) || defaultWeights[index % defaultWeights.length]),
  );
  const sum = rawWeights.reduce((total, weight) => total + weight, 0);
  let x = padding.left;
  return rawWeights.map((weight, index) => {
    const laneWidth = available * (weight / sum);
    const lane = { index, x, width: laneWidth, tiles: [], speed: 0, paused: false };
    x += laneWidth + columnGap;
    return lane;
  });
};

const getTileHeight = ({ item, lane, options }) => {
  const ratio = item.image.naturalWidth / item.image.naturalHeight;
  let scale = options.squareScale;
  if (ratio > 1.08) {
    scale = clamp(1 / ratio, options.minLandscapeScale, options.maxLandscapeScale);
  } else if (ratio < 0.92) {
    scale = clamp(1 / ratio, options.minPortraitScale, options.maxPortraitScale);
  }
  return clamp(lane.width * scale, options.minTileHeight, options.maxTileHeight);
};

const makeTile = ({ item, lane, options, cloneIndex = 0 }) => ({
  item,
  itemIndex: item.sourceIndex,
  cloneIndex,
  width: lane.width,
  height: getTileHeight({ item, lane, options }),
  yCenter: 0,
});

const tileBottom = (tile) => tile.yCenter + tile.height * 0.5;
const tileTop = (tile) => tile.yCenter - tile.height * 0.5;

const assignOriginalItems = ({ lanes, items, options }) => {
  const rowGap = options.rowGap ?? options.gap;
  const heights = lanes.map(() => 0);
  items.forEach((item) => {
    let laneIndex = 0;
    for (let index = 1; index < lanes.length; index += 1) {
      if (heights[index] < heights[laneIndex]) laneIndex = index;
    }
    const lane = lanes[laneIndex];
    const tile = makeTile({ item, lane, options });
    lane.tiles.push(tile);
    heights[laneIndex] += tile.height + rowGap;
  });
};

const extendLane = ({ lane, items, requiredLength, options }) => {
  const rowGap = options.rowGap ?? options.gap;
  let length = lane.tiles.reduce((sum, tile) => sum + tile.height + rowGap, 0);
  let cloneIndex = 1;
  let cursor = lane.index * 11 + lane.tiles.length;
  while (length < requiredLength && cloneIndex <= options.maxClonePasses * Math.max(1, items.length)) {
    const item = items[cursor % items.length];
    const tile = makeTile({ item, lane, options, cloneIndex });
    lane.tiles.push(tile);
    length += tile.height + rowGap;
    cloneIndex += 1;
    cursor += 1;
  }
};

const positionLane = ({ lane, padding, options }) => {
  const rowGap = options.rowGap ?? options.gap;
  let top = padding.top - options.preload;
  lane.tiles.forEach((tile) => {
    tile.yCenter = top + tile.height * 0.5;
    top += tile.height + rowGap;
  });
};

const buildLayout = ({ width, height, items, options, pausedColumns }) => {
  const padding = normalizePadding(options.padding);
  const innerHeight = Math.max(1, height - padding.top - padding.bottom);
  const laneCount = getLaneCount({ width, itemCount: items.length, padding, options });
  const lanes = buildLanes({ width, count: laneCount, padding, options });
  if (!lanes.length) return { width, height, items, lanes, padding, directionSign: -1 };

  assignOriginalItems({ lanes, items, options });
  const requiredLength = innerHeight * options.minCycleRatio + options.preload * 2;
  lanes.forEach((lane, index) => {
    extendLane({ lane, items, requiredLength, options });
    lane.speed = options.columnSpeeds?.[index] ?? options.speed * (0.86 + (index % 5) * 0.08);
    lane.paused = pausedColumns.has(index);
    positionLane({ lane, padding, options });
  });

  return {
    width,
    height,
    items,
    lanes,
    padding,
    directionSign: options.direction === "down" ? 1 : -1,
  };
};

const recycleLane = ({ lane, layout, options }) => {
  const rowGap = options.rowGap ?? options.gap;
  const minLimit = layout.padding.top - options.preload;
  const maxLimit = layout.height - layout.padding.bottom + options.preload;

  if (layout.directionSign < 0) {
    let safety = 0;
    while (safety < lane.tiles.length) {
      const tile = lane.tiles.find((entry) => tileBottom(entry) < minLimit);
      if (!tile) break;
      const others = lane.tiles.filter((entry) => entry !== tile);
      const maxBottom = others.length ? Math.max(...others.map(tileBottom)) : maxLimit;
      tile.yCenter = maxBottom + rowGap + tile.height * 0.5;
      safety += 1;
    }
    return;
  }

  let safety = 0;
  while (safety < lane.tiles.length) {
    const tile = lane.tiles.find((entry) => tileTop(entry) > maxLimit);
    if (!tile) break;
    const others = lane.tiles.filter((entry) => entry !== tile);
    const minTop = others.length ? Math.min(...others.map(tileTop)) : minLimit;
    tile.yCenter = minTop - rowGap - tile.height * 0.5;
    safety += 1;
  }
};

const updateLayout = ({ layout, laneDts, reducedMotion, options, pausedAll, pausedColumns }) => {
  if (!layout) return;
  const stoppedForMotion = reducedMotion && options.pauseOnReducedMotion;
  layout.lanes.forEach((lane) => {
    lane.paused = pausedColumns.has(lane.index);
    const dt = laneDts?.[lane.index] ?? 0;
    if (!pausedAll && !lane.paused && !stoppedForMotion) {
      lane.tiles.forEach((tile) => {
        tile.yCenter += lane.speed * layout.directionSign * dt;
      });
    }
    recycleLane({ lane, layout, options });
  });
};

const drawLayout = ({ ctx, width, height, layout, options, interaction }) => {
  ctx.clearRect(0, 0, width, height);
  if (!layout) { interaction.setRegions([]); return; }

  const visible = [];
  layout.lanes.forEach((lane) => {
    lane.tiles.forEach((tile, tileIndex) => {
      const y = tileTop(tile);
      if (y < height + options.preload && y + tile.height > -options.preload) {
        visible.push({ lane, tile, tileIndex, x: lane.x, y });
      }
    });
  });

  const regions = [];
  visible.sort((a, b) => a.y - b.y || a.lane.index - b.lane.index);
  visible.forEach(({ lane, tile, tileIndex, x, y }) => {
    const baseRegion = {
      key: `masonry:${lane.index}:${tileIndex}`,
      item: tile.item,
      x,
      y,
      width: tile.width,
      height: tile.height,
    };
    const scale = interaction.getCardScale(baseRegion, Math.min(options.rowGap ?? options.gap, options.columnGap ?? options.gap));
    const drawWidth = tile.width * scale;
    const drawHeight = tile.height * scale;
    const drawX = x - (drawWidth - tile.width) * 0.5;
    const drawY = y - (drawHeight - tile.height) * 0.5;
    drawCover(ctx, tile.item.image, drawX, drawY, drawWidth, drawHeight, options.radius * scale);
    regions.push({ ...baseRegion, x: drawX, y: drawY, width: drawWidth, height: drawHeight });
  });
  interaction.setRegions(regions);
};

const resolveFadeSize = (value, total, fallback) => {
  const numeric = Number.isFinite(value) ? value : fallback;
  return numeric <= 1 ? total * numeric : numeric;
};

const applyFade = ({ ctx, width, height, options }) => {
  if (!options.fade.enabled) return;
  const topSize = resolveFadeSize(options.fade.sizes.top, height, options.fade.size);
  const bottomSize = resolveFadeSize(options.fade.sizes.bottom, height, options.fade.size);
  const topStop = clamp(topSize / height, 0, 0.49);
  const bottomStop = clamp(bottomSize / height, 0, 0.49);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, options.fade.sides.top ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
  gradient.addColorStop(topStop, "rgba(0,0,0,1)");
  gradient.addColorStop(1 - bottomStop, "rgba(0,0,0,1)");
  gradient.addColorStop(1, options.fade.sides.bottom ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

const createLoop = ({ canvas, ctx, getOptions, render, rebuild }) => {
  let disposed = false;
  let frameId = null;
  let lastTime = 0;
  let manuallyPaused = Boolean(getOptions().paused);
  let documentHidden = Boolean(document.hidden);
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const measure = () => ({
    width: Math.max(1, canvas.clientWidth || 1),
    height: Math.max(1, canvas.clientHeight || 1),
  });
  let lastWidth = 0;
  let lastHeight = 0;

  const redraw = () => {
    if (disposed) return;
    const { width, height } = measure();
    const dpr = Math.min(Math.max(1, devicePixelRatio || 1), Math.max(1, getOptions().maxDpr || 2));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    const sizeChanged = width !== lastWidth || height !== lastHeight;

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sizeChanged) {
      lastWidth = width;
      lastHeight = height;
      rebuild(width, height);
    }

    render({ dt: 0, width, height, reducedMotion });
  };

  const shouldAnimate = () =>
    !disposed &&
    !manuallyPaused &&
    !documentHidden &&
    !(reducedMotion && getOptions().pauseOnReducedMotion);

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
    const dt = lastTime ? Math.min(50, time - lastTime) : 0;
    lastTime = time;
    const { width, height } = measure();
    render({ dt, width, height, reducedMotion, manuallyPaused });
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
    isPaused: () => manuallyPaused,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      resizeObserver.disconnect();
      removeEventListener("resize", redraw);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotion);
    },
    getState() { return { paused: manuallyPaused, reducedMotion }; },
  };
};

export async function mountMasonry(target, userOptions = {}) {
  const canvas = resolveCanvas(target);
  if (!canvas) throw new Error("mountMasonry: canvas not found.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mountMasonry: 2D context is unavailable.");
  activeInstances.get(canvas)?.dispose();

  let options = mergeOptions(MASONRY_DEFAULTS, userOptions);
  let items = await loadItems(options.items);
  let layout = null;
  const pausedColumns = new Set(options.pausedColumns || []);
  let requestRender = () => {};
  const interaction = createCanvasInteractions({
    canvas,
    getOptions: () => options,
    laneAxis: "columns",
    requestRender: () => requestRender(),
  });

  const rebuild = (width, height) => {
    if (!items.length) {
      layout = null;
      return;
    }
    layout = buildLayout({ width, height, items, options, pausedColumns });
  };

  const render = ({ dt, width, height, reducedMotion, manuallyPaused = false }) => {
    if (!layout || layout.width !== width || layout.height !== height) rebuild(width, height);
    const motionState = interaction.advanceDelta({ dt, laneCount: layout?.lanes.length || 0 });
    updateLayout({
      layout,
      laneDts: motionState.laneDts,
      reducedMotion,
      options,
      pausedAll: manuallyPaused,
      pausedColumns,
    });
    drawLayout({ ctx, width, height, layout, options, interaction });
    applyFade({ ctx, width, height, options });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const loop = createLoop({ canvas, ctx, getOptions: () => options, render, rebuild });
  requestRender = loop.redraw;

  const controller = {
    pause: loop.pause,
    play: loop.play,
    pauseColumns(indexes = []) {
      indexes.forEach((index) => pausedColumns.add(Number(index)));
      return controller;
    },
    playColumns(indexes = []) {
      indexes.forEach((index) => pausedColumns.delete(Number(index)));
      return controller;
    },
    setColumnSpeed(index, speed) {
      const speeds = [...(options.columnSpeeds || [])];
      speeds[Number(index)] = Math.max(0, Number(speed) || 0);
      options = mergeOptions(options, { columnSpeeds: speeds });
      if (layout?.lanes[index]) layout.lanes[index].speed = speeds[index];
      return controller;
    },
    async update(nextOptions = {}) {
      options = mergeOptions(options, nextOptions);
      if (Object.hasOwn(nextOptions, "items")) items = await loadItems(nextOptions.items);
      if (Object.hasOwn(nextOptions, "pausedColumns")) {
        pausedColumns.clear();
        (nextOptions.pausedColumns || []).forEach((index) => pausedColumns.add(Number(index)));
      }
      layout = null;
      loop.redraw();
      return controller;
    },
    async setItems(nextItems) { return controller.update({ items: nextItems }); },
    dispose() {
      interaction.dispose();
      loop.dispose();
      layout = null;
      if (activeInstances.get(canvas) === controller) activeInstances.delete(canvas);
    },
    getState() {
      return {
        ...loop.getState(),
        interaction: interaction.getState(),
        options: mergeOptions(MASONRY_DEFAULTS, options),
        itemCount: items.length,
        lanes: layout?.lanes.map((lane) => ({
          index: lane.index,
          width: lane.width,
          speed: lane.speed,
          tileCount: lane.tiles.length,
          paused: pausedColumns.has(lane.index),
        })) || [],
      };
    },
  };

  activeInstances.set(canvas, controller);
  return controller;
}
