import {
  beginMount,
  completeMount,
  createAnimationKey,
  createCanvasAnimation,
  disposeCanvasAnimationsByPrefix,
  isCurrentMount,
  loadMedia,
  noop,
  roundedRect,
  createMediaLoader,
  drawCanvasLoadingState,
  getCanvasMountOptions,
  limitAnimationItems,
  markCanvasState,
} from "../../shared/canvas-animation.js";
import { createAnimationItems, ANIMATION_SCENES } from "../showcase-animation-assets.js";

const CV_HORIZONTAL_KEY_PREFIX = "showcase-horizontal:";
const DEFAULT_HORIZONTAL_SCENE = "jesteiProductCanvas";
const config = {
  rowCount: 3,
  minRowHeight: 72,
  maxRowCount: 3,
  gap: 8,
  radius: 8,
  padding: 0,

  speed: 0.012,
  direction: "left",

  fade: {
    enabled: false, size: 0, sizes: {}, sides: { top: false, right: false, bottom: false, left: false },
  },

  preload: 360,
  cycleGap: 8,

  maxPasses: 5,
  maxDrawItems: 220,

  tallSpanRatio: 0.62,
  portraitSpanRatio: 0.92,
  landscapeRatio: 1.18,

  portraitMinWidthScale: 0.62,
  portraitMaxWidthScale: 1.18,
  squareMinWidthScale: 0.92,
  squareMaxWidthScale: 1.28,
  landscapeMinWidthScale: 1.18,
  landscapeMaxWidthScale: 3.3,

  pauseOnReducedMotion: true,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getHorizontalItems = (sceneId = DEFAULT_HORIZONTAL_SCENE) => {
  const scene = ANIMATION_SCENES[sceneId] ?? ANIMATION_SCENES[DEFAULT_HORIZONTAL_SCENE];
  return limitAnimationItems(createAnimationItems(scene.modules), sceneId, { defaultMaxItems: scene.defaultMaxItems || 20 });
};

const createDisposeHandle = (dispose = noop) => {
  const handle = () => dispose();
  handle.dispose = handle;
  return handle;
};

// Прогрессивная загрузка с батчингом: сначала грузим первые N, потом порциями в фоне
const loadImages = (
  items,
  {
    initialCount = 12,
    batchSize = 6,
    maxItems = 42,
    onItemLoad = noop,
    onLoadingChange = noop,
    sceneId = "",
  } = {},
) => {
  const loader = createMediaLoader(items, {
    maxItems,
    initialCount,
    batchSize,
    sceneId,
    onItemLoad,
    onLoadingChange,
  });

  loader.items.cancel = loader.cancel;
  loader.items.setPlaybackEnabled = loader.setPlaybackEnabled;
  return loader.items;
};

const getLoadedItemCount = (items) => items.reduce((count, item) => count + (item?.imageElement ? 1 : 0), 0);

const drawImagePlaceholder = (ctx, x, y, width, height, radius) => {
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();
  ctx.restore();
};

const drawRoundedImage = (ctx, image, x, y, width, height, radius) => {
  if (!width || !height) {
    return;
  }

  const safeRadius = Math.min(radius, width * 0.5, height * 0.5);

  if (!image) {
    drawImagePlaceholder(ctx, x, y, width, height, safeRadius);
    return;
  }

  const sourceWidth = image.videoWidth || image.naturalWidth || image.width || 1;
  const sourceHeight = image.videoHeight || image.naturalHeight || image.height || 1;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sh = sourceHeight;
    sw = sh * targetRatio;
    sx = (sourceWidth - sw) * 0.5;
  } else {
    sw = sourceWidth;
    sh = sw / targetRatio;
    sy = (sourceHeight - sh) * 0.5;
  }

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, safeRadius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  ctx.restore();
};

const getPadding = () => {
  if (Number.isFinite(config.padding)) {
    const value = Math.max(0, config.padding);
    return { top: value, right: value, bottom: value, left: value };
  }

  return {
    top: Math.max(0, Number(config.padding?.top) || 0),
    right: Math.max(0, Number(config.padding?.right) || 0),
    bottom: Math.max(0, Number(config.padding?.bottom) || 0),
    left: Math.max(0, Number(config.padding?.left) || 0),
  };
};

const getInnerWidth = (width, padding) => Math.max(1, width - padding.left - padding.right);
const getInnerHeight = (height, padding) => Math.max(1, height - padding.top - padding.bottom);
const getDirectionSign = () => (config.direction === "right" ? 1 : -1);

