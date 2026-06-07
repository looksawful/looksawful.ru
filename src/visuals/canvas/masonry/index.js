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
  limitAnimationItems,
  getCanvasMountOptions,
  drawCanvasLoadingState,
} from "../../shared/canvas-animation.js";
import { createAnimationItems, CV_ANIMATION_SCENES } from "../cv-animation-assets.js";

const MASONRY_KEY_PREFIX = "masonry:";
const DEFAULT_MASONRY_SCENE = "jesteiInterfaceMasonry";

const SCENE_CONFIGS = {
	jesteiInterfaceMasonry: {
		rowCount: 3,
		gap: 8,
		radius: 8,
		speed: 0.026,
		fillMultiplier: 5.2,
		background: "transparent",
		minRatio: 0.86,
		maxRatio: 2.75,
	},
	jesteiLandingMasonry: {
		rowCount: 3,
		gap: 8,
		radius: 8,
		speed: 0.018,
		fillMultiplier: 4.8,
		background: "#000",
		minRatio: 0.82,
		maxRatio: 1.75,
	},
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const resolveSceneId = (sceneId) =>
	CV_ANIMATION_SCENES[sceneId] ? sceneId : DEFAULT_MASONRY_SCENE;

const getSceneConfig = (sceneId) => ({
	...SCENE_CONFIGS[DEFAULT_MASONRY_SCENE],
	...(SCENE_CONFIGS[sceneId] || {}),
});

const getSceneItems = (sceneId) =>
	createAnimationItems(CV_ANIMATION_SCENES[resolveSceneId(sceneId)].modules);

const loadImagesProgressive = (items, { initialCount = 24, batchSize = 10 } = {}) => {
	const loaded = items.map((item, sourceIndex) => ({
		...item,
		sourceIndex,
		imageElement: null,
		imageLoadError: null,
	}));

	const loadOne = (index) => {
		const mediaUrl = loaded[index]?.mediaUrl || loaded[index]?.imageUrl;
		if (!mediaUrl) return Promise.resolve();

		return loadMedia(mediaUrl)
			.then((element) => {
				loaded[index].imageElement = element;
			})
			.catch((error) => {
				loaded[index].imageLoadError = error;
			});
	};

	const firstEnd = Math.min(initialCount, loaded.length);
	for (let index = 0; index < firstEnd; index += 1) {
		loadOne(index);
	}

	if (loaded.length > firstEnd) {
		(async () => {
			for (let index = firstEnd; index < loaded.length; index += batchSize) {
				const end = Math.min(index + batchSize, loaded.length);
				await Promise.all(
					Array.from({ length: end - index }, (_, offset) => loadOne(index + offset)),
				);
				await new Promise((resolve) => setTimeout(resolve, 80));
			}
		})();
	}

	return loaded;
};

const getLoadedCount = (items) =>
	items.reduce((count, item) => count + (item.imageElement ? 1 : 0), 0);

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
	if (!width || !height) return;

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
		sw = sourceHeight * targetRatio;
		sx = (sourceWidth - sw) * 0.5;
	} else {
		sh = sourceWidth / targetRatio;
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

const getItemAspectRatio = (item) => {
	const image = item?.imageElement;
	const width = image?.videoWidth || image?.naturalWidth || image?.width || 1;
	const height = image?.videoHeight || image?.naturalHeight || image?.height || 1;

	return width / height;
};

const createTile = ({ item, cursor, rowHeight, sceneConfig }) => {
	const ratio = clamp(getItemAspectRatio(item), sceneConfig.minRatio, sceneConfig.maxRatio);
	const width = Math.max(rowHeight * sceneConfig.minRatio, rowHeight * ratio);

	return {
		item,
		x: cursor,
		width,
		height: rowHeight,
	};
};

const buildRow = ({ rowIndex, rowCount, items, width, rowHeight, sceneConfig }) => {
	const sourceItems = items.filter((_, index) => index % rowCount === rowIndex);
	const rowItems = sourceItems.length ? sourceItems : items;
	const targetLength = Math.max(
		width + rowHeight * sceneConfig.fillMultiplier,
		width * 2.25,
	);
	const tiles = [];
	let cursor = 0;
	let safety = 0;

	while (cursor < targetLength && rowItems.length && safety < rowItems.length * 40) {
		const item = rowItems[safety % rowItems.length];
		const tile = createTile({ item, cursor, rowHeight, sceneConfig });
		tiles.push(tile);
		cursor += tile.width + sceneConfig.gap;
		safety += 1;
	}

	return {
		rowIndex,
		y: rowIndex * (rowHeight + sceneConfig.gap),
		height: rowHeight,
		sequenceWidth: Math.max(cursor, 1),
		direction: rowIndex % 2 === 0 ? -1 : 1,
		phase: rowIndex * rowHeight * 0.9,
		tiles,
	};
};

const buildLayout = ({ width, height, items, sceneId, sceneConfig }) => {
	const rowCount = clamp(
		Math.round(sceneConfig.rowCount),
		1,
		Math.max(1, Math.min(sceneConfig.rowCount, items.length)),
	);
	const totalGap = sceneConfig.gap * Math.max(0, rowCount - 1);
	const rowHeight = Math.max(1, (height - totalGap) / rowCount);
	const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
		buildRow({ rowIndex, rowCount, items, width, rowHeight, sceneConfig }),
	);

	return {
		sceneId,
		width,
		height,
		loadedCount: getLoadedCount(items),
		rows,
	};
};

