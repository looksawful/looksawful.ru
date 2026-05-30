import {
	beginMount,
	completeMount,
	createAnimationKey,
	createCanvasAnimation,
	disposeCanvasAnimationsByPrefix,
	drawRoundedCover,
	isCurrentMount,
	loadImageItems,
	noop,
} from "../../shared/canvas-animation.js";

const ARC_KEY_PREFIX = "arc:";

const arcItems = [
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/70s.webp",
		title: "70's",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/80s.webp",
		title: "80's",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/90s.webp",
		title: "90's",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/afro-house.webp",
		title: "Afro House",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/ai.webp",
		title: "AI",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/amapiano.webp",
		title: "Amapiano",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/apple-music.webp",
		title: "Apple Music",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/bass-house.webp",
		title: "Bass House",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/billboard.webp",
		title: "Billboard",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/blaash.webp",
		title: "BLAASH",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/drum-and-bass.webp",
		title: "Drum & Bass",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/dubstep.webp",
		title: "Dubstep",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/khity.webp",
		title: "Хиты",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/luchshie-treki-mesyatsa.webp",
		title: "Лучшие треки месяца",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/mages.webp",
		title: "Mages",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/memy-i-prikoly.webp",
		title: "Мемы и приколы",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/mirovye-novinki.webp",
		title: "Мировые новинки",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/moombahton.webp",
		title: "Moombahton",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/novaya-volna.webp",
		title: "Новая волна",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/organic-and-melodic-house.webp",
		title: "Organic & Melodic House",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/r-and-b-classic.webp",
		title: "R&B Classic",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/rave.webp",
		title: "Rave",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/reels-top.webp",
		title: "Reels Top",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/rock-hits.webp",
		title: "Rock Hits",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/slap-house.webp",
		title: "Slap House",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/spotify.webp",
		title: "Spotify",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/styled.webp",
		title: "Styled",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/tantsevalnye-remiksy.webp",
		title: "Танцевальные ремиксы",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/tiktok-top.webp",
		title: "TikTok Top",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/tranzhishny.webp",
		title: "Транзишны",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/trap.webp",
		title: "Trap",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/uk-bass.webp",
		title: "UK Bass",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/uk-garage.webp",
		title: "UK Garage",
	},
	{
		imageUrl: "/src/lab/assets/projects/jestei/media/arc/zvuki-dlya-skretcha.webp",
		title: "Звуки для скрэтча",
	},
];

const config = {
	slots: 10,
	speed: 0.00005,
	radiusScale: 0.7,
	cardBaseScale: 0.17,
	cardMinScale: 0.25,
	cardMaxBonus: 1.3,
	cardFocusPower: 1.5,
	titleScale: 0.08,
	titleOffsetY: 0.62,
	titleMaxWidth: 1.9,
	edgeFadeStart: 0.68,
	edgeFadePower: 6,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const drawWrappedText = ({ ctx, text, x = 0, y, maxWidth, lineHeight, maxLines = 2 }) => {
	if (!text) {
		return;
	}

	const words = String(text).split(/\s+/).filter(Boolean);
	const lines = [];
	let line = "";

	words.forEach((word) => {
		const nextLine = line ? `${line} ${word}` : word;

		if (ctx.measureText(nextLine).width <= maxWidth || !line) {
			line = nextLine;
			return;
		}

		lines.push(line);
		line = word;
	});

	if (line) {
		lines.push(line);
	}

	const visibleLines = lines.slice(0, maxLines);
	const hiddenLineCount = lines.length - visibleLines.length;

	if (hiddenLineCount > 0) {
		const lastIndex = visibleLines.length - 1;
		visibleLines[lastIndex] = `${visibleLines[lastIndex].replace(/\s+$/, "")}...`;
	}

	visibleLines.forEach((visibleLine, index) => {
		ctx.fillText(visibleLine, x, y + index * lineHeight, maxWidth);
	});
};

const getTitleStyle = (canvas) => {
	const styles = globalThis.getComputedStyle?.(canvas);

	return {
		fontFamily:
			styles?.getPropertyValue("--arc-title-font-family").trim() ||
			`"Commissioner Variable", "Commissioner", sans-serif`,
		fontWeight: styles?.getPropertyValue("--arc-title-font-weight").trim() || "600",
		color: styles?.getPropertyValue("--arc-title-color").trim() || "rgba(0, 0, 0, 0.92)",
	};
};

const loadTitleFont = async ({ fontFamily, fontWeight }) => {
	const fonts = globalThis.document?.fonts;

	if (!fonts?.load) {
		return;
	}

	try {
		await fonts.load(`${fontWeight} 16px ${fontFamily}`);
	} catch (error) {
		console.warn("Arc font load failed, using fallback font.", error);
	}
};

const renderArc = ({ ctx, items, titleStyle, time, width, height, reducedMotion }) => {
	if (!width || !height || !items.length) {
		return;
	}

	const centerX = width * 0.5;
	const centerY = height;
	const minSide = Math.min(width, height);
	const phase = reducedMotion ? 0 : time * config.speed;
	const arcRadius = minSide * config.radiusScale;
	const cardBaseSize = minSide * config.cardBaseScale;

	ctx.clearRect(0, 0, width, height);

	for (let i = 0; i < config.slots; i += 1) {
		const raw = i / config.slots + phase;
		const t = raw % 1;
		const angle = t * Math.PI * 2;
		const x = centerX + Math.cos(angle) * arcRadius;
		const y = centerY + Math.sin(angle) * arcRadius;
		const item = items[(i + Math.floor(raw)) % items.length];

		const topZone = Math.max(0, Math.cos(angle - Math.PI * 1.5));
		const focus = Math.pow(topZone, config.cardFocusPower);
		const size = cardBaseSize * (config.cardMinScale + focus * config.cardMaxBonus);
		const edge = Math.abs(x - centerX) / centerX;
		const alpha = clamp01(1 - (edge - config.edgeFadeStart) * config.edgeFadePower);

		ctx.globalAlpha = alpha;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle + Math.PI / 2);

		drawRoundedCover(ctx, item.imageElement, -size * 0.5, -size * 0.5, size);

		const fontSize = size * config.titleScale;

		ctx.font = `${titleStyle.fontWeight} ${fontSize}px ${titleStyle.fontFamily}`;
		ctx.fillStyle = titleStyle.color;
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;

		drawWrappedText({
			ctx,
			text: item.title,
			y: size * config.titleOffsetY,
			maxWidth: size * config.titleMaxWidth,
			lineHeight: Math.max(fontSize * 1.12, 7),
			maxLines: 2,
		});

		ctx.restore();
	}

	ctx.globalAlpha = 1;
};

export const mountArc = async (canvasId = "arc-container") => {
	const canvas = document.getElementById(canvasId);

	if (!canvas) {
		console.error(`Canvas with id "${canvasId}" not found`);
		return noop;
	}

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.error(`Failed to get 2d context from canvas "${canvasId}"`);
		return noop;
	}

	const key = createAnimationKey(ARC_KEY_PREFIX, canvasId);
	const mountToken = beginMount(key);
	const titleStyle = getTitleStyle(canvas);

	await loadTitleFont(titleStyle);

	const items = await loadImageItems(arcItems);

	if (!isCurrentMount(key, mountToken)) {
		return noop;
	}

	const dispose = createCanvasAnimation({
		key,
		canvas,
		ctx,
		renderFrame: ({ time, width, height, reducedMotion }) =>
			renderArc({
				ctx,
				items,
				titleStyle,
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
		disposeCanvasAnimationsByPrefix(ARC_KEY_PREFIX);
	});
}
