const MASONRY_KEY_PREFIX = "masonry:";

const pendingMounts = new Map();
const activeAnimations = new Map();
const imageCache = new Map();

const CANVAS_BACKGROUND_COLOR = "#000";

const prepareCanvasBackground = (canvas) => {
  canvas.style.backgroundColor = CANVAS_BACKGROUND_COLOR;
  canvas.style.background = CANVAS_BACKGROUND_COLOR;
};

const clearCanvasBackground = (ctx, width, height) => {
  const safeWidth = Math.max(0, width || 0);
  const safeHeight = Math.max(0, height || 0);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, safeWidth, safeHeight);
  ctx.restore();
};

const masonryItems = [
  { imageUrl: new URL("./assets/masonry/masonry-image (2).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (3).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (4).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (5).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (6).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (7).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (8).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (9).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (10).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (11).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (12).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (13).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (14).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (15).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (16).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (17).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (18).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (19).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (20).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (21).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (22).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (23).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (24).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (27).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (28).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (30).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (31).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (32).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (33).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (34).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (35).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (36).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (37).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (38).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (39).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (40).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (41).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (42).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (43).webp", import.meta.url).href },
  { imageUrl: new URL("./assets/masonry/masonry-image (44).webp", import.meta.url).href },
];

const EXTERNAL_MASONRY_DEFAULTS = {
  count: 24,
  extension: "webp"
};

const cleanMasonryPath = (path) => String(path || "").trim().replace(/\/$/, "");

const cleanMasonryExtension = (extension) =>
  (String(extension || EXTERNAL_MASONRY_DEFAULTS.extension).trim().replace(/^\./, "") || EXTERNAL_MASONRY_DEFAULTS.extension);

const readMasonryCount = (value) => {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count > 0 ? count : EXTERNAL_MASONRY_DEFAULTS.count;
};

const getMasonrySourceElement = (canvas) =>
  canvas?.closest?.("[data-masonry-image-path]") || canvas;

const createMasonryItemUrl = ({ path, index, extension }) =>
  `${path}/${String(index + 1).padStart(2, "0")}.${extension}`;

const getExternalMasonryItems = (canvas) => {
  const source = getMasonrySourceElement(canvas);
  const path = cleanMasonryPath(source?.dataset?.masonryImagePath);

  if (!path) {
    return null;
  }

  const count = readMasonryCount(source.dataset.masonryImageCount);
  const extension = cleanMasonryExtension(source.dataset.masonryImageExtension);

  return Array.from({ length: count }, (_, index) => ({
    imageUrl: createMasonryItemUrl({ path, index, extension })
  }));
};

const resolveMasonryItems = (canvas) => getExternalMasonryItems(canvas) || masonryItems;

const config = {
  columnCount: "auto",
  preferredColumnWidth: 165,
  minColumnWidth: 96,
  maxColumnWidth: 260,
  maxColumnCount: 9,
  columnWeights: null,

  gap: 8,
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

  pauseOnReducedMotion: true,
};

const noop = () => {};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getAnimationKey = (canvasId) => `${MASONRY_KEY_PREFIX}${canvasId}`;

const beginMount = (key) => {
  const token = Symbol(key);
  pendingMounts.set(key, token);
  disposeCanvasAnimation(key);
  return token;
};

const isCurrentMount = (key, token) => pendingMounts.get(key) === token;

const completeMount = (key, token, dispose) => () => {
  if (isCurrentMount(key, token)) {
    pendingMounts.delete(key);
  }

  dispose();
};

const disposeCanvasAnimation = (key) => {
  const dispose = activeAnimations.get(key);

  if (!dispose) {
    return;
  }

  dispose();
};

const disposeCanvasAnimationsByPrefix = (prefix) => {
  [...activeAnimations.keys()].forEach((key) => {
    if (key.startsWith(prefix)) {
      disposeCanvasAnimation(key);
    }
  });
};

const getDevicePixelRatio = () => Math.max(1, globalThis.devicePixelRatio || globalThis.window?.devicePixelRatio || 1);