const getRowCount = ({ height, itemCount, padding }) => {
  const innerHeight = getInnerHeight(height, padding);
  const maxByHeight = Math.max(1, Math.floor((innerHeight + config.gap) / (config.minRowHeight + config.gap)));
  const hardMax = Math.min(config.maxRowCount, maxByHeight, Math.max(1, itemCount));

  if (config.rowCount !== "auto") {
    return clamp(Math.floor(Number(config.rowCount) || 1), 1, hardMax);
  }

  const preferred = innerHeight < 300 ? 2 : 3;
  return clamp(preferred, 1, hardMax);
};

const buildRows = ({ height, count, padding }) => {
  const innerHeight = getInnerHeight(height, padding);
  const totalGap = config.gap * Math.max(0, count - 1);
  const rowHeight = Math.max(1, (innerHeight - totalGap) / count);

  return Array.from({ length: count }, (_, index) => ({
    index,
    y: padding.top + index * (rowHeight + config.gap),
    height: rowHeight,
    length: 0,
  }));
};

const getItemAspectRatio = (item) => {
  const image = item?.imageElement;
  const width = image?.videoWidth || image?.naturalWidth || image?.width || 1;
  const height = image?.videoHeight || image?.naturalHeight || image?.height || 1;

  return width / height;
};

const getItemOrientation = (ratio) => {
  if (ratio < config.portraitSpanRatio) {
    return "portrait";
  }

  if (ratio > config.landscapeRatio) {
    return "landscape";
  }

  return "square";
};

const getSpanRows = ({ ratio, rowCount }) => {
  if (rowCount <= 1) {
    return 1;
  }

  if (ratio < config.tallSpanRatio) {
    return Math.min(3, rowCount);
  }

  if (ratio < config.portraitSpanRatio) {
    return Math.min(2, rowCount);
  }

  return 1;
};

const getTileMetrics = ({ item, rowHeight, spanRows }) => {
  const ratio = getItemAspectRatio(item);
  const orientation = getItemOrientation(ratio);
  const height = rowHeight * spanRows + config.gap * Math.max(0, spanRows - 1);
  let width = height * ratio;

  if (orientation === "portrait") {
    width = clamp(width, rowHeight * config.portraitMinWidthScale, height * config.portraitMaxWidthScale);
  } else if (orientation === "landscape") {
    width = clamp(width, rowHeight * config.landscapeMinWidthScale, rowHeight * config.landscapeMaxWidthScale);
  } else {
    width = clamp(width, rowHeight * config.squareMinWidthScale, rowHeight * config.squareMaxWidthScale);
  }

  return {
    ratio,
    orientation,
    spanRows,
    width,
    height,
  };
};

const choosePlacement = ({ rows, spanRows }) => {
  let bestStartRow = 0;
  let bestX = Infinity;
  let bestWaste = Infinity;

  for (let startRow = 0; startRow <= rows.length - spanRows; startRow += 1) {
    const group = rows.slice(startRow, startRow + spanRows);
    const x = Math.max(...group.map((row) => row.length));
    const waste = group.reduce((sum, row) => sum + (x - row.length), 0);

    if (x < bestX || (x === bestX && waste < bestWaste)) {
      bestStartRow = startRow;
      bestX = x;
      bestWaste = waste;
    }
  }

  return {
    startRow: bestStartRow,
    x: Number.isFinite(bestX) ? bestX : 0,
  };
};

const createTile = ({ item, itemIndex, rows, rowHeight, padding }) => {
  const ratio = getItemAspectRatio(item);
  const spanRows = getSpanRows({ ratio, rowCount: rows.length });
  const metrics = getTileMetrics({ item, rowHeight, spanRows });
  const placement = choosePlacement({ rows, spanRows });
  const targetRows = rows.slice(placement.startRow, placement.startRow + spanRows);
  const nextLength = placement.x + metrics.width + config.gap;

  targetRows.forEach((row) => {
    row.length = nextLength;
  });

  const row = rows[placement.startRow];
  const xCenter = padding.left + placement.x + metrics.width * 0.5;
  const yCenter = row.y + metrics.height * 0.5;

  return {
    item,
    itemIndex,
    ratio: metrics.ratio,
    orientation: metrics.orientation,
    spanRows: metrics.spanRows,
    width: metrics.width,
    height: metrics.height,
    xCenter,
    yCenter,
  };
};

