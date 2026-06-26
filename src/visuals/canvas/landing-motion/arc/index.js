const ARC_KEY_PREFIX = "arc:";
const pendingMounts = new Map();
const activeAnimations = new Map();
const imageCache = new Map();

const CANVAS_BACKGROUND_COLOR = "#fff";

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

const noop = () => {};

const getAnimationKey = (canvasId) => `${ARC_KEY_PREFIX}${canvasId}`;

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
    items.map(async (item) => {
      try {
        return {
          ...item,
          imageElement: await loadImage(item.imageUrl),
          imageLoadError: null,
        };
      } catch (error) {
        return {
          ...item,
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

const drawCoverPlaceholder = (ctx, x, y, size, radius = size * 0.1) => {
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fill();
  ctx.restore();
};

const drawRoundedCover = (ctx, image, x, y, size, radius = size * 0.1) => {
  if (!image) {
    drawCoverPlaceholder(ctx, x, y, size, radius);
    return;
  }

  const aspect = image.width / image.height;
  const sourceWidth = aspect > 1 ? image.height : image.width;
  const sourceHeight = sourceWidth;
  const sourceX = (image.width - sourceWidth) * 0.5;
  const sourceY = (image.height - sourceHeight) * 0.5;

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, size, size);
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

const clamp01 = (value) => Math.min(1, Math.max(0, value));

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

  clearCanvasBackground(ctx, width, height);

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
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === "undefined") return;
    injected = true;
    const style = document.createElement("style");
    style.textContent = `:root {
  --arc-title-font-family: "Inter Variable", "Inter", sans-serif;
  --arc-title-font-weight: 500;
  --arc-title-color: rgba(0, 0, 0, 0.92);
}`;
    document.head.appendChild(style);
  };
})();

export const mountArc = async (canvasId = "arc-container") => {
  injectStyles();
  const canvas = document.getElementById(canvasId);

  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return noop;
  }

  const ctx = canvas.getContext("2d");
  prepareCanvasBackground(canvas);

  if (!ctx) {
    console.error(`Failed to get 2d context from canvas "${canvasId}"`);
    return noop;
  }

  const key = getAnimationKey(canvasId);
  const mountToken = beginMount(key);
  const titleStyle = getTitleStyle(canvas);

  await loadTitleFont(titleStyle);

  const items = await loadImages(arcItems);

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