const resizeCanvasToDisplaySize = (canvas, ctx, dpr = getDevicePixelRatio()) => {
  const width = Math.max(1, Math.round((canvas.clientWidth || 0) * dpr));
  const height = Math.max(1, Math.round((canvas.clientHeight || 0) * dpr));
  const changed = canvas.width !== width || canvas.height !== height;

  if (changed) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return changed;
};

const createCanvasAnimation = ({ key, canvas, ctx, renderFrame }) => {
  disposeCanvasAnimation(key);

  let disposed = false;
  let frameId;
  let running = false;
  let reducedMotion = false;

  const doc = globalThis.document;
  const win = globalThis.window;
  const motionQuery = win?.matchMedia?.("(prefers-reduced-motion: reduce)");

  const resize = () => resizeCanvasToDisplaySize(canvas, ctx);

  const frame = (time = 0) => {
    if (disposed || !running) {
      return;
    }

    resize();

    renderFrame({
      canvas,
      ctx,
      time,
      width: canvas.clientWidth || 0,
      height: canvas.clientHeight || 0,
      reducedMotion,
    });

    frameId = globalThis.requestAnimationFrame(frame);
  };

  const start = () => {
    if (disposed || running || typeof globalThis.requestAnimationFrame !== "function") {
      return;
    }

    running = true;
    frameId = globalThis.requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;

    if (frameId !== undefined) {
      globalThis.cancelAnimationFrame?.(frameId);
      frameId = undefined;
    }
  };

  const handleVisibilityChange = () => {
    if (doc?.hidden) {
      stop();
      return;
    }

    resize();
    start();
  };

  const handleMotionChange = () => {
    reducedMotion = Boolean(motionQuery?.matches);
  };

  const resizeObserver = globalThis.ResizeObserver ? new globalThis.ResizeObserver(resize) : null;

  handleMotionChange();
  resize();
  resizeObserver?.observe(canvas);
  win?.addEventListener?.("resize", resize);
  doc?.addEventListener?.("visibilitychange", handleVisibilityChange);

  if (motionQuery?.addEventListener) {
    motionQuery.addEventListener("change", handleMotionChange);
  } else {
    motionQuery?.addListener?.(handleMotionChange);
  }

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    stop();
    resizeObserver?.disconnect();
    win?.removeEventListener?.("resize", resize);
    doc?.removeEventListener?.("visibilitychange", handleVisibilityChange);

    if (motionQuery?.removeEventListener) {
      motionQuery.removeEventListener("change", handleMotionChange);
    } else {
      motionQuery?.removeListener?.(handleMotionChange);
    }

    if (activeAnimations.get(key) === dispose) {
      activeAnimations.delete(key);
    }
  };

  activeAnimations.set(key, dispose);
  start();

  return dispose;
};

const loadImage = (imageUrl) => {
  if (!imageUrl) {
    return Promise.reject(new Error("Cannot load an empty image URL."));
  }

  const cachedImage = imageCache.get(imageUrl);

  if (cachedImage) {
    return cachedImage;
  }

  const request = new Promise((resolve, reject) => {
    const ImageConstructor = globalThis.Image;

    if (!ImageConstructor) {
      reject(new Error("Image constructor is not available in this environment."));
      return;
    }

    const image = new ImageConstructor();

    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        // Some browsers reject decode() after onload for animated or cached images.
      }

      resolve(image);
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    image.src = imageUrl;
  }).catch((error) => {
    imageCache.delete(imageUrl);
    throw error;
  });

  imageCache.set(imageUrl, request);
  return request;
};

const loadImages = async (items) =>
  Promise.all(
    items.map(async (item, sourceIndex) => {
      try {
        return {
          ...item,
          sourceIndex,
          imageElement: await loadImage(item.imageUrl),
          imageLoadError: null,
        };
      } catch (error) {
        return {
          ...item,
          sourceIndex,
          imageElement: null,
          imageLoadError: error,
        };
      }
    }),
  );

