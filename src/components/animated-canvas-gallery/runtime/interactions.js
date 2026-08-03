const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);
const lerp = (from, to, amount) => from + (to - from) * amount;

export const SCROLL_MODES = Object.freeze({
  SCROLL_DRIVEN: "scroll-driven",
  AUTOPLAY: "autoplay",
  SCROLL_SLOWDOWN: "scroll-slowdown",
  SEQUENTIAL: "sequential-focus",
  CENTER_SLOWDOWN: "center-slowdown",
});

export const INTERACTION_DEFAULTS = Object.freeze({
  hover: true,
  lightbox: true,
  hoverMaxScale: 1.06,
  hoverEase: 0.18,
  scrollMode: SCROLL_MODES.AUTOPLAY,
  scrollSensitivity: 4,
  scrollIdleMs: 140,
  scrollSlowFactor: 0.22,
  centerMinFactor: 0.2,
  sequentialRole: "active-slow",
  sequentialOrder: "forward",
  sequentialFocusedFactor: 0.22,
  sequentialBackgroundFactor: 1.18,
  sequentialFastFactor: 1.8,
  sequentialSlowFactor: 0.55,
  speedEase: 0.12,
});

const pointInPolygon = (point, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

const containsPoint = (region, point) => {
  if (region?.polygon) return pointInPolygon(point, region.polygon);
  return (
    point.x >= region.x &&
    point.x <= region.x + region.width &&
    point.y >= region.y &&
    point.y <= region.y + region.height
  );
};

const makeLightbox = (canvas) => {
  let shell = null;
  let image = null;
  let caption = null;
  let lastFocused = null;

  const signal = (open) => {
    canvas.dispatchEvent(new CustomEvent("animated-canvas-gallery:lightboxchange", {
      bubbles: true,
      detail: { open },
    }));
  };

  const close = () => {
    if (!shell) return;
    shell.remove();
    shell = null;
    image = null;
    caption = null;
    document.removeEventListener("keydown", onKeydown);
    lastFocused?.focus?.();
    lastFocused = null;
    signal(false);
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") close();
  };

  const open = (item) => {
    const src = item?.src || item?.imageUrl || item?.url || item?.image?.src;
    if (!src) return;
    close();
    lastFocused = document.activeElement;
    shell = document.createElement("div");
    shell.className = "animated-canvas-gallery-lightbox";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    shell.setAttribute("aria-label", item?.title ? `Preview: ${item.title}` : "Image preview");
    shell.innerHTML = `
      <button class="animated-canvas-gallery-lightbox__close" type="button" aria-label="Close preview">×</button>
      <figure class="animated-canvas-gallery-lightbox__figure">
        <img class="animated-canvas-gallery-lightbox__image" alt="" />
        <figcaption class="animated-canvas-gallery-lightbox__caption"></figcaption>
      </figure>
    `;
    image = shell.querySelector(".animated-canvas-gallery-lightbox__image");
    caption = shell.querySelector(".animated-canvas-gallery-lightbox__caption");
    image.src = src;
    image.alt = item?.title || "";
    caption.textContent = item?.title || "";
    caption.hidden = !item?.title;
    shell.addEventListener("pointerdown", (event) => {
      if (event.target === shell || event.target.closest(".animated-canvas-gallery-lightbox__close")) close();
    });
    document.body.append(shell);
    shell.querySelector(".animated-canvas-gallery-lightbox__close")?.focus();
    document.addEventListener("keydown", onKeydown);
    signal(true);
  };

  return { open, close };
};

export function createCanvasInteractions({
  canvas,
  getOptions,
  laneAxis = null,
  requestRender = () => {},
}) {
  let disposed = false;
  let regions = [];
  let pointer = null;
  let hoveredKey = null;
  let hoverProgress = 0;
  let globalTime = 0;
  let laneTimes = [];
  let lastElapsed = null;
  let pendingScrollDelta = 0;
  let lastScrollY = window.scrollY;
  let lastScrollAt = -Infinity;
  let scrollDirection = 1;
  let currentGlobalFactor = null;
  let currentLaneFactors = [];
  const lightbox = makeLightbox(canvas);

  const interactionOptions = () => ({
    ...INTERACTION_DEFAULTS,
    ...(getOptions()?.interaction || {}),
  });

  const isCanvasInView = () => {
    const rect = canvas.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const getViewportProgress = () => {
    const rect = canvas.getBoundingClientRect();
    const distance = window.innerHeight + rect.height;
    if (distance <= 0) return 0;
    return clamp01((window.innerHeight - rect.top) / distance);
  };

  const getCenterFactor = (settings) => {
    const rect = canvas.getBoundingClientRect();
    const canvasCenter = rect.top + rect.height * 0.5;
    const viewportCenter = window.innerHeight * 0.5;
    const range = Math.max(1, (window.innerHeight + rect.height) * 0.5);
    const normalizedDistance = clamp01(Math.abs(canvasCenter - viewportCenter) / range);
    const eased = normalizedDistance * normalizedDistance * (3 - 2 * normalizedDistance);
    return lerp(settings.centerMinFactor, 1, eased);
  };

  const findRegion = (point) => {
    for (let index = regions.length - 1; index >= 0; index -= 1) {
      if (containsPoint(regions[index], point)) return regions[index];
    }
    return null;
  };

  const refreshHover = () => {
    const settings = interactionOptions();
    if (!settings.hover || !pointer) {
      hoveredKey = null;
      canvas.style.cursor = "";
      return;
    }
    const region = findRegion(pointer);
    hoveredKey = region?.key ?? null;
    canvas.style.cursor = region ? (settings.lightbox ? "zoom-in" : "pointer") : "";
  };

  const canvasPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * Math.max(1, canvas.clientWidth),
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * Math.max(1, canvas.clientHeight),
    };
  };

  const onPointerMove = (event) => {
    pointer = canvasPoint(event);
    refreshHover();
    requestRender();
  };

  const onPointerLeave = () => {
    pointer = null;
    hoveredKey = null;
    canvas.style.cursor = "";
    requestRender();
  };

  const onClick = (event) => {
    const settings = interactionOptions();
    if (!settings.lightbox) return;
    const region = findRegion(canvasPoint(event));
    if (region?.item) lightbox.open(region.item);
  };

  const onScroll = () => {
    const next = window.scrollY;
    const delta = next - lastScrollY;
    lastScrollY = next;
    if (!delta) return;
    pendingScrollDelta += delta;
    scrollDirection = Math.sign(delta) || scrollDirection;
    lastScrollAt = performance.now();
    requestRender();
  };

  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  canvas.addEventListener("click", onClick);
  window.addEventListener("scroll", onScroll, { passive: true });

  const calculateLaneTargets = (laneCount, settings) => {
    if (settings.scrollMode !== SCROLL_MODES.SEQUENTIAL || laneCount <= 0 || !isCanvasInView()) {
      return Array.from({ length: laneCount }, () => currentGlobalFactor);
    }

    let progress = getViewportProgress();
    if (settings.sequentialOrder === "reverse") progress = 1 - progress;
    const focus = progress * Math.max(0, laneCount - 1);

    return Array.from({ length: laneCount }, (_, index) => {
      const focusWeight = clamp01(1 - Math.abs(index - focus));
      if (settings.sequentialRole === "active-fast") {
        return lerp(settings.sequentialSlowFactor, settings.sequentialFastFactor, focusWeight);
      }
      return lerp(settings.sequentialBackgroundFactor, settings.sequentialFocusedFactor, focusWeight);
    });
  };

  const updateFactors = ({ elapsed, laneCount }) => {
    const settings = interactionOptions();
    const now = performance.now();
    const dt = lastElapsed == null ? 0 : Math.max(0, Math.min(64, elapsed - lastElapsed));
    lastElapsed = elapsed;
    const scrolling = now - lastScrollAt <= settings.scrollIdleMs;
    const inView = isCanvasInView();

    let targetGlobal = 1;
    if (settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN) targetGlobal = 0;
    if (settings.scrollMode === SCROLL_MODES.SCROLL_SLOWDOWN && scrolling && inView) {
      targetGlobal = settings.scrollSlowFactor;
    }
    if (settings.scrollMode === SCROLL_MODES.CENTER_SLOWDOWN) {
      targetGlobal = getCenterFactor(settings);
    }
    if (hoveredKey && settings.hover) targetGlobal = 0;

    const factorEase = 1 - Math.pow(1 - clamp01(settings.speedEase), Math.max(1, dt / 16.67));
    if (currentGlobalFactor == null) currentGlobalFactor = targetGlobal;
    else currentGlobalFactor = lerp(currentGlobalFactor, targetGlobal, factorEase);

    const laneTargets = calculateLaneTargets(laneCount, settings);
    while (currentLaneFactors.length < laneCount) currentLaneFactors.push(currentGlobalFactor);
    currentLaneFactors.length = laneCount;
    currentLaneFactors = currentLaneFactors.map((value, index) => {
      const hoverTarget = hoveredKey && settings.hover ? 0 : laneTargets[index];
      return lerp(value, hoverTarget, factorEase);
    });

    const hoverTarget = hoveredKey && settings.hover ? 1 : 0;
    const hoverEase = 1 - Math.pow(1 - clamp01(settings.hoverEase), Math.max(1, dt / 16.67));
    hoverProgress = lerp(hoverProgress, hoverTarget, hoverEase);

    let scrollTime = 0;
    if (settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN && inView && !(hoveredKey && settings.hover)) {
      scrollTime = pendingScrollDelta * settings.scrollSensitivity;
    }
    pendingScrollDelta = 0;

    return { dt, scrollTime, settings, scrolling, inView };
  };

  const advance = ({ elapsed, laneCount = 0 }) => {
    const { dt, scrollTime, settings } = updateFactors({ elapsed, laneCount });
    if (settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN) {
      globalTime += scrollTime;
    } else {
      globalTime += dt * currentGlobalFactor;
    }

    while (laneTimes.length < laneCount) laneTimes.push(0);
    laneTimes.length = laneCount;
    for (let index = 0; index < laneCount; index += 1) {
      if (settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN) {
        laneTimes[index] += scrollTime;
      } else if (settings.scrollMode === SCROLL_MODES.SEQUENTIAL) {
        laneTimes[index] += dt * currentLaneFactors[index];
      } else {
        laneTimes[index] += dt * currentGlobalFactor;
      }
    }

    return {
      globalTime,
      laneTimes: [...laneTimes],
      globalFactor: currentGlobalFactor,
      laneFactors: [...currentLaneFactors],
      scrollDirection,
    };
  };

  const advanceDelta = ({ dt, laneCount = 0 }) => {
    const syntheticElapsed = (lastElapsed ?? 0) + Math.max(0, dt);
    const result = advance({ elapsed: syntheticElapsed, laneCount });
    const settings = interactionOptions();
    const scrollDelta = settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN
      ? result.globalTime - (advanceDelta.previousGlobalTime ?? 0)
      : 0;
    advanceDelta.previousGlobalTime = result.globalTime;
    return {
      ...result,
      globalDt: settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN
        ? scrollDelta
        : dt * result.globalFactor,
      laneDts: result.laneFactors.map((factor) =>
        settings.scrollMode === SCROLL_MODES.SCROLL_DRIVEN ? scrollDelta : dt * factor,
      ),
    };
  };
  advanceDelta.previousGlobalTime = 0;

  return {
    setRegions(nextRegions) {
      regions = Array.isArray(nextRegions) ? nextRegions : [];
      refreshHover();
    },
    advance,
    advanceDelta,
    isHovered(region) {
      return Boolean(region && hoveredKey === region.key);
    },
    getCardScale(region, gap = 0) {
      if (!region || hoveredKey !== region.key) return 1;
      const settings = interactionOptions();
      const width = Math.max(1, region.width || 1);
      const height = Math.max(1, region.height || 1);
      const gapLimited = 1 + Math.max(0, gap) / Math.max(width, height);
      const maximum = Math.min(Math.max(1, settings.hoverMaxScale), gap > 0 ? gapLimited : settings.hoverMaxScale);
      return lerp(1, maximum, hoverProgress);
    },
    getState() {
      return {
        hoveredKey,
        hoverProgress,
        globalFactor: currentGlobalFactor,
        laneFactors: [...currentLaneFactors],
        scrollDirection,
        laneAxis,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      canvas.style.cursor = "";
      lightbox.close();
    },
  };
}