const renderRow = ({ ctx, row, width, time, sceneConfig, reducedMotion }) => {
	if (!row.tiles.length) return;

	const sequenceWidth = Math.max(row.sequenceWidth, width + sceneConfig.gap);
	const shift = reducedMotion
		? row.phase % sequenceWidth
		: (time * sceneConfig.speed + row.phase) % sequenceWidth;
	const offset = row.direction < 0 ? -shift : shift - sequenceWidth;
	const start = offset - sequenceWidth;
	const end = width + sequenceWidth;

	for (let baseX = start; baseX < end; baseX += sequenceWidth) {
		row.tiles.forEach((tile) => {
			const x = baseX + tile.x;
			if (x > width || x + tile.width < 0) return;

			drawRoundedImage(
				ctx,
				tile.item?.imageElement,
				x,
				row.y,
				tile.width,
				tile.height,
				sceneConfig.radius,
			);
		});
	}
};

const renderMasonry = ({ ctx, width, height, layout, time, sceneConfig, reducedMotion }) => {
	ctx.clearRect(0, 0, width, height);

	if (sceneConfig.background !== "transparent") {
		ctx.fillStyle = sceneConfig.background;
		ctx.fillRect(0, 0, width, height);
	}

	layout.rows.forEach((row) => {
		renderRow({ ctx, row, width, time, sceneConfig, reducedMotion });
	});

	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = "source-over";
};

const createDisposeHandle = (dispose = noop) => {
	const handle = () => dispose();
	handle.dispose = handle;
	return handle;
};

export const mountMasonry = async (canvasId = "masonry-container", options = {}) => {
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

	const sceneId = resolveSceneId(options.scene || canvas.dataset.cvAnimationScene);
	const sceneConfig = getSceneConfig(sceneId);
	const key = createAnimationKey(MASONRY_KEY_PREFIX, canvasId);
	const mountToken = beginMount(key);
	const tuning = getCanvasMountOptions(canvas, options, {
    maxItems: 36,
    initialCount: 12,
    batchSize: 6,
    fps: 30,
  });
  const items = loadImagesProgressive(getSceneItems(sceneId), {
    initialCount: tuning.initialCount,
    batchSize: tuning.batchSize,
  });

	if (!isCurrentMount(key, mountToken)) {
		return createDisposeHandle();
	}

	const state = {
		layout: null,
		disposed: false,
	};

	const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    maxDpr: tuning.maxDpr,
    fps: tuning.fps,
    renderFrame: ({ time, width, height, reducedMotion }) => {
			if (state.disposed) return;

			if (!width || !height || !items.length) {
				ctx.clearRect(0, 0, width || 0, height || 0);
				return;
      }

      if (!items.some((item) => item?.imageElement)) {
        drawCanvasLoadingState(ctx, width, height);
        return;
      }

			const loadedCount = getLoadedCount(items);
			const shouldRebuild =
				!state.layout ||
				state.layout.width !== width ||
				state.layout.height !== height ||
				state.layout.sceneId !== sceneId ||
				state.layout.loadedCount !== loadedCount;

			if (shouldRebuild) {
				state.layout = buildLayout({ width, height, items, sceneId, sceneConfig });
			}

			renderMasonry({
				ctx,
				width,
				height,
				layout: state.layout,
				time,
				sceneConfig,
				reducedMotion,
			});
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
		disposeCanvasAnimationsByPrefix(MASONRY_KEY_PREFIX);
	});
}
