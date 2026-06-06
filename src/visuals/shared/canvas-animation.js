const pendingMounts = new Map();
const activeAnimations = new Map();
const imageCache = new Map();
const mediaCache = new Map();

const MP4_PATTERN = /\.mp4(?:$|[?#])/i;

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

export const isVideoUrl = (url) => MP4_PATTERN.test(String(url || ""));

export const loadVideo = (videoUrl) => {
  if (!videoUrl) {
    return Promise.reject(new Error("Cannot load an empty video URL."));
  }

  const cachedMedia = mediaCache.get(videoUrl);

  if (cachedMedia) {
    return cachedMedia;
  }

  const request = new Promise((resolve, reject) => {
    const VideoConstructor = globalThis.document?.createElement;

    if (!VideoConstructor) {
      reject(new Error("Video element is not available in this environment."));
      return;
    }

    const video = globalThis.document.createElement("video");

    video.preload = "metadata";
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.controls = false;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");

    const cleanup = () => {
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("canplay", handleLoaded);
      video.removeEventListener("error", handleError);
    };

    const handleLoaded = async () => {
      cleanup();

      try {
        await video.play?.();
      } catch {}

      resolve(video);
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to load video: ${videoUrl}`));
    };

    video.addEventListener("loadeddata", handleLoaded, { once: true });
    video.addEventListener("canplay", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.src = videoUrl;
    video.load?.();
  }).catch((error) => {
    mediaCache.delete(videoUrl);
    throw error;
  });

  mediaCache.set(videoUrl, request);
  return request;
};

export const loadMedia = (mediaUrl) => (isVideoUrl(mediaUrl) ? loadVideo(mediaUrl) : loadImage(mediaUrl));

export const getMediaDimensions = (media) => {
  if (!media) {
    return { width: 1, height: 1 };
  }

  const width = media.videoWidth || media.naturalWidth || media.width || 1;
  const height = media.videoHeight || media.naturalHeight || media.height || 1;

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
};

export const loadImageItems = async (items) =>
  Promise.all(
    items.map(async (item) => {
      try {
        const mediaUrl = item.mediaUrl || item.imageUrl;
        const mediaElement = await loadMedia(mediaUrl);

        return {
          ...item,
          imageElement: mediaElement,
          mediaElement,
          imageLoadError: null,
        };
      } catch (error) {
        return {
          ...item,
          imageElement: null,
          mediaElement: null,
          imageLoadError: error,
        };
      }
    }),
  );

/**
 * Progressive media loader.
 * Returns a mutable `items` array immediately (all with imageElement=null as placeholders).
 * Loads first `initialCount` items synchronously (awaited), then loads the rest in background
 * batches of `batchSize`. Updates the shared array in-place so the animation always sees fresh data.
 *
 * Usage:
 *   const items = await loadMediaProgressively(rawItems, { initialCount: 24 });
 *   // animation starts with first 24 loaded, rest arrive silently
 */
export const loadMediaProgressively = async (sourceItems, { initialCount = 24, batchSize = 8 } = {}) => {
  const items = sourceItems.map((item) => ({
    ...item,
    imageElement: null,
    mediaElement: null,
    imageLoadError: null,
  }));

  const loadOne = async (index) => {
    const item = items[index];
    if (!item) return;
    const mediaUrl = item.mediaUrl || item.imageUrl;
    try {
      const mediaElement = await loadMedia(mediaUrl);
      items[index] = { ...item, imageElement: mediaElement, mediaElement, imageLoadError: null };
    } catch (error) {
      items[index] = { ...item, imageElement: null, mediaElement: null, imageLoadError: error };
    }
  };

  // Load initial batch first — animation waits for these
  const firstBatch = Math.min(initialCount, items.length);
  await Promise.all(Array.from({ length: firstBatch }, (_, i) => loadOne(i)));

  // Load the rest in background, in small batches to avoid flooding the network
  if (items.length > firstBatch) {
    const loadBackground = async () => {
      for (let i = firstBatch; i < items.length; i += batchSize) {
        await Promise.all(Array.from({ length: Math.min(batchSize, items.length - i) }, (_, j) => loadOne(i + j)));
        // Yield control back to browser between batches
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    };
    loadBackground(); // intentionally not awaited
  }

  return items;
};

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

  const { width: mediaWidth, height: mediaHeight } = getMediaDimensions(image);
  const aspect = mediaWidth / mediaHeight;
  const sourceWidth = aspect > 1 ? mediaHeight : mediaWidth;
  const sourceHeight = sourceWidth;
  const sourceX = (mediaWidth - sourceWidth) * 0.5;
  const sourceY = (mediaHeight - sourceHeight) * 0.5;

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, size, size);
  ctx.restore();
};