const roundedRect = (ctx, x, y, width, height, radius) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width * 0.5, height * 0.5);

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
};

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

  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
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

const getDirectionSign = () => (config.direction === "down" ? 1 : -1);
const getInnerWidth = (width, padding) => Math.max(1, width - padding.left - padding.right);
const getInnerHeight = (height, padding) => Math.max(1, height - padding.top - padding.bottom);

const getLaneCount = ({ width, itemCount, padding }) => {
  const innerWidth = getInnerWidth(width, padding);
  const gap = config.gap;
  const maxThatFits = Math.max(1, Math.floor((innerWidth + gap) / (config.minColumnWidth + gap)));
  const hardMax = Math.min(config.maxColumnCount, maxThatFits, Math.max(1, itemCount));

  if (config.columnCount !== "auto") {
    return clamp(Math.floor(Number(config.columnCount) || 1), 1, hardMax);
  }

  const preferredCount = Math.max(1, Math.round((innerWidth + gap) / (config.preferredColumnWidth + gap)));
  const minCountForMaxWidth = Math.max(1, Math.ceil((innerWidth + gap) / (config.maxColumnWidth + gap)));

  return clamp(preferredCount, Math.min(minCountForMaxWidth, hardMax), hardMax);
};

const getLaneWeights = (count) => {
  if (Array.isArray(config.columnWeights) && config.columnWeights.length) {
    const safeWeights = config.columnWeights.map((value) => Math.max(0.25, Number(value) || 1));
    return Array.from({ length: count }, (_, index) => safeWeights[index % safeWeights.length]);
  }

  const baseSets = {
    1: [1],
    2: [1.04, 0.96],
    3: [0.9, 1.18, 0.92],
    4: [0.92, 1.06, 0.9, 1.02],
    5: [0.82, 0.98, 0.9, 1.24, 0.88],
    6: [0.82, 0.94, 0.86, 1.18, 0.92, 0.84],
    7: [0.78, 0.9, 0.84, 1.16, 0.88, 1.02, 0.8],
    8: [0.76, 0.88, 0.82, 1.08, 0.86, 1, 0.8, 0.92],
    9: [0.74, 0.86, 0.8, 1.04, 0.84, 0.98, 0.78, 0.9, 0.82],
  };

  return baseSets[count]?.slice() || Array.from({ length: count }, (_, index) => 0.86 + (index % 4 === 3 ? 0.2 : 0));
};

const buildLanes = ({ width, count, padding }) => {
  const innerWidth = getInnerWidth(width, padding);
  const totalGap = config.gap * Math.max(0, count - 1);
  const usableWidth = Math.max(1, innerWidth - totalGap);
  let weights = getLaneWeights(count);

  const resolveWidths = (sourceWeights) => {
    const totalWeight = sourceWeights.reduce((sum, weight) => sum + weight, 0);
    return sourceWeights.map((weight) => usableWidth * (weight / totalWeight));
  };

  let widths = resolveWidths(weights);

  if (count > 1 && Math.min(...widths) < config.minColumnWidth * 0.82) {
    weights = Array.from({ length: count }, () => 1);
    widths = resolveWidths(weights);
  }

  let x = padding.left;

  return widths.map((laneWidth, index) => {
    const lane = {
      index,
      x,
      width: laneWidth,
      speed: 0,
      cycleLength: 0,
      tiles: [],
    };

    x += laneWidth + config.gap;
    return lane;
  });
};

const getItemAspectRatio = (item) => {
  const image = item?.imageElement;
  const width = image?.naturalWidth || image?.width || 1;
  const height = image?.naturalHeight || image?.height || 1;

  return width / height;
};

const getItemOrientation = (ratio) => {
  if (ratio < 0.88) return "portrait";
  if (ratio > 1.15) return "landscape";
  return "square";
};

const getLoadedItemOrientation = (item) => getItemOrientation(getItemAspectRatio(item));

