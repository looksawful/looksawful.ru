const pendingMounts = new Map();
const activeAnimations = new Map();
const imageCache = new Map();
const mediaCache = new Map();

const MP4_PATTERN = /\.mp4(?:$|[?#])/i;

export const noop = () => {};

export const getDefaultCanvasMaxDpr = () => {
  const win = globalThis.window;
  const nav = globalThis.navigator;

  const memory = Number(nav?.deviceMemory) || 8;
  const cores = Number(nav?.hardwareConcurrency) || 8;
  const coarsePointer = Boolean(win?.matchMedia?.("(pointer: coarse)")?.matches);
  const reducedMotion = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

  if (reducedMotion) return 1;
  if (memory <= 4 || cores <= 4 || coarsePointer) return 1.35;
  return 1.75;
};

export const getCanvasQualityProfile = () => {
  const win = globalThis.window;
  const nav = globalThis.navigator;

  const memory = Number(nav?.deviceMemory) || 8;
  const cores = Number(nav?.hardwareConcurrency) || 8;
  const reducedMotion = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const coarsePointer = Boolean(win?.matchMedia?.("(pointer: coarse)")?.matches);

  if (reducedMotion) return "reduced";
  if (memory <= 4 || cores <= 4 || coarsePointer) return "low";
  return "normal";
};

export const getCanvasMountOptions = (canvas, options = {}, defaults = {}) => {
  const dataset = canvas?.dataset || {};
  const quality = options.quality || dataset.cvAnimationQuality || getCanvasQualityProfile();

  const qualityDefaults = {
    reduced: { maxDpr: 1, maxItems: 12, initialCount: 4, batchSize: 4, fps: 24 },
    low: { maxDpr: 1.25, maxItems: 20, initialCount: 8, batchSize: 4, fps: 30 },
    normal: { maxDpr: getDefaultCanvasMaxDpr(), maxItems: 36, initialCount: 12, batchSize: 6, fps: 60 },
  };

  const profile = qualityDefaults[quality] || qualityDefaults.normal;

  const numberFrom = (value, fallback, min = 1, max = Number.POSITIVE_INFINITY) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(numeric)));
  };

  return {
    quality,
    maxDpr: Number(options.maxDpr ?? dataset.cvAnimationDpr ?? defaults.maxDpr ?? profile.maxDpr),
    maxItems: numberFrom(options.maxItems ?? dataset.cvAnimationMaxItems, defaults.maxItems ?? profile.maxItems, 1, 160),
    initialCount: numberFrom(
      options.initialCount ?? dataset.cvAnimationInitialCount,
      defaults.initialCount ?? profile.initialCount,
      1,
      80,
    ),
    batchSize: numberFrom(options.batchSize ?? dataset.cvAnimationBatchSize, defaults.batchSize ?? profile.batchSize, 1, 32),
    fps: numberFrom(options.fps ?? dataset.cvAnimationFps, defaults.fps ?? profile.fps, 1, 60),
    speedScale: Number(options.speedScale ?? dataset.cvAnimationSpeed ?? defaults.speedScale ?? 1) || 1,
  };
};

export const limitAnimationItems = (items, sceneId = "", options = {}) => {
  const maxItems = Math.max(1, Math.floor(Number(options.maxItems ?? options.defaultMaxItems ?? 36) || 36));
  const source = Array.isArray(items) ? items : [];

  return source.slice(0, maxItems).map((item, sourceIndex) => ({
    ...item,
    sceneId,
    sourceIndex: item.sourceIndex ?? sourceIndex,
  }));
};

export const markCanvasState = (canvas, state) => {
  const host = canvas?.closest?.("[data-cv-animation], .cv-preview, .cv-embedded-demo") || canvas?.parentElement;

  if (!host) {
    return;
  }

  host.classList.toggle("is-canvas-loading", state === "loading");
  host.classList.toggle("is-canvas-ready", state === "ready");
  host.classList.toggle("is-canvas-error", state === "error");
  canvas.dataset.canvasState = state;
};

export const drawCanvasLoadingState = (ctx, width, height, message = "loading") => {
  if (!ctx || !width || !height) {
    return;
  }

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(17, 17, 17, 0.035)";
  ctx.fillRect(0, 0, width, height);

  const size = Math.max(16, Math.min(width, height) * 0.07);
  const x = width * 0.5;
  const y = height * 0.5;

  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = "rgba(17, 17, 17, 0.34)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 1.52);
  ctx.stroke();

  ctx.fillStyle = "rgba(17, 17, 17, 0.5)";
  ctx.font = "600 11px Rubik, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, x, y + size + 18);
  ctx.restore();
};

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

export const getDevicePixelRatio = (maxDpr = getDefaultCanvasMaxDpr()) => {
  const source = globalThis.devicePixelRatio || globalThis.window?.devicePixelRatio || 1;
  return Math.max(1, Math.min(Number(source) || 1, Number(maxDpr) || 1));
};

export const resizeCanvasToDisplaySize = (canvas, ctx, dpr = getDevicePixelRatio()) => {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || 0));
  const cssHeight = Math.max(1, Math.round(canvas.clientHeight || 0));
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  const changed = canvas.width !== width || canvas.height !== height;

  if (changed) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return {
    changed,
    cssWidth,
    cssHeight,
    pixelWidth: width,
    pixelHeight: height,
    dpr,
  };
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

