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
} from "../../utils/canvas-animation.js";

const ARC_KEY_PREFIX = "arc:";

const arcItems = [
  {
    imageUrl: new URL("./assets/arc/70s.webp", import.meta.url).href,
    title: "70's",
  },
  {
    imageUrl: new URL("./assets/arc/80s.webp", import.meta.url).href,
    title: "80's",
  },
  {
    imageUrl: new URL("./assets/arc/90s.webp", import.meta.url).href,
    title: "90's",
  },
  {
    imageUrl: new URL("./assets/arc/afro-house.webp", import.meta.url).href,
    title: "Afro House",
  },
  {
    imageUrl: new URL("./assets/arc/ai.webp", import.meta.url).href,
    title: "AI",
  },
  {
    imageUrl: new URL("./assets/arc/amapiano.webp", import.meta.url).href,
    title: "Amapiano",
  },
  {
    imageUrl: new URL("./assets/arc/apple-music.webp", import.meta.url).href,
    title: "Apple Music",
  },
  {
    imageUrl: new URL("./assets/arc/bass-house.webp", import.meta.url).href,
    title: "Bass House",
  },
  {
    imageUrl: new URL("./assets/arc/billboard.webp", import.meta.url).href,
    title: "Billboard",
  },
  {
    imageUrl: new URL("./assets/arc/blaash.webp", import.meta.url).href,
    title: "BLAASH",
  },
  {
    imageUrl: new URL("./assets/arc/drum-and-bass.webp", import.meta.url).href,
    title: "Drum & Bass",
  },
  {
    imageUrl: new URL("./assets/arc/dubstep.webp", import.meta.url).href,
    title: "Dubstep",
  },
  {
    imageUrl: new URL("./assets/arc/khity.webp", import.meta.url).href,
    title: "Хиты",
  },
  {
    imageUrl: new URL("./assets/arc/luchshie-treki-mesyatsa.webp", import.meta.url).href,
    title: "Лучшие треки месяца",
  },
  {
    imageUrl: new URL("./assets/arc/mages.webp", import.meta.url).href,
    title: "Mages",
  },
  {
    imageUrl: new URL("./assets/arc/memy-i-prikoly.webp", import.meta.url).href,
    title: "Мемы и приколы",
  },
  {
    imageUrl: new URL("./assets/arc/mirovye-novinki.webp", import.meta.url).href,
    title: "Мировые новинки",
  },
  {
    imageUrl: new URL("./assets/arc/moombahton.webp", import.meta.url).href,
    title: "Moombahton",
  },
  {
    imageUrl: new URL("./assets/arc/novaya-volna.webp", import.meta.url).href,
    title: "Новая волна",
  },
  {
    imageUrl: new URL("./assets/arc/organic-and-melodic-house.webp", import.meta.url).href,
    title: "Organic & Melodic House",
  },
  {
    imageUrl: new URL("./assets/arc/r-and-b-classic.webp", import.meta.url).href,
    title: "R&B Classic",
  },
  {
    imageUrl: new URL("./assets/arc/rave.webp", import.meta.url).href,
    title: "Rave",
  },
  {
    imageUrl: new URL("./assets/arc/reels-top.webp", import.meta.url).href,
    title: "Reels Top",
  },
  {
    imageUrl: new URL("./assets/arc/rock-hits.webp", import.meta.url).href,
    title: "Rock Hits",
  },
  {
    imageUrl: new URL("./assets/arc/slap-house.webp", import.meta.url).href,
    title: "Slap House",
  },
  {
    imageUrl: new URL("./assets/arc/spotify.webp", import.meta.url).href,
    title: "Spotify",
  },
  {
    imageUrl: new URL("./assets/arc/styled.webp", import.meta.url).href,
    title: "Styled",
  },
  {
    imageUrl: new URL("./assets/arc/tantsevalnye-remiksy.webp", import.meta.url).href,
    title: "Танцевальные ремиксы",
  },
  {
    imageUrl: new URL("./assets/arc/tiktok-top.webp", import.meta.url).href,
    title: "TikTok Top",
  },
  {
    imageUrl: new URL("./assets/arc/tranzhishny.webp", import.meta.url).href,
    title: "Транзишны",
  },
  {
    imageUrl: new URL("./assets/arc/trap.webp", import.meta.url).href,
    title: "Trap",
  },
  {
    imageUrl: new URL("./assets/arc/uk-bass.webp", import.meta.url).href,
    title: "UK Bass",
  },
  {
    imageUrl: new URL("./assets/arc/uk-garage.webp", import.meta.url).href,
    title: "UK Garage",
  },
  {
    imageUrl: new URL("./assets/arc/zvuki-dlya-skretcha.webp", import.meta.url).href,
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