const getTileMetrics = ({ item, lane }) => {
  const ratio = getItemAspectRatio(item);
  const orientation = getItemOrientation(ratio);
  const width = lane.width;
  let height;

  if (orientation === "portrait") {
    height = clamp(width / ratio, width * config.minPortraitScale, width * config.maxPortraitScale);
  } else if (orientation === "landscape") {
    height = clamp(width / ratio, width * config.minLandscapeScale, width * config.maxLandscapeScale);
  } else {
    height = width * config.squareScale;
  }

  height = clamp(height, config.minTileHeight, config.maxTileHeight);

  return {
    ratio,
    orientation,
    width,
    height,
    mainSpan: height,
  };
};

const createTile = ({ item, itemIndex, lane, cloneIndex = 0 }) => {
  const metrics = getTileMetrics({ item, lane });

  return {
    item,
    itemIndex,
    cloneIndex,
    ratio: metrics.ratio,
    orientation: metrics.orientation,
    width: metrics.width,
    height: metrics.height,
    mainSpan: metrics.mainSpan,
    yCenter: 0,
  };
};

const assignItemsToLanes = ({ lanes, items }) => {
  const laneLengths = lanes.map(() => 0);

  items.forEach((item, itemIndex) => {
    let targetLaneIndex = 0;
    let targetLength = Infinity;
    let targetTile = null;

    lanes.forEach((lane, laneIndex) => {
      const tile = createTile({ item, itemIndex, lane });
      const nextLength = laneLengths[laneIndex] + tile.mainSpan + config.gap;

      if (nextLength < targetLength) {
        targetLaneIndex = laneIndex;
        targetLength = nextLength;
        targetTile = tile;
      }
    });

    lanes[targetLaneIndex].tiles.push(targetTile);
    laneLengths[targetLaneIndex] += targetTile.mainSpan + config.gap;
  });

  lanes.forEach((lane) => {
    lane.cycleLength = lane.tiles.reduce((sum, tile) => sum + tile.mainSpan + config.gap, 0);
  });
};

const getRequiredCycleLength = ({ lane, innerHeight }) => {
  if (!lane.tiles.length) {
    return Infinity;
  }

  const largestTile = Math.max(...lane.tiles.map((tile) => tile.mainSpan));
  return (innerHeight + config.preload * 2 + largestTile + config.gap) * config.minCycleRatio;
};

const extendLaneCycles = ({ lanes, height, padding }) => {
  const innerHeight = getInnerHeight(height, padding);

  lanes.forEach((lane) => {
    if (!lane.tiles.length) {
      return;
    }

    const sourceTiles = lane.tiles.slice();
    let safety = 0;
    let cloneIndex = 1;

    while (
      lane.cycleLength < getRequiredCycleLength({ lane, innerHeight }) &&
      safety < sourceTiles.length * config.maxClonePasses
    ) {
      const sourceTile = sourceTiles[safety % sourceTiles.length];
      const tile = createTile({
        item: sourceTile.item,
        itemIndex: sourceTile.itemIndex,
        lane,
        cloneIndex,
      });

      lane.tiles.push(tile);
      lane.cycleLength += tile.mainSpan + config.gap;
      safety += 1;

      if (safety % sourceTiles.length === 0) {
        cloneIndex += 1;
      }
    }
  });
};

const assignLaneSpeeds = (lanes) => {
  lanes.forEach((lane, index) => {
    if (Array.isArray(config.columnSpeeds) && config.columnSpeeds.length) {
      lane.speed = Math.abs(Number(config.columnSpeeds[index % config.columnSpeeds.length]) || config.speed);
      return;
    }

    const ratio = lanes.length <= 1 ? 0.5 : index / Math.max(1, lanes.length - 1);
    const variation = 0.88 + ratio * 0.24;
    lane.speed = config.speed * variation;
  });
};

const positionLaneTiles = ({ lane, height, padding }) => {
  const innerHeight = getInnerHeight(height, padding);
  const staggerLimit = Math.min(innerHeight * 0.48, Math.max(0, lane.cycleLength - innerHeight));
  const stagger = lane.tiles.length > 1 ? (lane.index * 0.29 * staggerLimit) % Math.max(1, staggerLimit) : 0;

  let cursor = padding.top - config.preload - stagger;

  lane.tiles.forEach((tile) => {
    tile.yCenter = cursor + tile.mainSpan * 0.5;
    cursor += tile.mainSpan + config.gap;
  });
};

