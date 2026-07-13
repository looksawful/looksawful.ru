import { ANIMATION_SCENES, createAnimationItems } from "../showcase-animation-assets.js";

const DEFAULT_SCENE_ID = "jesteiProductDesignMasonry";
const ACTIVE_GRIDS = new Map();
const IMAGE_CACHE = new Map();

const CONFIG = {
  background: "#fff",
  gap: 8,
  radius: 8,
  targetTileWidth: 176,
  minColumns: 2,
  maxColumns: 10,
  speed: 0.028,
  maxDpr: 2.5,
};

const noop = () => {};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

const hashString = (value) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const getCanvas = (canvasOrId) => {
  if (typeof canvasOrId === "string") {
    return globalThis.document?.getElementById?.(canvasOrId) || null;
  }

  return canvasOrId?.getContext ? canvasOrId : null;
};

const getSceneItems = (canvas, options = {}) => {
  const sceneId =
    options.scene ||
    canvas?.dataset?.animationScene ||
    canvas?.dataset?.masonryScene ||
    DEFAULT_SCENE_ID;
  const scene = ANIMATION_SCENES[sceneId] || ANIMATION_SCENES[DEFAULT_SCENE_ID];

  if (!scene) {
    return [];
  }

  const uniqueItems = [...new Map(
    createAnimationItems(scene.modules || {}).map((item) => [item.imageUrl, item]),
  ).values()];

  return uniqueItems
    .sort((left, right) => {
      const leftHash = hashString(left.sourcePath || left.imageUrl || "");
      const rightHash = hashString(right.sourcePath || right.imageUrl || "");
      return leftHash - rightHash;
    })
    .slice(0, scene.defaultMaxItems || 96);
};

const loadImage = (url) => {
  if (!url) {
    return Promise.reject(new Error("Cannot load an empty image URL."));
  }

  const cached = IMAGE_CACHE.get(url);
  if (cached) {
    return cached;
  }

  const request = new Promise((resolve, reject) => {
    const ImageConstructor = globalThis.Image;

    if (!ImageConstructor) {
      reject(new Error("Image constructor is not available."));
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
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  }).catch((error) => {
    IMAGE_CACHE.delete(url);
    throw error;
  });

  IMAGE_CACHE.set(url, request);
  return request;
};

const prepareItems = (items, onChange) =>
  items.map((item) => {
    const prepared = {
      ...item,
      imageElement: null,
      imageLoadError: null,
    };

    void loadImage(item.imageUrl)
      .then((image) => {
        prepared.imageElement = image;
        prepared.imageLoadError = null;
        onChange();
      })
      .catch((error) => {
        prepared.imageLoadError = error;
        onChange();
      });

    return prepared;
  });

const roundedRect = (ctx, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width * 0.5, height * 0.5);

  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, safeRadius);
    return;
  }

  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
};

const drawPlaceholder = (ctx, x, y, size) => {
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, CONFIG.radius);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 0, 0, 0.055)";
  ctx.fill();
  ctx.restore();
};

const drawCoverImage = (ctx, image, x, y, size) => {
  if (!image) {
    drawPlaceholder(ctx, x, y, size);
    return;
  }

  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const sourceRatio = sourceWidth / sourceHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > 1) {
    sw = sourceHeight;
    sx = (sourceWidth - sw) * 0.5;
  } else if (sourceRatio < 1) {
    sh = sourceWidth;
    sy = (sourceHeight - sh) * 0.5;
  }

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, CONFIG.radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, x, y, size, size);
  ctx.restore();
};

const getLayout = (width) => {
  const preferredWidth = width <= 32 * 16 ? 116 : width <= 48 * 16 ? 144 : CONFIG.targetTileWidth;
  const columns = clamp(
    Math.round((width + CONFIG.gap) / (preferredWidth + CONFIG.gap)),
    CONFIG.minColumns,
    CONFIG.maxColumns,
  );
  const tileSize = Math.max(1, (width - CONFIG.gap * (columns - 1)) / columns);

  return {
    columns,
    tileSize,
    rowStride: tileSize + CONFIG.gap,
  };
};

const resizeCanvas = (canvas, ctx) => {
  const width = Math.max(1, canvas.clientWidth || 0);
  const height = Math.max(1, canvas.clientHeight || 0);
  const dpr = Math.min(CONFIG.maxDpr, Math.max(1, globalThis.devicePixelRatio || 1));
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
};

