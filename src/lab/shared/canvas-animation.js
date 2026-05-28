const pendingMounts = new Map();
const activeAnimations = new Map();
const imageCache = new Map();

export const noop = () => {};

export const createAnimationKey = (prefix, canvasId) => `${prefix}${canvasId}`;

export const beginMount = (key) => {
  const token = Symbol(key);

  pendingMounts.set(key, token);
  disposeCanvasAnimation(key);
  return token;
};

export const isCurrentMount = (key, token) => pendingMounts.get(key) === token;

export const completeMount = (key, token, dispose) => () => {
  if (isCurrentMount(key, token)) {
    pendingMounts.delete(key);
  }

  dispose();
};

export const getDevicePixelRatio = () =>
  Math.max(1, globalThis.devicePixelRatio || globalThis.window?.devicePixelRatio || 1);

export const resizeCanvasToDisplaySize = (canvas, ctx, dpr = getDevicePixelRatio()) => {
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

export const disposeCanvasAnimation = (key) => {
  const dispose = activeAnimations.get(key);

  if (!dispose) {
    return;
  }

  dispose();
};

export const disposeCanvasAnimationsByPrefix = (prefix) => {
  [...activeAnimations.keys()].forEach((key) => {
    if (key.startsWith(prefix)) {
      disposeCanvasAnimation(key);
    }
  });
};

export const createCanvasAnimation = ({ key, canvas, ctx, renderFrame }) => {
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

export const loadImage = (imageUrl) => {
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
      } catch {}

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

export const loadImageItems = async (items) =>
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

export const loadCoverImages = async (coverUrls) =>
  Promise.all(
    coverUrls.map(async (imageUrl) => {
      try {
        return {
          imageUrl,
          imageElement: await loadImage(imageUrl),
          imageLoadError: null,
        };
      } catch (error) {
        return {
          imageUrl,
          imageElement: null,
          imageLoadError: error,
        };
      }
    }),
  );

export const roundedRect = (ctx, x, y, width, height, radius) => {
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

export const drawCoverPlaceholder = (ctx, x, y, size, radius = size * 0.1) => {
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fill();
  ctx.restore();
};

export const drawRoundedCover = (ctx, image, x, y, size, radius = size * 0.1) => {
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