const buildLayout = ({ width, height, items }) => {
  const padding = getPadding();
  const laneCount = getLaneCount({ width, itemCount: items.length, padding });
  const lanes = buildLanes({ width, count: laneCount, padding });

  assignItemsToLanes({ lanes, items });
  extendLaneCycles({ lanes, height, padding });
  assignLaneSpeeds(lanes);
  lanes.forEach((lane) => positionLaneTiles({ lane, height, padding }));

  return {
    width,
    height,
    padding,
    directionSign: getDirectionSign(),
    laneCount,
    lanes,
    items,
  };
};

const getTileTop = (tile) => tile.yCenter - tile.mainSpan * 0.5;
const getTileBottom = (tile) => tile.yCenter + tile.mainSpan * 0.5;

const recycleLaneTiles = ({ lane, layout }) => {
  if (!lane.tiles.length || !lane.speed) {
    return;
  }

  const minLimit = layout.padding.top - config.preload;
  const maxLimit = layout.height - layout.padding.bottom + config.preload;

  if (layout.directionSign < 0) {
    let safety = 0;

    while (safety < lane.tiles.length) {
      const tile = lane.tiles.find((entry) => getTileBottom(entry) < minLimit);

      if (!tile) {
        break;
      }

      const others = lane.tiles.filter((entry) => entry !== tile);
      const maxBottom = others.length ? Math.max(...others.map(getTileBottom)) : maxLimit;

      tile.yCenter = maxBottom + config.gap + tile.mainSpan * 0.5;
      safety += 1;
    }

    return;
  }

  let safety = 0;

  while (safety < lane.tiles.length) {
    const tile = lane.tiles.find((entry) => getTileTop(entry) > maxLimit);

    if (!tile) {
      break;
    }

    const others = lane.tiles.filter((entry) => entry !== tile);
    const minTop = others.length ? Math.min(...others.map(getTileTop)) : minLimit;

    tile.yCenter = minTop - config.gap - tile.mainSpan * 0.5;
    safety += 1;
  }
};

const updateLayout = ({ layout, dt, reducedMotion }) => {
  if (!layout) {
    return;
  }

  const movementBlocked = reducedMotion && config.pauseOnReducedMotion;

  layout.lanes.forEach((lane) => {
    if (!movementBlocked) {
      lane.tiles.forEach((tile) => {
        tile.yCenter += lane.speed * layout.directionSign * dt;
      });
    }

    recycleLaneTiles({ lane, layout });
  });
};

const getVisibleTiles = ({ layout }) => {
  const visibleTiles = [];

  layout.lanes.forEach((lane) => {
    lane.tiles.forEach((tile) => {
      const x = lane.x;
      const y = tile.yCenter - tile.height * 0.5;

      if (y > layout.height + config.preload) {
        return;
      }

      if (y + tile.height < -config.preload) {
        return;
      }

      visibleTiles.push({ lane, tile, x, y });
    });
  });

  return visibleTiles.sort((a, b) => a.y - b.y || a.lane.index - b.lane.index);
};

const intersectsViewport = ({ y, height, viewportHeight }) => y < viewportHeight && y + height > 0;

const findReplacementItem = ({ items, usedItemIndexes, preferredOrientation, seedIndex }) => {
  if (!items.length || usedItemIndexes.size >= items.length) {
    return null;
  }

  for (let offset = 0; offset < items.length; offset += 1) {
    const index = Math.abs(seedIndex + offset) % items.length;
    const item = items[index];

    if (!item || usedItemIndexes.has(item.sourceIndex)) {
      continue;
    }

    if (getLoadedItemOrientation(item) === preferredOrientation) {
      return item;
    }
  }

  for (let offset = 0; offset < items.length; offset += 1) {
    const index = Math.abs(seedIndex + offset) % items.length;
    const item = items[index];

    if (!item || usedItemIndexes.has(item.sourceIndex)) {
      continue;
    }

    return item;
  }

  return null;
};

