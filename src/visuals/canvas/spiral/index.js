import {
	beginMount,
	completeMount,
	createAnimationKey,
	createCanvasAnimation,
	disposeCanvasAnimationsByPrefix,
	drawRoundedCover,
	isCurrentMount,
	loadCoverImages,
	noop,
} from "../../shared/canvas-animation.js";
import { createAnimationItems, CV_ANIMATION_SCENES } from "../cv-animation-assets.js";

const SPIRAL_KEY_PREFIX = "spiral:";
const DEFAULT_SPIRAL_SCENE = "jesteiLandingSpiral";
const SPIRAL_ITEM_LIMIT = 5;

const getSpiralUrls = (sceneId = DEFAULT_SPIRAL_SCENE) => {
	const scene = CV_ANIMATION_SCENES[sceneId] ?? CV_ANIMATION_SCENES[DEFAULT_SPIRAL_SCENE];
	return createAnimationItems(scene.modules).slice(0, SPIRAL_ITEM_LIMIT).map((item) => item.imageUrl);
};

const config = {
	speed: 0.00004,
	turns: 1.5,
	cardScale: 0.25,
	cardGrowthScale: 1.5,
	radiusScale: 0.4,
	alphaScale: 2,
	rotationOffset: Math.PI / 2,
	direction: -1,
};

const renderSpiral = ({ ctx, images, time, width, height, reducedMotion }) => {
	if (!width || !height || !images.length) {
		return;
	}

	const centerX = width * 0.5;
	const centerY = height * 0.5;
	const minSide = Math.min(width, height);
	const maxSide = Math.max(width, height);
	const timeOffset = reducedMotion ? 0 : time * config.speed;

	ctx.clearRect(0, 0, width, height);

	images.forEach((item, index) => {
		const t = (index / images.length + timeOffset) % 1;
		const angle = config.direction * t * Math.PI * 2 * config.turns + config.rotationOffset;
		const size = minSide * config.cardScale * (t * config.cardGrowthScale);
		const radius = size + t * maxSide * config.radiusScale;
		const x = centerX + Math.cos(angle) * radius;
		const y = centerY + Math.sin(angle) * radius;

		ctx.globalAlpha = Math.min(1, t * config.alphaScale);
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle + Math.PI / 2);
		drawRoundedCover(ctx, item.imageElement, -size * 0.5, -size * 0.5, size);
		ctx.restore();
	});

	ctx.globalAlpha = 1;
};

export const mountSpiral = async (canvasId = "spiral-container", options = {}) => {
	const canvas = document.getElementById(canvasId);
	const ctx = canvas?.getContext?.("2d");

	if (!canvas) {
		console.error(`Canvas with id "${canvasId}" not found`);
		return noop;
	}

	if (!ctx) {
		console.error(`Failed to get 2d context from canvas "${canvasId}"`);
		return noop;
	}

	const key = createAnimationKey(SPIRAL_KEY_PREFIX, canvasId);
	const mountToken = beginMount(key);
	const sceneId = options.scene || canvas.dataset.cvAnimationScene || DEFAULT_SPIRAL_SCENE;
	const images = await loadCoverImages(getSpiralUrls(sceneId));

	if (!isCurrentMount(key, mountToken)) {
		return noop;
	}

	const dispose = createCanvasAnimation({
		key,
		canvas,
		ctx,
		renderFrame: ({ time, width, height, reducedMotion }) =>
			renderSpiral({
				ctx,
				images,
				time,
				width,
				height,
				reducedMotion,
			}),
	});

	return completeMount(key, mountToken, dispose);
};

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		disposeCanvasAnimationsByPrefix(SPIRAL_KEY_PREFIX);
	});
}