const buildBaseTiles = ({ items, rows, padding, requiredLength = 0 }) => {
  if (!rows.length || !items.length) {
    return [];
  }

  const rowHeight = rows[0].height;
  const tiles = [];
  let itemIndex = 0;
  let currentLength = Math.min(...rows.map((row) => row.length));
  const safeRequiredLength = Math.max(requiredLength, rowHeight * 4, 1);
  const maxIterations = Math.min(Math.max(items.length * 24, rows.length * 20, 120), 720);

  while (itemIndex < maxIterations && currentLength < safeRequiredLength) {
    const item = items[itemIndex % items.length];
    const tile = createTile({
      item,
      itemIndex,
      rows,
      rowHeight,
      padding,
    });

    tiles.push(tile);
    itemIndex += 1;
    currentLength = Math.min(...rows.map((row) => row.length));
  }

  return tiles;
};

const buildLayout = ({ width, height, items }) => {
  const padding = getPadding();
  const rowCount = getRowCount({ height, itemCount: items.length, padding });
  const rows = buildRows({ height, count: rowCount, padding });
  const tiles = buildBaseTiles({ items, rows, padding, requiredLength: width + config.preload * 2 });
  const contentLength = Math.max(...rows.map((row) => row.length), 1);
  const cycleLength = Math.max(1, contentLength + config.cycleGap);

  return {
    width,
    height,
    padding,
    rows,
    rowCount,
    tiles,
    items,
    cycleLength,
    offset: 0,
    directionSign: getDirectionSign(),
  };
};

const updateLayout = ({ layout, dt, reducedMotion }) => {
  if (!layout?.cycleLength) {
    return;
  }

  const movementBlocked = reducedMotion && config.pauseOnReducedMotion;

  if (movementBlocked) {
    return;
  }

  layout.offset = (layout.offset + config.speed * dt) % layout.cycleLength;
};

const getTileLeft = (tile, shift) => tile.xCenter + shift - tile.width * 0.5;
const getTileTop = (tile) => tile.yCenter - tile.height * 0.5;

const intersectsViewport = ({ x, y, width, height, viewportWidth, viewportHeight }) =>
  x < viewportWidth && x + width > 0 && y < viewportHeight && y + height > 0;

const getVisibleTiles = ({ layout }) => {
  const visibleTiles = [];
  const passCount = Math.min(config.maxPasses || 5, Math.ceil((layout.width + config.preload * 2 + layout.cycleLength) / layout.cycleLength) + 2);

  for (let pass = -1; pass <= passCount; pass += 1) {
    const shift = pass * layout.cycleLength + layout.directionSign * layout.offset;

    layout.tiles.forEach((tile) => {
      const x = getTileLeft(tile, shift);
      const y = getTileTop(tile);

      if (x > layout.width + config.preload) {
        return;
      }

      if (x + tile.width < -config.preload) {
        return;
      }

      if (visibleTiles.length < (config.maxDrawItems || 220)) {
        visibleTiles.push({ tile, x, y });
      }
    });
  }

  return visibleTiles;
};