const getDrawableItem = ({ layout, lane, tile, usedItemIndexes }) => {
  const baseIndex = tile.item?.sourceIndex ?? tile.itemIndex;

  if (!usedItemIndexes.has(baseIndex)) {
    return tile.item;
  }

  const seedIndex = tile.itemIndex + tile.cloneIndex * 13 + lane.index * 7;

  return findReplacementItem({
    items: layout.items,
    usedItemIndexes,
    preferredOrientation: tile.orientation,
    seedIndex,
  });
};

const drawLayout = ({ ctx, width, height, layout }) => {
  if (!layout) {
    return;
  }

  const usedItemIndexes = new Set();

  clearCanvasBackground(ctx, width, height);

  getVisibleTiles({ layout }).forEach(({ lane, tile, x, y }) => {
    const isVisibleNow = intersectsViewport({
      y,
      height: tile.height,
      viewportHeight: height,
    });

    let drawableItem = tile.item;

    if (isVisibleNow) {
      drawableItem = getDrawableItem({
        layout,
        lane,
        tile,
        usedItemIndexes,
      });

      if (!drawableItem) {
        return;
      }

      usedItemIndexes.add(drawableItem.sourceIndex);
    }

    drawRoundedImage(ctx, drawableItem?.imageElement, x, y, tile.width, tile.height, config.radius);
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

  const topSize = resolveSizeValue(config.fade.sizes.top, height, config.fade.size);
  const bottomSize = resolveSizeValue(config.fade.sizes.bottom, height, config.fade.size);

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  if (config.fade.sides.top) {
    applyFadeSide({ ctx, width, height, side: "top", size: topSize });
  }

  if (config.fade.sides.bottom) {
    applyFadeSide({ ctx, width, height, side: "bottom", size: bottomSize });
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

const renderMasonry = ({ ctx, width, height, layout }) => {
  drawLayout({ ctx, width, height, layout });
  applyCanvasFadeMask({ ctx, width, height });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

const createDisposeHandle = (dispose = noop) => {
  const handle = () => dispose();
  handle.dispose = handle;
  return handle;
};

export const mountMasonry = async (canvasId = "masonry-container") => {
  const canvas = globalThis.document?.getElementById?.(canvasId);

  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return createDisposeHandle();
  }

  const ctx = canvas.getContext?.("2d");
  prepareCanvasBackground(canvas);

  if (!ctx) {
    console.error(`Failed to get 2d context from canvas "${canvasId}"`);
    return createDisposeHandle();
  }

  const key = getAnimationKey(canvasId);
  const mountToken = beginMount(key);
  const items = await loadImages(resolveMasonryItems(canvas));

  if (!isCurrentMount(key, mountToken)) {
    return createDisposeHandle();
  }

  const state = {
    layout: null,
    lastTime: null,
    disposed: false,
  };

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    renderFrame: ({ time, width, height, reducedMotion }) => {
      if (state.disposed) {
        return;
      }

      if (!width || !height || !items.length) {
        clearCanvasBackground(ctx, width || 0, height || 0);
        return;
      }

      const shouldRebuild = !state.layout || state.layout.width !== width || state.layout.height !== height;

      if (shouldRebuild) {
        state.layout = buildLayout({ width, height, items });
      }

      const dt = state.lastTime === null ? 16.6667 : clamp(time - state.lastTime, 0, 50);
      state.lastTime = time;

      updateLayout({ layout: state.layout, dt, reducedMotion });
      renderMasonry({ ctx, width, height, layout: state.layout });
    },
  });

  const dispose = completeMount(key, mountToken, baseDispose);

  return createDisposeHandle(() => {
    state.disposed = true;
    dispose();
  });
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    pendingMounts.clear();
    disposeCanvasAnimationsByPrefix(MASONRY_KEY_PREFIX);
  });
}