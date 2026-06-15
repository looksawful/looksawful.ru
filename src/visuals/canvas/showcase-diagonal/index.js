import {
	beginMount,
	completeMount,
	createAnimationKey,
	createCanvasAnimation,
	disposeCanvasAnimationsByPrefix,
	isCurrentMount,
	loadMedia,
	noop,
  limitAnimationItems,
	roundedRect,
  setMediaItemsPlayback,
} from "../../shared/canvas-animation.js";
import { createAnimationItems, ANIMATION_SCENES } from "../showcase-animation-assets.js";

const CV_DIAGONAL_KEY_PREFIX = "showcase-diagonal:";
const DEFAULT_DIAGONAL_SCENE = "styxGraphicDiagonal";
const DIAGONAL_ANGLE = (-45 * Math.PI) / 180;

const config = {
	rowCount: "auto",
	minRowHeight: 190,
	maxRowCount: 3,

	gap: 14,
	radius: 14,
	padding: 0,

	speed: 0.034,
	direction: "left",

	fade: {
enabled: false,
size: 0,
sizes: {},
sides: { top: false, right: false, bottom: false, left: false },
},

	preload: 260,
	cycleGap: 0,

	tallSpanRatio: 0.62,
	portraitSpanRatio: 0.92,
	landscapeRatio: 1.18,

	portraitMinWidthScale: 0.62,
	portraitMaxWidthScale: 0.88,
	squareMinWidthScale: 0.92,
	squareMaxWidthScale: 1.02,
	landscapeMinWidthScale: 1.18,
	landscapeMaxWidthScale: 1.72,

	pauseOnReducedMotion: true,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getDiagonalItems = (sceneId = DEFAULT_DIAGONAL_SCENE) => {
	const scene = ANIMATION_SCENES[sceneId] ?? ANIMATION_SCENES[DEFAULT_DIAGONAL_SCENE];
	return limitAnimationItems(
    createAnimationItems(scene.modules),
    sceneId,
    { defaultMaxItems: scene.defaultMaxItems || 30 },
  );
};

const createDisposeHandle = (dispose = noop) => {
	const handle = () => dispose();
	handle.dispose = handle;
	return handle;
};

// Прогрессивная загрузка с батчингом: сначала грузим первые N, потом порциями в фоне
const loadImages = (items, { initialCount = 30, batchSize = 10, onItemLoad = noop } = {}) => {
  let playbackEnabled = true;
	const loaded = items.map((item, sourceIndex) => ({
		...item,
		sourceIndex,
		imageElement: null,
    mediaElement: null,
		imageLoadError: null,
	}));

	const loadOne = (index) => {
		const mediaUrl = loaded[index]?.mediaUrl || loaded[index]?.imageUrl;
		if (!mediaUrl) return Promise.resolve();
		return loadMedia(mediaUrl)
			.then((el) => {
				loaded[index].imageElement = el;
        loaded[index].mediaElement = el;
        setMediaItemsPlayback([loaded[index]], playbackEnabled);
				onItemLoad();
			})
			.catch((err) => {
				loaded[index].imageLoadError = err;
				onItemLoad();
			});
	};

	const firstEnd = Math.min(initialCount, items.length);
	for (let i = 0; i < firstEnd; i++) loadOne(i);

	if (items.length > firstEnd) {
		(async () => {
			for (let i = firstEnd; i < items.length; i += batchSize) {
				const end = Math.min(i + batchSize, items.length);
				await Promise.all(Array.from({ length: end - i }, (_, j) => loadOne(i + j)));
				await new Promise((r) => setTimeout(r, 80));
			}
		})();
	}

  loaded.setPlaybackEnabled = (enabled) => {
    playbackEnabled = Boolean(enabled);
    setMediaItemsPlayback(loaded, playbackEnabled);
  };
  loaded.cancel = () => {
    playbackEnabled = false;
    setMediaItemsPlayback(loaded, false);
  };

	return loaded;
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

const getPadding = () => ({
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
});

const getInnerWidth = (width, padding) => Math.max(1, width - padding.left - padding.right);
const getInnerHeight = (height, padding) => Math.max(1, height - padding.top - padding.bottom);
const getDirectionSign = () => (config.direction === "right" ? 1 : -1);

const getRotatedViewportBounds = ({ width, height, angle }) => {
	const sin = Math.abs(Math.sin(angle));
	const cos = Math.abs(Math.cos(angle));

	return {
		width: width * cos + height * sin,
		height: width * sin + height * cos,
	};
};

const getRowCount = ({ height, itemCount, padding }) => {
	const innerHeight = getInnerHeight(height, padding);
	const maxByHeight = Math.max(1, Math.floor((innerHeight + config.gap) / (config.minRowHeight + config.gap)));
	const hardMax = Math.min(config.maxRowCount, maxByHeight);

	if (config.rowCount !== "auto") {
		return clamp(Math.floor(Number(config.rowCount) || 1), 1, hardMax);
	}

	const preferred = innerHeight < 360 ? 4 : innerHeight < 640 ? 6 : 6;
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
    startRow: placement.startRow,
    rowIndex: placement.startRow,
    ratio: metrics.ratio,
    orientation: metrics.orientation,
    spanRows: metrics.spanRows,
    width: metrics.width,
    height: metrics.height,
    xCenter,
    yCenter,
  };
};

const buildBaseTiles = ({ items, rows, padding }) => {
	if (!rows.length || !items.length) {
		return [];
	}

	const rowHeight = rows[0].height;
	const tiles = [];
	let itemIndex = 0;
	let currentLength = Math.min(...rows.map((row) => row.length));
	const requiredLength = Math.max(...rows.map((row) => row.requiredLength), 0);
	const maxIterations = Math.max(items.length * 80, rows.length * 40, 240);

	while (itemIndex < maxIterations && currentLength < requiredLength) {
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



const buildLayout = ({ width, height, items, previousOffset = 0 }) => {
  const stage = getRotatedViewportBounds({ width, height, angle: DIAGONAL_ANGLE });
  const padding = getPadding();
  const visibleRowCount = getRowCount({ height, itemCount: Math.max(items.length, 8), padding });
  const visibleInnerHeight = getInnerHeight(height, padding);
  const visibleTotalGap = config.gap * Math.max(0, visibleRowCount - 1);
  const targetRowHeight = Math.max(1, (visibleInnerHeight - visibleTotalGap) / visibleRowCount);
  const stageInnerHeight = getInnerHeight(stage.height, padding);
  const stageRowCount = Math.max(1, Math.ceil((stageInnerHeight + config.gap) / (targetRowHeight + config.gap)));
  const requiredLength = stage.width + config.preload * 2;

  const rows = buildRows({ height: stage.height, count: stageRowCount, padding }).map((row) => ({
    ...row,
    requiredLength,
  }));

  const tiles = buildBaseTiles({ items, rows, padding });
  const rowCycleLengths = rows.map((row) => Math.max(1, row.length + config.gap));
  const cycleLength = Math.max(...rowCycleLengths, 1);

  return {
    width,
    height,
    stageWidth: stage.width,
    stageHeight: stage.height,
    padding,
    rows,
    rowCount: stageRowCount,
    visibleRowCount,
    tiles,
    items,
    rowCycleLengths,
    cycleLength,
    offset: previousOffset % cycleLength,
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





const getVisibleTiles = ({ layout }) => {
  if (!layout?.tiles?.length || !layout?.cycleLength) {
    return [];
  }

  const visibleTiles = [];
  const stageWidth = layout.stageWidth || layout.width || 1;
  const passCount = Math.min(
    config.maxPasses || 10,
    Math.ceil((stageWidth + config.preload * 2 + layout.cycleLength * 2) / layout.cycleLength) + 4,
  );
  const maxDrawItems = config.maxDrawItems || 520;

  for (let pass = -passCount; pass <= passCount; pass += 1) {
    const shift = pass * layout.cycleLength + layout.directionSign * layout.offset;

    for (const tile of layout.tiles) {
      const x = getTileLeft(tile, shift);
      const y = getTileTop(tile);

      if (x + tile.width < -config.preload || x > stageWidth + config.preload) {
        continue;
      }

      visibleTiles.push({ tile, x, y, pass });

      if (visibleTiles.length >= maxDrawItems) {
        return visibleTiles;
      }
    }
  }

  return visibleTiles;
};

const getDrawableItem = ({ tile }) => tile.item;

const drawLayout = ({ ctx, width, height, layout }) => {
	if (!layout) {
		return;
	}

	ctx.clearRect(0, 0, width, height);

	ctx.save();
	const centerX = width * 0.5;
	const centerY = height * 0.5;
	ctx.translate(centerX, centerY);
	ctx.rotate(DIAGONAL_ANGLE);
	ctx.translate(-layout.stageWidth * 0.5, -layout.stageHeight * 0.5);

	getVisibleTiles({ layout }).forEach(({ tile, x, y }) => {
		const drawableItem = getDrawableItem({ tile });

		if (!drawableItem) {
			return;
		}

		drawRoundedImage(ctx, drawableItem?.imageElement, x, y, tile.width, tile.height, config.radius);
	});

	ctx.restore();

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

	const topSize = resolveSizeValue(config.fade.sizes.top, height, config.fade.size);
	const bottomSize = resolveSizeValue(config.fade.sizes.bottom, height, config.fade.size);
	const leftSize = resolveSizeValue(config.fade.sizes.left, width, config.fade.size);
	const rightSize = resolveSizeValue(config.fade.sizes.right, width, config.fade.size);

	ctx.save();
	ctx.globalCompositeOperation = "destination-in";

	if (config.fade.sides.top) {
		applyFadeSide({ ctx, width, height, side: "top", size: topSize });
	}

	if (config.fade.sides.bottom) {
		applyFadeSide({ ctx, width, height, side: "bottom", size: bottomSize });
	}

	if (config.fade.sides.left) {
		applyFadeSide({ ctx, width, height, side: "left", size: leftSize });
	}

	if (config.fade.sides.right) {
		applyFadeSide({ ctx, width, height, side: "right", size: rightSize });
	}

	ctx.restore();
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = "source-over";
};

const renderCvDiagonal = ({ ctx, width, height, layout }) => {
	drawLayout({ ctx, width, height, layout });

	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = "source-over";
};

export const mountShowcaseDiagonal = async (canvasId = "showcase-diagonal-container", options = {}) => {
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

	const key = createAnimationKey(CV_DIAGONAL_KEY_PREFIX, canvasId);
	const mountToken = beginMount(key);
	let itemLoadVersion = 0;
	const sceneId = options.scene || canvas.dataset.animationScene || DEFAULT_DIAGONAL_SCENE;
	const items = loadImages(getDiagonalItems(sceneId), {
		initialCount: 30,
		batchSize: 10,
		onItemLoad: () => {
			itemLoadVersion += 1;
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

			const shouldRebuild =
				!state.layout ||
				state.layout.width !== width ||
				state.layout.height !== height ||
				state.layoutVersion !== itemLoadVersion;

			if (shouldRebuild) {
				const previousOffset = state.layout?.offset || 0;
				state.layout = buildLayout({ width, height, items, previousOffset });
				state.layoutVersion = itemLoadVersion;
			}

			const dt = state.lastTime === null ? 16.6667 : clamp(time - state.lastTime, 0, 50);
			state.lastTime = time;

			updateLayout({ layout: state.layout, dt, reducedMotion });
			renderCvDiagonal({ ctx, width, height, layout: state.layout });
		},
	});

	const dispose = completeMount(key, mountToken, baseDispose);

	return createDisposeHandle(() => {
		state.disposed = true;
    items.cancel?.();
		dispose();
	});
};

export const mountDiagonal = mountShowcaseDiagonal;
export const mountShowcaseDiagonalScroll = mountShowcaseDiagonal;

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		disposeCanvasAnimationsByPrefix(CV_DIAGONAL_KEY_PREFIX);
	});
}