const drawLayout = ({ ctx, width, height, layout }) => {
  if (!layout) {
    return;
  }

  ctx.clearRect(0, 0, width, height);

  getVisibleTiles({ layout }).forEach(({ tile, x, y }) => {
    if (
      !intersectsViewport({
        x,
        y,
        width: tile.width,
        height: tile.height,
        viewportWidth: width,
        viewportHeight: height,
      })
    ) {
      return;
    }

    drawRoundedImage(ctx, tile.item?.imageElement, x, y, tile.width, tile.height, config.radius);
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

const resolveSizeValue = (value, total, fallback) => {
  const source = Number.isFinite(value) ? value : fallback;

  if (!Number.isFinite(source)) {
    return 0;
  }

  return source <= 1 ? total * source : source;
};

const applyFadeSide = ({ ctx, width, height, side, size }) => {
  if (size <= 0) {
    return;
  }

  let gradient = null;

  if (side === "top") {
    gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  }

  if (side === "bottom") {
    gradient = ctx.createLinearGradient(0, height, 0, height - size);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  }

  if (side === "left") {
    gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  }

  if (side === "right") {
    gradient = ctx.createLinearGradient(width, 0, width - size, 0);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  }

  if (!gradient) {
    return;
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const applyCanvasFadeMask = ({ ctx, width, height }) => {
  if (!config.fade.enabled) {
    return;
  }

  const leftSize = resolveSizeValue(config.fade.sizes.left, width, config.fade.size);
  const rightSize = resolveSizeValue(config.fade.sizes.right, width, config.fade.size);
  const topSize = resolveSizeValue(config.fade.sizes.top, height, config.fade.size);
  const bottomSize = resolveSizeValue(config.fade.sizes.bottom, height, config.fade.size);

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  if (config.fade.sides.top) {
    applyFadeSide({ ctx, width, height, side: "top", size: topSize });
  }

  if (config.fade.sides.left) {
    applyFadeSide({ ctx, width, height, side: "left", size: leftSize });
  }

  if (config.fade.sides.right) {
    applyFadeSide({ ctx, width, height, side: "right", size: rightSize });
  }

  if (config.fade.sides.bottom) {
    applyFadeSide({ ctx, width, height, side: "bottom", size: bottomSize });
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

const renderCvHorizontal = ({ ctx, width, height, layout }) => {
  drawLayout({ ctx, width, height, layout });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

export const mountShowcaseHorizontal = async (canvasId = "showcase-horizontal-container", options = {}) => {
  const canvas = globalThis.document?.getElementById?.(canvasId);

  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return createDisposeHandle();
  }

  const ctx = canvas.getContext?.("2d");

  if (!ctx) {
    console.error(`Failed to get 2d context from canvas "${canvasId}"`);
    return createDisposeHandle();
  }

  const key = createAnimationKey(CV_HORIZONTAL_KEY_PREFIX, canvasId);
  const mountToken = beginMount(key);
  let itemLoadVersion = 0;
  const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_HORIZONTAL_SCENE;
  const tuning = getCanvasMountOptions(canvas, options, {
    maxItems: 42,
    initialCount: 12,
    batchSize: 6,
    fps: 30,
  });
  const items = loadImages(getHorizontalItems(sceneId), {
    maxItems: tuning.maxItems,
    initialCount: tuning.initialCount,
    batchSize: tuning.batchSize,
    sceneId,
    onItemLoad: () => {
      itemLoadVersion += 1;
    },
    onLoadingChange: ({ hasLoaded, isComplete }) => {
      markCanvasState(canvas, hasLoaded || isComplete ? "ready" : "loading");
    },
  });

  if (!isCurrentMount(key, mountToken)) {
    return createDisposeHandle();
  }

  const state = {
    layout: null,
    lastTime: null,
    layoutVersion: -1,
    disposed: false,
  };

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    maxDpr: tuning.maxDpr,
    fps: tuning.fps,
    onActiveChange: (isActive) => {
      items.setPlaybackEnabled?.(isActive);
    },
    renderFrame: ({ time, width, height, reducedMotion }) => {
      if (state.disposed) {
        return;
      }

      if (!width || !height || !items.length) {
        ctx.clearRect(0, 0, width || 0, height || 0);
        return;
      }

      const loadedItemCount = getLoadedItemCount(items);

      if (!loadedItemCount) {
        drawCanvasLoadingState(ctx, width, height);
        return;
      }

      const shouldRebuild =
        !state.layout ||
        state.layout.width !== width ||
        state.layout.height !== height ||
        state.layoutVersion !== itemLoadVersion;

      if (shouldRebuild) {
        const previousOffset = state.layout?.offset || 0;
        state.layout = buildLayout({ width, height, items });
        state.layout.offset = previousOffset % state.layout.cycleLength;
        state.layoutVersion = itemLoadVersion;
      }

      const dt = state.lastTime === null ? 16.6667 : clamp(time - state.lastTime, 0, 50);
      state.lastTime = time;

      updateLayout({ layout: state.layout, dt, reducedMotion });
      renderCvHorizontal({ ctx, width, height, layout: state.layout });
    },
  });

  const dispose = completeMount(key, mountToken, baseDispose);

  return createDisposeHandle(() => {
    state.disposed = true;
    items.cancel?.();
    dispose();
  });
};

export const mountHorizontalMasonry = mountShowcaseHorizontal;
export const mountHorizontal = mountShowcaseHorizontal;
export const mountHorisontal = mountShowcaseHorizontal;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeCanvasAnimationsByPrefix(CV_HORIZONTAL_KEY_PREFIX);
  });
}
