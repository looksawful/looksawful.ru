import {
  beginMount,
  completeMount,
  createAnimationKey,
  createCanvasAnimation,
  disposeCanvasAnimationsByPrefix,
  isCurrentMount,
  loadImage,
  noop,
  roundedRect,
} from "../../shared/canvas-animation.js";
import { createAnimationItems, CV_ANIMATION_SCENES } from "../cv-animation-assets.js";

const CV_CAROUSEL_KEY_PREFIX = "cv-carousel:";

const CV_CAROUSEL_TITLES = {
  1: "Art Direction",
  2: "Design Systems",
  3: "Brand Identity",
  4: "Web Interfaces",
  5: "3D / CGI",
  6: "Editorial Graphics",
  7: "AI Pipelines",
  8: "Production",
};

const config = {
  slots: 6,
  speed: 0.000045,

  cardAspectRatio: 1.38,
  cardWidthScale: 0.34,
  cardMinWidth: 92,
  cardMaxWidth: 560,

  cardMinScale: 0.24,
  cardMaxScale: 1.1,
  cardFocusPower: 1.42,

  centerY: 0.5,
  farYOffset: -0.035,
  maxRotation: 0.055,

  edgeOverscanWidth: 0.22,
  edgeFadeRange: 0.12,

  radius: 14,

  titleScale: 0.065,
  titleOffsetY: 0.66,
  titleMaxWidth: 1.55,
  titleMaxLines: 2,

  pauseOnReducedMotion: true,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const getTitle = (stem) => {
  if (CV_CAROUSEL_TITLES[stem]) {
    return CV_CAROUSEL_TITLES[stem];
  }

  return stem.replace(/[-_]+/g, " ");
};

const cvCarouselItems = createAnimationItems(CV_ANIMATION_SCENES.lyveGraphicCarousel.modules, { getTitle });

const createDisposeHandle = (dispose = noop) => {
  const handle = () => dispose();
  handle.dispose = handle;
  return handle;
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

const drawImagePlaceholder = (ctx, x, y, width, height, radius) => {
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();
  ctx.restore();
};

const drawRoundedCover = (ctx, image, x, y, width, height, radius) => {
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

  if (hiddenLineCount > 0 && visibleLines.length) {
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
      styles?.getPropertyValue("--cv-carousel-title-font-family").trim() ||
      `"Commissioner Variable", "Commissioner", sans-serif`,
    fontWeight: styles?.getPropertyValue("--cv-carousel-title-font-weight").trim() || "600",
    color: styles?.getPropertyValue("--cv-carousel-title-color").trim() || "rgba(0, 0, 0, 0.92)",
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
    console.warn("CV carousel font load failed, using fallback font.", error);
  }
};

const getCardMetrics = ({ t, width, height }) => {
  const minSide = Math.min(width, height);
  const focusRaw = Math.sin(Math.PI * t);
  const focus = Math.pow(Math.max(0, focusRaw), config.cardFocusPower);
  const scale = config.cardMinScale + focus * (config.cardMaxScale - config.cardMinScale);

  const maxWidth = Math.min(config.cardMaxWidth, width * 0.84);
  const cardWidth = clamp(minSide * config.cardWidthScale * scale, config.cardMinWidth, maxWidth);
  const cardHeight = cardWidth / config.cardAspectRatio;

  const overscan = width * config.edgeOverscanWidth + cardWidth;
  const x = lerp(-overscan, width + overscan, t);
  const y = height * config.centerY + (1 - focus) * height * config.farYOffset;

  const fadeIn = smoothstep(0, config.edgeFadeRange, t);
  const fadeOut = 1 - smoothstep(1 - config.edgeFadeRange, 1, t);
  const alpha = clamp01(fadeIn * fadeOut);

  const rotation = lerp(config.maxRotation, -config.maxRotation, t);

  return {
    focus,
    scale,
    x,
    y,
    width: cardWidth,
    height: cardHeight,
    alpha,
    rotation,
  };
};

const getCards = ({ items, time, width, height, reducedMotion }) => {
  const slotCount = Math.min(config.slots, Math.max(1, items.length));
  const phase = reducedMotion ? 0 : time * config.speed;
  const cards = [];

  for (let i = 0; i < slotCount; i += 1) {
    const raw = i / slotCount + phase;
    const generation = Math.floor(raw);
    const t = raw - generation;
    const item = items[(i + generation * slotCount) % items.length];
    const metrics = getCardMetrics({ t, width, height });

    cards.push({
      ...metrics,
      t,
      item,
      slotIndex: i,
    });
  }

  return cards.sort((a, b) => a.focus - b.focus || a.x - b.x);
};

const renderCvCarousel = ({ ctx, items, titleStyle, time, width, height, reducedMotion }) => {
  if (!width || !height || !items.length) {
    return;
  }

  ctx.clearRect(0, 0, width, height);

  const cards = getCards({ items, time, width, height, reducedMotion });

  cards.forEach((card) => {
    const x = -card.width * 0.5;
    const y = -card.height * 0.5;
    const fontSize = Math.max(8, card.width * config.titleScale);
    const lineHeight = Math.max(fontSize * 1.12, 9);
    const titleY = card.height * config.titleOffsetY;
    const titleMaxWidth = card.width * config.titleMaxWidth;

    ctx.globalAlpha = card.alpha;

    ctx.save();
    ctx.translate(card.x, card.y);
    ctx.rotate(card.rotation);

    drawRoundedCover(ctx, card.item.imageElement, x, y, card.width, card.height, config.radius);

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
      text: card.item.title,
      y: titleY,
      maxWidth: titleMaxWidth,
      lineHeight,
      maxLines: config.titleMaxLines,
    });

    ctx.restore();
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

export const mountCvCarousel = async (canvasId = "cv-carousel-container") => {
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

  const key = createAnimationKey(CV_CAROUSEL_KEY_PREFIX, canvasId);
  const mountToken = beginMount(key);
  const titleStyle = getTitleStyle(canvas);

  await loadTitleFont(titleStyle);

  const items = await loadImages(cvCarouselItems);

  if (!isCurrentMount(key, mountToken)) {
    return createDisposeHandle();
  }

  const state = {
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
        ctx.clearRect(0, 0, width || 0, height || 0);
        return;
      }

      renderCvCarousel({
        ctx,
        items,
        titleStyle,
        time,
        width,
        height,
        reducedMotion: reducedMotion && config.pauseOnReducedMotion,
      });
    },
  });

  const dispose = completeMount(key, mountToken, baseDispose);

  return createDisposeHandle(() => {
    state.disposed = true;
    dispose();
  });
};

export const mountCvScrollCarousel = mountCvCarousel;
export const mountHorizontalCarousel = mountCvCarousel;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeCanvasAnimationsByPrefix(CV_CAROUSEL_KEY_PREFIX);
  });
}
