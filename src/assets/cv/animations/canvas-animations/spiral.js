const SPIRAL_KEY_PREFIX = "spiral:";

export const SPIRAL_DEFAULT_ITEMS = [
  { imageUrl: new URL("./assets/spiral/14-fevralya.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/techno.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/unknown-blue-flare.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/hip-hop-classic.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/phonk.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/club-hits.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/remiksy.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/novaya-shkola.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/indie-dance.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/hyper-pop.webp", import.meta.url).href },
  { imageUrl: new URL("./assets/spiral/khity-russian.webp", import.meta.url).href },
];

export const SPIRAL_PRESETS = {
  default: {
    speed: 0.00004,
    turns: 1.5,
    cardScale: 0.25,
    cardGrowthScale: 1.5,
    radiusScale: 0.4,
    alphaScale: 2,
  },

  compact: {
    turns: 1.35,
    cardScale: 0.22,
    cardGrowthScale: 1.35,
    radiusScale: 0.34,
  },

  wide: {
    turns: 1.7,
    cardScale: 0.22,
    cardGrowthScale: 1.55,
    radiusScale: 0.5,
  },

  slow: {
    speed: 0.000025,
  },

  fast: {
    speed: 0.00007,
  },

  soft: {
    alphaScale: 1.45,
    cardGrowthScale: 1.25,
  },
};

const SPIRAL_DEFAULTS = {
  preset: "default",
  profile: null,
  items: SPIRAL_DEFAULT_ITEMS,

  speed: 0.00004,
  turns: 1.5,
  cardScale: 0.25,
  cardGrowthScale: 1.5,
  radiusScale: 0.4,
  alphaScale: 2,

  cardRadiusScale: 0.1,
  rotationOffset: Math.PI / 2,
  direction: -1,

  pauseOnReducedMotion: true,
  paused: false,
};

const noop = () => {};

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const deepMerge = (...sources) => {
  const target = {};
  sources.forEach((source) => {
    if (!isPlainObject(source)) return;
    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        target[key] = value.slice();
        return;
      }
      if (isPlainObject(value)) {
        target[key] = deepMerge(isPlainObject(target[key]) ? target[key] : {}, value);
        return;
      }
      target[key] = value;
    });
  });
  return target;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);

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

const createAnimationRuntime = (prefix) => {
  const pendingMounts = new Map();
  const activeAnimations = new Map();

  const getKey = (canvasId) => `${prefix}${canvasId}`;

  const disposeByKey = (key) => {
    const dispose = activeAnimations.get(key);
    if (dispose) dispose();
  };

  const disposeByPrefix = () => {
    [...activeAnimations.keys()].forEach((key) => {
      if (key.startsWith(prefix)) disposeByKey(key);
    });
  };

  const beginMount = (key) => {
    const token = Symbol(key);
    pendingMounts.set(key, token);
    disposeByKey(key);
    return token;
  };

  const isCurrentMount = (key, token) => pendingMounts.get(key) === token;

  const completeMount = (key, token, dispose) => () => {
    if (isCurrentMount(key, token)) pendingMounts.delete(key);
    dispose();
  };

  const createAnimation = ({ key, canvas, ctx, renderFrame }) => {
    disposeByKey(key);

    let disposed = false;
    let frameId;
    let running = false;
    let reducedMotion = false;

    const doc = globalThis.document;
    const win = globalThis.window;
    const motionQuery = win?.matchMedia?.("(prefers-reduced-motion: reduce)");

    const resize = () => resizeCanvasToDisplaySize(canvas, ctx);

    const frame = (time = 0) => {
      if (disposed || !running) return;

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
      if (disposed || running || typeof globalThis.requestAnimationFrame !== "function") return;
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
      if (disposed) return;

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

      if (activeAnimations.get(key) === dispose) activeAnimations.delete(key);
    };

    activeAnimations.set(key, dispose);
    start();

    return dispose;
  };

  return {
    getKey,
    beginMount,
    isCurrentMount,
    completeMount,
    createAnimation,
    disposeByPrefix,
    clearPending: () => pendingMounts.clear(),
  };
};

const createImageLoader = () => {
  const cache = new Map();

  const loadImage = (imageUrl) => {
    if (!imageUrl) return Promise.reject(new Error("Cannot load an empty image URL."));

    const cached = cache.get(imageUrl);
    if (cached) return cached;

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
          // Some browsers reject decode() after onload for cached or animated images.
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
      image.src = imageUrl;
    }).catch((error) => {
      cache.delete(imageUrl);
      throw error;
    });

    cache.set(imageUrl, request);
    return request;
  };

  const normalizeItem = (item) => (typeof item === "string" ? { imageUrl: item } : item);

  const loadImageItems = async (items = []) =>
    Promise.all(
      items.map(async (rawItem) => {
        const item = normalizeItem(rawItem) || {};
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

  return {
    loadImage,
    loadImageItems,
  };
};

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
  if (!image || !size) {
    drawCoverPlaceholder(ctx, x, y, size, radius);
    return;
  }

  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const sourceSize = Math.min(imageWidth, imageHeight);
  const sourceX = (imageWidth - sourceSize) * 0.5;
  const sourceY = (imageHeight - sourceSize) * 0.5;

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, x, y, size, size);
  ctx.restore();
};