const clearCanvas = (ctx, width, height) => {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = CONFIG.background;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

const drawGrid = ({ ctx, width, height, items, elapsed, reducedMotion }) => {
  clearCanvas(ctx, width, height);

  if (!items.length) {
    return;
  }

  const layout = getLayout(width);
  const travel = reducedMotion ? 0 : elapsed * CONFIG.speed;
  const completedRows = Math.floor(travel / layout.rowStride);
  const rowOffset = travel - completedRows * layout.rowStride;
  const visibleRowCount = Math.ceil(height / layout.rowStride) + 2;

  for (let row = -1; row <= visibleRowCount; row += 1) {
    const logicalRow = completedRows + row;
    const y = row * layout.rowStride - rowOffset;

    for (let column = 0; column < layout.columns; column += 1) {
      const x = column * layout.rowStride;
      const sourceIndex = modulo(logicalRow * layout.columns + column, items.length);
      drawCoverImage(ctx, items[sourceIndex]?.imageElement, x, y, layout.tileSize);
    }
  }
};

const createDisposeHandle = (dispose = noop) => {
  const handle = () => dispose();
  handle.dispose = handle;
  return handle;
};

export const mountJesteiProductGrid = async (canvasOrId = "archive-jestei-product-horizontal", options = {}) => {
  const canvas = getCanvas(canvasOrId);

  if (!canvas) {
    console.error(`Canvas "${String(canvasOrId)}" was not found.`);
    return createDisposeHandle();
  }

  const ctx = canvas.getContext?.("2d");

  if (!ctx) {
    console.error("Failed to get a 2d context for the Jestei product grid.");
    return createDisposeHandle();
  }

  const key = canvas.id || canvas;
  ACTIVE_GRIDS.get(key)?.();

  canvas.style.background = CONFIG.background;
  canvas.style.backgroundColor = CONFIG.background;

  let disposed = false;
  let frameId;
  let running = false;
  let inViewport = true;
  let elapsedTime = 0;
  let lastTime = null;
  let reducedMotion = false;
  let redrawStaticFrame = noop;

  const items = prepareItems(getSceneItems(canvas, options), () => {
    if (reducedMotion) {
      redrawStaticFrame();
    }
  });

  const win = globalThis.window;
  const doc = globalThis.document;
  const motionQuery = win?.matchMedia?.("(prefers-reduced-motion: reduce)");

  const updateReducedMotion = () => {
    reducedMotion = Boolean(motionQuery?.matches);
  };

  const stop = () => {
    running = false;
    lastTime = null;
    if (frameId !== undefined) {
      globalThis.cancelAnimationFrame?.(frameId);
      frameId = undefined;
    }
  };

  const frame = (time = 0) => {
    if (disposed || !running) {
      return;
    }

    if (!inViewport || doc?.hidden) {
      frameId = globalThis.requestAnimationFrame(frame);
      return;
    }

    if (lastTime !== null) {
      elapsedTime += clamp(time - lastTime, 0, 50);
    }
    lastTime = time;

    const { width, height } = resizeCanvas(canvas, ctx);
    drawGrid({ ctx, width, height, items, elapsed: elapsedTime, reducedMotion });
    frameId = globalThis.requestAnimationFrame(frame);
  };

  const start = () => {
    if (disposed || running || typeof globalThis.requestAnimationFrame !== "function") {
      return;
    }

    running = true;
    frameId = globalThis.requestAnimationFrame(frame);
  };

  redrawStaticFrame = () => {
    if (disposed || !canvas.isConnected) {
      return;
    }

    const { width, height } = resizeCanvas(canvas, ctx);
    drawGrid({ ctx, width, height, items, elapsed: elapsedTime, reducedMotion });
  };

  const resizeObserver = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(() => {
        if (!running || reducedMotion) {
          redrawStaticFrame();
        }
      })
    : null;

  const intersectionObserver = globalThis.IntersectionObserver
    ? new globalThis.IntersectionObserver(
        ([entry]) => {
          inViewport = entry?.isIntersecting ?? true;
          if (inViewport) {
            start();
          } else {
            stop();
          }
        },
        { rootMargin: "240px 0px" },
      )
    : null;

  const handleVisibility = () => {
    if (doc?.hidden) {
      stop();
      return;
    }
    start();
  };

  const handleMotionChange = () => {
    updateReducedMotion();
    redrawStaticFrame();
  };

  updateReducedMotion();
  resizeObserver?.observe(canvas);
  intersectionObserver?.observe(canvas);
  win?.addEventListener?.("resize", redrawStaticFrame);
  doc?.addEventListener?.("visibilitychange", handleVisibility);

  if (motionQuery?.addEventListener) {
    motionQuery.addEventListener("change", handleMotionChange);
  } else {
    motionQuery?.addListener?.(handleMotionChange);
  }

  redrawStaticFrame();
  start();

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    win?.removeEventListener?.("resize", redrawStaticFrame);
    doc?.removeEventListener?.("visibilitychange", handleVisibility);

    if (motionQuery?.removeEventListener) {
      motionQuery.removeEventListener("change", handleMotionChange);
    } else {
      motionQuery?.removeListener?.(handleMotionChange);
    }

    if (ACTIVE_GRIDS.get(key) === dispose) {
      ACTIVE_GRIDS.delete(key);
    }
  };

  ACTIVE_GRIDS.set(key, dispose);
  return createDisposeHandle(dispose);
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    [...ACTIVE_GRIDS.values()].forEach((dispose) => dispose());
    ACTIVE_GRIDS.clear();
  });
}