export const createCanvasAnimation = ({
  key,
  canvas,
  ctx,
  renderFrame,
  maxDpr,
  fps = 60,
  pauseOffscreen = true,
  onStateChange = noop,
}) => {
  disposeCanvasAnimation(key);

  let disposed = false;
  let frameId;
  let running = false;
  let inViewport = true;
  let reducedMotion = false;
  let lastFrameTime = 0;
  let lastRenderTime = 0;
  let resizeInfo = null;

  const doc = globalThis.document;
  const win = globalThis.window;
  const motionQuery = win?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const frameInterval = fps > 0 && fps < 60 ? 1000 / fps : 0;

  const emitState = (state) => {
    markCanvasState(canvas, state);
    onStateChange(state);
  };

  const resize = () => {
    resizeInfo = resizeCanvasToDisplaySize(canvas, ctx, getDevicePixelRatio(maxDpr));
    return resizeInfo;
  };

  const canRun = () => !disposed && !doc?.hidden && (!pauseOffscreen || inViewport);

  const frame = (time = 0) => {
    if (disposed || !running) {
      return;
    }

    if (!canRun()) {
      stop();
      return;
    }

    if (frameInterval && time - lastRenderTime < frameInterval) {
      frameId = globalThis.requestAnimationFrame(frame);
      return;
    }

    const previousFrameTime = lastFrameTime || time;
    const delta = Math.min(50, Math.max(0, time - previousFrameTime || 16.6667));
    lastFrameTime = time;
    lastRenderTime = time;

    resize();

    try {
      renderFrame({
        canvas,
        ctx,
        time,
        delta,
        dt: delta,
        elapsed: time,
        width: canvas.clientWidth || resizeInfo?.cssWidth || 0,
        height: canvas.clientHeight || resizeInfo?.cssHeight || 0,
        dpr: resizeInfo?.dpr || getDevicePixelRatio(maxDpr),
        reducedMotion,
        inViewport,
      });
    } catch (error) {
      console.error(`[canvas-animation] render failed for ${key}`, error);
      emitState("error");
      stop();
      return;
    }

    frameId = globalThis.requestAnimationFrame(frame);
  };

  const start = () => {
    if (disposed || running || typeof globalThis.requestAnimationFrame !== "function" || !canRun()) {
      return;
    }

    running = true;
    lastFrameTime = 0;
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

  const intersectionObserver =
    pauseOffscreen && globalThis.IntersectionObserver
      ? new globalThis.IntersectionObserver(
          (entries) => {
            const entry = entries[0];

            inViewport = Boolean(entry?.isIntersecting);

            if (inViewport) {
              resize();
              start();
            } else {
              stop();
            }
          },
          {
            root: null,
            rootMargin: "280px 0px",
            threshold: 0,
          },
        )
      : null;

  handleMotionChange();
  resize();
  resizeObserver?.observe(canvas);
  intersectionObserver?.observe(canvas);
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
    intersectionObserver?.disconnect();
    win?.removeEventListener?.("resize", resize);
    doc?.removeEventListener?.("visibilitychange", handleVisibilityChange);
    markCanvasState(canvas, "");

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

export const createMediaLoader = (
  sourceItems,
  {
    maxItems = 36,
    initialCount = 12,
    batchSize = 6,
    onItemLoad = noop,
    onLoadingChange = noop,
    sceneId = "",
  } = {},
) => {
  let cancelled = false;
  let loadedCount = 0;
  let completedCount = 0;

  const items = limitAnimationItems(sourceItems, sceneId, { maxItems }).map((item, sourceIndex) => ({
    ...item,
    sourceIndex: item.sourceIndex ?? sourceIndex,
    imageElement: null,
    mediaElement: null,
    imageLoadError: null,
  }));

  const notify = () => {
    const hasLoaded = loadedCount > 0;
    const isComplete = completedCount >= items.length;

    onLoadingChange({
      loadedCount,
      completedCount,
      totalCount: items.length,
      isLoading: !isComplete && !hasLoaded,
      isComplete,
      hasLoaded,
    });
  };

  const loadOne = async (index) => {
    if (cancelled) return;

    const item = items[index];
    const mediaUrl = item?.mediaUrl || item?.imageUrl;

    if (!item || !mediaUrl) {
      completedCount += 1;
      notify();
      return;
    }

    try {
      const mediaElement = await loadMedia(mediaUrl);

      if (cancelled) return;

      item.imageElement = mediaElement;
      item.mediaElement = mediaElement;
      item.imageLoadError = null;
      loadedCount += 1;
    } catch (error) {
      if (cancelled) return;

      item.imageLoadError = error;
    } finally {
      if (!cancelled) {
        completedCount += 1;
        onItemLoad({ item, index, loadedCount, completedCount, totalCount: items.length });
        notify();
      }
    }
  };

  const start = () => {
    const firstEnd = Math.min(Math.max(1, initialCount), items.length);

    for (let i = 0; i < firstEnd; i += 1) {
      void loadOne(i);
    }

    if (items.length > firstEnd) {
      void (async () => {
        for (let i = firstEnd; i < items.length && !cancelled; i += batchSize) {
          const end = Math.min(i + Math.max(1, batchSize), items.length);
          await Promise.all(Array.from({ length: end - i }, (_, j) => loadOne(i + j)));
          await new Promise((resolve) => globalThis.setTimeout?.(resolve, 48) ?? resolve());
        }
      })();
    }

    notify();
  };

  const cancel = () => {
    cancelled = true;
    items.forEach((item) => {
      const media = item.mediaElement || item.imageElement;

      if (media?.tagName === "VIDEO") {
        media.pause?.();
        media.removeAttribute?.("src");
        media.load?.();
      }
    });
  };

  start();

  return {
    items,
    cancel,
    get loadedCount() {
      return loadedCount;
    },
    get completedCount() {
      return completedCount;
    },
  };
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