const runtime = createAnimationRuntime(SPIRAL_KEY_PREFIX);
const imageLoader = createImageLoader();

const normalizeOptions = (rawOptions = {}) => {
  const presetName = rawOptions.profile || rawOptions.preset || "default";
  const preset = SPIRAL_PRESETS[presetName] || {};
  const options = deepMerge({}, SPIRAL_DEFAULTS, preset, rawOptions);

  options.preset = presetName;
  options.items = Array.isArray(options.items) ? options.items : SPIRAL_DEFAULT_ITEMS;
  options.speed = Number.isFinite(options.speed) ? Math.abs(options.speed) : SPIRAL_DEFAULTS.speed;
  options.turns = Math.max(0.1, Number(options.turns) || SPIRAL_DEFAULTS.turns);
  options.cardScale = Math.max(0, Number(options.cardScale) || SPIRAL_DEFAULTS.cardScale);
  options.cardGrowthScale = Math.max(0, Number(options.cardGrowthScale) || SPIRAL_DEFAULTS.cardGrowthScale);
  options.radiusScale = Math.max(0, Number(options.radiusScale) || SPIRAL_DEFAULTS.radiusScale);
  options.alphaScale = Math.max(0, Number(options.alphaScale) || SPIRAL_DEFAULTS.alphaScale);
  options.cardRadiusScale = Math.max(0, Number(options.cardRadiusScale) || SPIRAL_DEFAULTS.cardRadiusScale);
  options.rotationOffset = Number.isFinite(options.rotationOffset)
    ? options.rotationOffset
    : SPIRAL_DEFAULTS.rotationOffset;
  options.direction = Number(options.direction) >= 0 ? 1 : -1;
  options.pauseOnReducedMotion = Boolean(options.pauseOnReducedMotion);
  options.paused = Boolean(options.paused);

  return options;
};

const renderSpiral = ({ ctx, items, options, time, width, height, reducedMotion, state }) => {
  if (!width || !height || !items.length) {
    ctx.clearRect(0, 0, width || 0, height || 0);
    return;
  }

  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const timeOffset =
    reducedMotion && options.pauseOnReducedMotion ? 0 : state.paused ? state.phase : time * options.speed;

  if (!state.paused) state.phase = timeOffset;

  ctx.clearRect(0, 0, width, height);

  items.forEach((item, index) => {
    const t = (index / items.length + timeOffset) % 1;
    const angle = options.direction * t * Math.PI * 2 * options.turns + options.rotationOffset;
    const size = minSide * options.cardScale * (t * options.cardGrowthScale);
    const radius = size + t * maxSide * options.radiusScale;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const alpha = clamp01(t * options.alphaScale);

    if (size <= 0 || alpha <= 0) return;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    drawRoundedCover(ctx, item.imageElement, -size * 0.5, -size * 0.5, size, size * options.cardRadiusScale);
    ctx.restore();
  });

  ctx.globalAlpha = 1;
};

const createNoopController = () => ({
  dispose: noop,
  pause: noop,
  play: noop,
  stopAll: noop,
  startAll: noop,
  update: noop,
  getState: () => ({}),
});

export const mountSpiral = async (canvasId = "spiral-container", userOptions = {}) => {
  const canvas = globalThis.document?.getElementById?.(canvasId);

  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return createNoopController();
  }

  const ctx = canvas.getContext?.("2d");

  if (!ctx) {
    console.error(`Failed to get 2d context from canvas "${canvasId}"`);
    return createNoopController();
  }

  let options = normalizeOptions(userOptions);
  const key = runtime.getKey(canvasId);
  const mountToken = runtime.beginMount(key);
  const items = await imageLoader.loadImageItems(options.items);

  if (!runtime.isCurrentMount(key, mountToken)) {
    return createNoopController();
  }

  const state = {
    paused: Boolean(options.paused),
    phase: 0,
    disposed: false,
  };

  const controller = {
    dispose: noop,

    pause() {
      state.paused = true;
    },

    play() {
      state.paused = false;
    },

    stopAll() {
      this.pause();
    },

    startAll() {
      this.play();
    },

    update(nextOptions = {}) {
      const nextItems = Array.isArray(nextOptions.items) ? nextOptions.items : null;
      options = normalizeOptions(deepMerge({}, options, nextOptions));
      state.paused = Boolean(options.paused);

      if (nextItems) {
        console.warn("mountSpiral.update() does not reload images. Remount the animation to replace items.");
      }
    },

    getState() {
      return {
        options: deepMerge({}, options),
        paused: state.paused,
        itemCount: items.length,
      };
    },
  };

  const baseDispose = runtime.createAnimation({
    key,
    canvas,
    ctx,
    renderFrame: ({ time, width, height, reducedMotion }) => {
      if (state.disposed) return;

      renderSpiral({
        ctx,
        items,
        options,
        time,
        width,
        height,
        reducedMotion,
        state,
      });
    },
  });

  const dispose = runtime.completeMount(key, mountToken, baseDispose);

  controller.dispose = () => {
    state.disposed = true;
    dispose();
  };

  return controller;
};
