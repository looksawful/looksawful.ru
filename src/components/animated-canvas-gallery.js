/* Shared canvas runtime for Moves Awful and reusable production masonry mockups.
 * Sources stay in HTML; this file owns only rendering and interaction. */

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

(() => {
  "use strict";

  const gallery = document.querySelector('[data-animated-canvas-gallery][data-gallery-profile="moves"]');
  const canvas = gallery?.querySelector("canvas");
  const scope = gallery?.closest(".project") || document;
  const tabs = [...scope.querySelectorAll("[data-canvas-gallery-tab]")];
  const overlayTitle = scope.querySelector("[data-canvas-gallery-title]");
  const stage = gallery?.closest(".moves-awful-stage");
  const stageScale = stage?.querySelector(".moves-awful-stage__scale");
  const TAB_AUTOPLAY_MS = 5000;
  const VIEWPORT_MARGIN = "50% 0px";

  if (!(gallery instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const aspectRatios = {
    arc: "1280 / 860",
    spiral: "1",
    horizontal: "1280 / 670",
    diagonal: "1280 / 700",
    "showcase-diagonal": "1280 / 700",
    masonry: "1280 / 660",
  };

  const titles = {
    arc: "Arc",
    spiral: "Spiral",
    horizontal: "Horizontal",
    diagonal: "Diagonal",
    "showcase-diagonal": "Showcase",
    masonry: "Masonry",
  };

  const settings = {
    arc: {
      slots: 10,
      speed: 0.00005,
      radiusScale: 0.7,
      cardBaseScale: 0.17,
      cardMinScale: 0.25,
      cardMaxBonus: 1.3,
      cardFocusPower: 1.5,
      cardRadiusScale: 0.1,
    },
    spiral: {
      speed: 0.00004,
      turns: 1.5,
      cardScale: 0.25,
      cardGrowthScale: 1.5,
      radiusScale: 0.4,
      alphaScale: 2,
      cardRadiusScale: 0.1,
      direction: -1,
    },
    horizontal: {
      rows: 4,
      gap: 8,
      speed: 0.04,
      angle: 0,
      radius: 8,
      minRatio: 0.55,
      maxRatio: 2.4,
      overscan: 0,
    },
    diagonal: {
      rows: 6,
      gap: 8,
      speed: 0.035,
      angle: -15,
      radius: 8,
      minRatio: 0.55,
      maxRatio: 2.4,
      overscan: 120,
    },
    "showcase-diagonal": {
      rows: 5,
      gap: 8,
      speed: 0.026,
      angle: 18,
      radius: 8,
      minRatio: 0.55,
      maxRatio: 2.4,
      overscan: 160,
    },
    masonry: {
      columnCount: "auto",
      preferredColumnWidth: 165,
      minColumnWidth: 96,
      maxColumnWidth: 260,
      maxColumnCount: 9,
      gap: 8,
      radius: 8,
      speed: 0.032,
      direction: "up",
      minTileHeight: 72,
      maxTileHeight: 560,
      minLandscapeScale: 0.54,
      maxLandscapeScale: 0.82,
      minPortraitScale: 1.1,
      maxPortraitScale: 2.2,
      squareScale: 1,
    },
  };

  const state = {
    variant: "arc",
    images: [],
    raf: 0,
    startedAt: 0,
    disposed: false,
    nearViewport: typeof IntersectionObserver !== "function",
    width: 1,
    height: 1,
    masonryLanes: null,
    layoutKey: "",
  };

  let tabAutoplayTimer = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

  function readItems() {
    const payload = gallery.querySelector(
      ":scope > script[type='application/json'][data-gallery-items]",
    );

    try {
      return JSON.parse(payload?.textContent || "[]").filter((item) => item?.src);
    } catch {
      return [];
    }
  }

  function loadImage(item, index) {
    return new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve({ ...item, sourceIndex: index, image });
      image.onerror = () => resolve(null);
      image.src = item.src;
    });
  }

  async function loadItems() {
    gallery.dataset.galleryState = "loading";

    const loaded = (await Promise.all(readItems().map(loadImage))).filter(Boolean);

    if (!loaded.length) {
      throw new Error("Canvas media failed to load.");
    }

    state.images = loaded;
    state.startedAt = performance.now();
    gallery.dataset.galleryState = "ready";
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(Math.max(0, radius), width * 0.5, height * 0.5);

    ctx.beginPath();

    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, r);
      return;
    }

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCover(image, x, y, width, height, radius = 0) {
    if (!image?.naturalWidth || !image?.naturalHeight || width <= 0 || height <= 0) {
      return;
    }

    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = width / height;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (sourceRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (image.naturalWidth - sw) * 0.5;
    } else {
      sh = sw / targetRatio;
      sy = (image.naturalHeight - sh) * 0.5;
    }

    ctx.save();
    roundedRect(x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
    ctx.restore();
  }

  function syncStageScale(width = stage?.clientWidth || 0) {
    if (!(stage instanceof HTMLElement) || !(stageScale instanceof HTMLElement) || width <= 0) {
      return;
    }

    stage.style.setProperty("--moves-awful-stage-scale", String(width / 1280));
  }

  function syncCanvasSize(width, height) {
    state.width = Math.max(1, width || 1);
    state.height = Math.max(1, height || 1);

    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.max(1, Math.round(state.width * dpr));
    const pixelHeight = Math.max(1, Math.round(state.height * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      state.layoutKey = "";
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function animationTime(now = performance.now()) {
    if (!state.startedAt) return 0;
    return Math.max(0, now - state.startedAt) * 0.65;
  }

  function renderArc(t, width, height) {
    const o = settings.arc;
    const slots = Math.max(1, Math.round(o.slots));
    const minSide = Math.min(width, height);
    const centerX = width * 0.5;
    const centerY = height;
    const phase = t * o.speed;
    const arcRadius = minSide * o.radiusScale;
    const cardBaseSize = minSide * o.cardBaseScale;

    for (let index = 0; index < slots; index += 1) {
      const raw = index / slots + phase;
      const normalized = mod(raw, 1);
      const angle = normalized * Math.PI * 2;
      const item = state.images[mod(index + Math.floor(raw), state.images.length)];
      const x = centerX + Math.cos(angle) * arcRadius;
      const y = centerY + Math.sin(angle) * arcRadius;
      const topZone = Math.max(0, Math.cos(angle - Math.PI * 1.5));
      const focus = Math.pow(topZone, o.cardFocusPower);
      const size = cardBaseSize * (o.cardMinScale + focus * o.cardMaxBonus);
      const edge = centerX ? Math.abs(x - centerX) / centerX : 0;
      const alpha = clamp(1 - (edge - 0.68) * 6, 0, 1);
      const rotation = angle + Math.PI / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      drawCover(item.image, -size * 0.5, -size * 0.5, size, size, size * o.cardRadiusScale);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }

  function renderSpiral(t, width, height) {
    const o = settings.spiral;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const minSide = Math.min(width, height);
    const maxSide = Math.max(width, height);
    const phase = t * o.speed;

    state.images.forEach((item, index) => {
      const p = mod(index / state.images.length + phase, 1);
      const angle = o.direction * p * Math.PI * 2 * o.turns + Math.PI / 2;
      const size = Math.max(1, minSide * o.cardScale * p * o.cardGrowthScale);
      const radius = size + p * maxSide * o.radiusScale;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.save();
      ctx.globalAlpha = Math.min(1, p * o.alphaScale);
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      drawCover(item.image, -size * 0.5, -size * 0.5, size, size, size * o.cardRadiusScale);
      ctx.restore();
    });

    ctx.globalAlpha = 1;
  }

  function planeSize(width, height, angle, overscan) {
    if (!angle) return { width, height };

    return {
      width: Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle)) + overscan * 2,
      height: Math.abs(height * Math.cos(angle)) + Math.abs(width * Math.sin(angle)) + overscan * 2,
    };
  }

  function renderRows(variant, t, width, height) {
    const o = settings[variant];
    const rows = Math.max(1, Math.round(o.rows));
    const angle = (o.angle * Math.PI) / 180;
    const plane = planeSize(width, height, angle, o.overscan);
    const rowHeight = Math.max(1, (plane.height - o.gap * (rows - 1)) / rows);
    const cursorMult = variant === "horizontal" ? 5 : variant === "diagonal" ? 7 : 9;
    const offsetMult = variant === "horizontal" ? 137 : variant === "diagonal" ? 173 : 191;

    ctx.save();

    if (angle) {
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(angle);
      ctx.translate(-plane.width * 0.5, -plane.height * 0.5);
    }

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const tiles = [];
      let length = 0;
      let cursor = rowIndex * cursorMult;
      const required = plane.width * 1.35;

      while (length < required || tiles.length < state.images.length) {
        const item = state.images[cursor % state.images.length];
        const ratio = clamp(
          item.image.naturalWidth / item.image.naturalHeight,
          o.minRatio,
          o.maxRatio,
        );
        const tileWidth = rowHeight * ratio;
        tiles.push({ item, width: tileWidth });
        length += tileWidth + o.gap;
        cursor += 1;
      }

      const cycle = Math.max(1, length);
      const speed = o.speed * (0.82 + (rowIndex % 4) * 0.11);
      const direction = rowIndex % 2 ? 1 : -1;
      const offset = rowIndex * offsetMult + t * speed;
      const normalized = mod(offset, cycle);
      let start = direction < 0 ? -normalized : normalized - cycle;

      while (start > -cycle) start -= cycle;

      for (let cycleStart = start; cycleStart < plane.width + cycle; cycleStart += cycle) {
        let x = cycleStart;

        for (const tile of tiles) {
          if (x < plane.width && x + tile.width > 0) {
            const y = rowIndex * (rowHeight + o.gap);

            drawCover(tile.item.image, x, y, tile.width, rowHeight, o.radius);
          }

          x += tile.width + o.gap;
        }
      }
    }

    ctx.restore();
  }

  function buildMasonry(width, height) {
    const o = settings.masonry;
    const gap = o.gap;
    let count;

    if (o.columnCount && o.columnCount !== "auto") {
      count = clamp(
        Math.floor(Number(o.columnCount) || 1),
        1,
        Math.min(o.maxColumnCount, state.images.length),
      );
    } else {
      const preferred = clamp(o.preferredColumnWidth, o.minColumnWidth, o.maxColumnWidth);

      count = clamp(
        Math.floor((width + gap) / (preferred + gap)) || 1,
        1,
        Math.min(o.maxColumnCount, state.images.length),
      );
    }

    const weights = [0.82, 1.02, 0.9, 1.22, 0.84, 1.08, 0.94, 1.16, 0.88].slice(0, count);
    const sum = weights.reduce((a, b) => a + b, 0);
    const available = Math.max(1, width - gap * (count - 1));
    let x = 0;

    const lanes = weights.map((weight, index) => {
      const laneWidth = available * (weight / sum);
      const lane = {
        index,
        x,
        width: laneWidth,
        tiles: [],
        speed: o.speed * (0.86 + (index % 5) * 0.08),
      };

      x += laneWidth + gap;
      return lane;
    });

    const heights = lanes.map(() => 0);

    function tileHeight(item, laneWidth) {
      const ratio = item.image.naturalWidth / item.image.naturalHeight;
      let scale = o.squareScale;

      if (ratio > 1.08) {
        scale = clamp(1 / ratio, o.minLandscapeScale, o.maxLandscapeScale);
      } else if (ratio < 0.92) {
        scale = clamp(1 / ratio, o.minPortraitScale, o.maxPortraitScale);
      }

      return clamp(laneWidth * scale, o.minTileHeight, o.maxTileHeight);
    }

    state.images.forEach((item) => {
      let laneIndex = 0;

      for (let index = 1; index < lanes.length; index += 1) {
        if (heights[index] < heights[laneIndex]) {
          laneIndex = index;
        }
      }

      const lane = lanes[laneIndex];
      const height = tileHeight(item, lane.width);

      lane.tiles.push({
        item,
        height,
        y: heights[laneIndex],
      });

      heights[laneIndex] += height + gap;
    });

    lanes.forEach((lane) => {
      let cursor = lane.index * 11 + lane.tiles.length;

      while ((lane.tiles.at(-1)?.y || 0) + (lane.tiles.at(-1)?.height || 0) < height * 2.4) {
        const item = state.images[cursor % state.images.length];
        const tileHeightValue = tileHeight(item, lane.width);
        const last = lane.tiles.at(-1);

        lane.tiles.push({
          item,
          height: tileHeightValue,
          y: last ? last.y + last.height + gap : 0,
        });

        cursor += 1;
      }

      const last = lane.tiles.at(-1);

      lane.cycle = Math.max(height, (last?.y || 0) + (last?.height || 0) + gap);
    });

    return lanes;
  }

  function renderMasonry(t, width, height) {
    const o = settings.masonry;
    const key = [Math.round(width), Math.round(height), state.images.length].join(":");

    if (state.layoutKey !== key) {
      state.masonryLanes = buildMasonry(width, height);
      state.layoutKey = key;
    }

    const direction = o.direction === "down" ? -1 : 1;

    for (const lane of state.masonryLanes) {
      const move = mod(t * lane.speed * direction, lane.cycle);

      for (const tile of lane.tiles) {
        let y = tile.y - move;

        while (y + tile.height < 0) {
          y += lane.cycle;
        }

        while (y > height) {
          y -= lane.cycle;
        }

        if (y < height && y + tile.height > 0) {
          drawCover(tile.item.image, lane.x, y, lane.width, tile.height, o.radius);
        }
      }
    }
  }

  function drawFrame(now = performance.now()) {
    const { width, height } = state;

    ctx.clearRect(0, 0, width, height);

    if (!state.images.length) return;

    const t = animationTime(now);

    if (state.variant === "arc") {
      renderArc(t, width, height);
    } else if (state.variant === "spiral") {
      renderSpiral(t, width, height);
    } else if (state.variant === "masonry") {
      renderMasonry(t, width, height);
    } else {
      renderRows(state.variant, t, width, height);
    }
  }

  const canAnimate = () =>
    !state.disposed &&
    state.images.length > 0 &&
    state.nearViewport &&
    !document.hidden &&
    !reduceMotion.matches;

  function frame(now) {
    if (!canAnimate()) {
      state.raf = 0;
      return;
    }

    drawFrame(now);
    state.raf = requestAnimationFrame(frame);
  }

  function clearTabAutoplay() {
    if (tabAutoplayTimer !== null) {
      clearTimeout(tabAutoplayTimer);
      tabAutoplayTimer = null;
    }
  }

  function scheduleTabAutoplay() {
    clearTabAutoplay();
    if (!canAnimate() || !tabs.length) return;

    tabAutoplayTimer = setTimeout(() => {
      const currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
      const next = (Math.max(0, currentIndex) + 1) % tabs.length;
      setVariant(tabs[next].dataset.variant, next);
      scheduleTabAutoplay();
    }, TAB_AUTOPLAY_MS);
  }

  function syncActivity() {
    if (!canAnimate()) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }

      clearTabAutoplay();

      if (state.images.length) {
        drawFrame();
      }

      return;
    }

    if (!state.raf) {
      state.raf = requestAnimationFrame(frame);
    }

    if (tabAutoplayTimer === null) {
      scheduleTabAutoplay();
    }
  }

  function setVariant(variant, index) {
    state.variant = variant;
    state.layoutKey = "";
    gallery.dataset.galleryVariant = variant;
    gallery.style.setProperty(
      "--animated-canvas-gallery-aspect-ratio",
      aspectRatios[variant] || "16 / 9",
    );

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    if (overlayTitle) {
      overlayTitle.textContent = titles[variant] || variant;
    }

    if (state.images.length && !state.raf) {
      drawFrame();
    }
  }

  function handleVisibilityChange() {
    syncActivity();
  }

  function handleMotionChange() {
    syncActivity();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      setVariant(tab.dataset.variant, index);
      scheduleTabAutoplay();
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + step + tabs.length) % tabs.length;

      setVariant(tabs[next].dataset.variant, next);
      tabs[next].focus();
      scheduleTabAutoplay();
    });
  });

  const viewportObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            state.nearViewport = Boolean(entry?.isIntersecting);
            syncActivity();
          },
          {
            rootMargin: VIEWPORT_MARGIN,
            threshold: 0,
          },
        )
      : null;

  viewportObserver?.observe(gallery);

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === canvas) {
              syncCanvasSize(entry.contentRect.width, entry.contentRect.height);
            } else if (entry.target === stage) {
              syncStageScale(entry.contentRect.width);
            }
          }

          if (state.images.length) {
            drawFrame();
          }
        })
      : null;

  resizeObserver?.observe(canvas);
  if (stage instanceof HTMLElement) resizeObserver?.observe(stage);

  syncCanvasSize(canvas.clientWidth, canvas.clientHeight);
  syncStageScale();
  setVariant("arc", 0);

  document.addEventListener("visibilitychange", handleVisibilityChange);
  reduceMotion.addEventListener?.("change", handleMotionChange);

  loadItems()
    .then(() => {
      drawFrame();
      syncActivity();
    })
    .catch((error) => {
      console.error(error);
      gallery.dataset.galleryState = "error";
    });

  window.addEventListener(
    "beforeunload",
    () => {
      state.disposed = true;

      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }

      clearTabAutoplay();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reduceMotion.removeEventListener?.("change", handleMotionChange);
      viewportObserver?.disconnect();
      resizeObserver?.disconnect();
    },
    { once: true },
  );
})();
function initProductionMasonry(root) {
  if (!(root instanceof HTMLElement)) return;

  const canvas = root.querySelector(":scope > canvas");
  const fallback = root.querySelector(":scope > [data-gallery-fallback]");
  if (!(canvas instanceof HTMLCanvasElement) || !(fallback instanceof HTMLElement)) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    root.dataset.galleryState = "error";
    return;
  }

  const MASONRY_DEFAULTS = Object.freeze({
    columnCount: "auto",
    preferredColumnWidth: 165,
    minColumnWidth: 96,
    maxColumnWidth: 260,
    maxColumnCount: 9,
    columnWeights: null,
    gap: 8,
    columnGap: null,
    rowGap: null,
    radius: 8,
    padding: 0,
    speed: 0.032,
    columnSpeeds: [0.028, 0.034, 0.03, 0.037, 0.026, 0.033, 0.029, 0.036, 0.031],
    direction: "up",
    fade: {
      enabled: true,
      size: 0.14,
      sizes: {},
      sides: { top: true, bottom: true },
    },
    preload: 260,
    minCycleRatio: 2.15,
    maxClonePasses: 24,
    minTileHeight: 72,
    maxTileHeight: 560,
    minLandscapeScale: 0.54,
    maxLandscapeScale: 0.82,
    minPortraitScale: 1.1,
    maxPortraitScale: 2.2,
    squareScale: 1,
    maxDpr: 2,
    pauseOnReducedMotion: true,
  });

  const options = MASONRY_DEFAULTS;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const sourceNodes = Array.from(fallback.querySelectorAll("img[data-masonry-source]"));
  if (!sourceNodes.length) {
    root.dataset.galleryState = "empty";
    return;
  }

  const loadImage = async (sourceNode, sourceIndex) => {
    const primary = sourceNode.getAttribute("src") || "";
    const secondary = sourceNode.dataset.fallbackSrc || "";

    // Prefer the project host used by the rest of the page. The historical
    // raw GitHub URL remains as a fallback.
    const candidates = [...new Set([secondary, primary].filter(Boolean))];

    for (const src of candidates) {
      const loaded = await new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        let settled = false;

        const finish = (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(value);
        };

        // A single stalled historical asset must never keep the whole canvas
        // in data-gallery-state="loading" forever.
        const timeoutId = setTimeout(() => finish(null), 4500);

        image.onload = async () => {
          try {
            await image.decode?.();
          } catch {
            // decode() may reject for an image that is still drawable.
          }

          if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
            finish(image);
            return;
          }

          finish(null);
        };

        image.onerror = () => finish(null);
        image.src = src;
      });

      if (loaded) {
        return {
          sourceIndex,
          src: loaded.currentSrc || loaded.src,
          image: loaded,
        };
      }
    }

    return null;
  };

  const roundedRect = (x, y, width, height, radius) => {
    const r = Math.min(Math.max(0, radius), width * 0.5, height * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawCover = (image, x, y, width, height, radius) => {
    if (!image?.naturalWidth || !image?.naturalHeight || width <= 0 || height <= 0) return;

    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = width / height;

    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceRatio > targetRatio) {
      sourceWidth = sourceHeight * targetRatio;
      sourceX = (image.naturalWidth - sourceWidth) * 0.5;
    } else {
      sourceHeight = sourceWidth / targetRatio;
      sourceY = (image.naturalHeight - sourceHeight) * 0.5;
    }

    ctx.save();
    roundedRect(x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    ctx.restore();
  };

  const normalizePadding = (value) => {
    if (Number.isFinite(value)) {
      const size = Math.max(0, value);
      return { top: size, right: size, bottom: size, left: size };
    }
    return {
      top: Math.max(0, Number(value?.top) || 0),
      right: Math.max(0, Number(value?.right) || 0),
      bottom: Math.max(0, Number(value?.bottom) || 0),
      left: Math.max(0, Number(value?.left) || 0),
    };
  };

  const getLaneCount = ({ width, itemCount, padding }) => {
    if (!itemCount) return 0;

    if (Number.isFinite(options.columnCount)) {
      return clamp(Math.floor(options.columnCount), 1, Math.min(options.maxColumnCount, itemCount));
    }

    const columnGap = options.columnGap ?? options.gap;
    const innerWidth = Math.max(1, width - padding.left - padding.right);
    const preferred = clamp(
      options.preferredColumnWidth,
      options.minColumnWidth,
      options.maxColumnWidth,
    );
    const count = Math.floor((innerWidth + columnGap) / (preferred + columnGap));

    return clamp(count || 1, 1, Math.min(options.maxColumnCount, itemCount));
  };

  const defaultWeights = [0.82, 1.02, 0.9, 1.22, 0.84, 1.08, 0.94, 1.16, 0.88];

  const buildLanes = ({ width, count, padding }) => {
    const columnGap = options.columnGap ?? options.gap;
    const innerWidth = Math.max(1, width - padding.left - padding.right);
    const available = Math.max(1, innerWidth - columnGap * Math.max(0, count - 1));

    const rawWeights = Array.from({ length: count }, (_, index) =>
      Math.max(
        0.1,
        Number(options.columnWeights?.[index]) || defaultWeights[index % defaultWeights.length],
      ),
    );

    const sum = rawWeights.reduce((total, weight) => total + weight, 0);
    let x = padding.left;

    return rawWeights.map((weight, index) => {
      const laneWidth = available * (weight / sum);
      const lane = {
        index,
        x,
        width: laneWidth,
        tiles: [],
        speed: 0,
      };
      x += laneWidth + columnGap;
      return lane;
    });
  };

  const getTileHeight = ({ item, lane }) => {
    const ratio = item.image.naturalWidth / item.image.naturalHeight;
    let scale = options.squareScale;

    if (ratio > 1.08) {
      scale = clamp(1 / ratio, options.minLandscapeScale, options.maxLandscapeScale);
    } else if (ratio < 0.92) {
      scale = clamp(1 / ratio, options.minPortraitScale, options.maxPortraitScale);
    }

    return clamp(lane.width * scale, options.minTileHeight, options.maxTileHeight);
  };

  const makeTile = ({ item, lane, cloneIndex = 0 }) => ({
    item,
    itemIndex: item.sourceIndex,
    cloneIndex,
    width: lane.width,
    height: getTileHeight({ item, lane }),
    yCenter: 0,
  });

  const tileBottom = (tile) => tile.yCenter + tile.height * 0.5;
  const tileTop = (tile) => tile.yCenter - tile.height * 0.5;

  const assignOriginalItems = ({ lanes, items }) => {
    const rowGap = options.rowGap ?? options.gap;
    const heights = lanes.map(() => 0);

    items.forEach((item) => {
      let laneIndex = 0;

      for (let index = 1; index < lanes.length; index += 1) {
        if (heights[index] < heights[laneIndex]) laneIndex = index;
      }

      const lane = lanes[laneIndex];
      const tile = makeTile({ item, lane });
      lane.tiles.push(tile);
      heights[laneIndex] += tile.height + rowGap;
    });
  };

  const extendLane = ({ lane, items, requiredLength }) => {
    const rowGap = options.rowGap ?? options.gap;
    let length = lane.tiles.reduce((sum, tile) => sum + tile.height + rowGap, 0);
    let cloneIndex = 1;
    let cursor = lane.index * 11 + lane.tiles.length;

    while (
      length < requiredLength &&
      cloneIndex <= options.maxClonePasses * Math.max(1, items.length)
    ) {
      const item = items[cursor % items.length];
      const tile = makeTile({ item, lane, cloneIndex });
      lane.tiles.push(tile);
      length += tile.height + rowGap;
      cloneIndex += 1;
      cursor += 1;
    }
  };

  const positionLane = ({ lane, padding }) => {
    const rowGap = options.rowGap ?? options.gap;
    let top = padding.top - options.preload;

    lane.tiles.forEach((tile) => {
      tile.yCenter = top + tile.height * 0.5;
      top += tile.height + rowGap;
    });
  };

  const buildLayout = ({ width, height, items }) => {
    const padding = normalizePadding(options.padding);
    const innerHeight = Math.max(1, height - padding.top - padding.bottom);
    const laneCount = getLaneCount({
      width,
      itemCount: items.length,
      padding,
    });
    const lanes = buildLanes({
      width,
      count: laneCount,
      padding,
    });

    assignOriginalItems({ lanes, items });

    const requiredLength = innerHeight * options.minCycleRatio + options.preload * 2;

    lanes.forEach((lane, index) => {
      extendLane({
        lane,
        items,
        requiredLength,
      });
      lane.speed = options.columnSpeeds?.[index] ?? options.speed * (0.86 + (index % 5) * 0.08);
      positionLane({ lane, padding });
    });

    return {
      width,
      height,
      items,
      lanes,
      padding,
      directionSign: options.direction === "down" ? 1 : -1,
    };
  };

  const recycleLane = ({ lane, layout }) => {
    const rowGap = options.rowGap ?? options.gap;
    const minLimit = layout.padding.top - options.preload;
    const maxLimit = layout.height - layout.padding.bottom + options.preload;

    if (layout.directionSign < 0) {
      let safety = 0;
      while (safety < lane.tiles.length) {
        const tile = lane.tiles.find((entry) => tileBottom(entry) < minLimit);
        if (!tile) break;

        const others = lane.tiles.filter((entry) => entry !== tile);
        const maxBottom = others.length ? Math.max(...others.map(tileBottom)) : maxLimit;

        tile.yCenter = maxBottom + rowGap + tile.height * 0.5;
        safety += 1;
      }
      return;
    }

    let safety = 0;
    while (safety < lane.tiles.length) {
      const tile = lane.tiles.find((entry) => tileTop(entry) > maxLimit);
      if (!tile) break;

      const others = lane.tiles.filter((entry) => entry !== tile);
      const minTop = others.length ? Math.min(...others.map(tileTop)) : minLimit;

      tile.yCenter = minTop - rowGap - tile.height * 0.5;
      safety += 1;
    }
  };

  const updateLayout = ({ layout, dt, reducedMotion }) => {
    if (!layout) return;
    if (reducedMotion && options.pauseOnReducedMotion) return;

    layout.lanes.forEach((lane) => {
      lane.tiles.forEach((tile) => {
        tile.yCenter += lane.speed * layout.directionSign * dt;
      });
      recycleLane({ lane, layout });
    });
  };

  const drawLayout = ({ width, height, layout }) => {
    ctx.clearRect(0, 0, width, height);
    if (!layout) return;

    const visible = [];

    layout.lanes.forEach((lane) => {
      lane.tiles.forEach((tile, tileIndex) => {
        const y = tileTop(tile);
        if (y < height + options.preload && y + tile.height > -options.preload) {
          visible.push({
            lane,
            tile,
            tileIndex,
            x: lane.x,
            y,
          });
        }
      });
    });

    visible
      .sort((a, b) => a.y - b.y || a.lane.index - b.lane.index)
      .forEach(({ tile, x, y }) => {
        drawCover(tile.item.image, x, y, tile.width, tile.height, options.radius);
      });
  };

  const resolveFadeSize = (value, total, fallbackValue) => {
    const numeric = Number.isFinite(value) ? value : fallbackValue;
    return numeric <= 1 ? total * numeric : numeric;
  };

  const applyFade = ({ width, height }) => {
    if (!options.fade.enabled) return;

    const topSize = resolveFadeSize(options.fade.sizes.top, height, options.fade.size);
    const bottomSize = resolveFadeSize(options.fade.sizes.bottom, height, options.fade.size);

    const topStop = clamp(topSize / height, 0, 0.49);
    const bottomStop = clamp(bottomSize / height, 0, 0.49);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, options.fade.sides.top ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    gradient.addColorStop(topStop, "rgba(0,0,0,1)");
    gradient.addColorStop(1 - bottomStop, "rgba(0,0,0,1)");
    gradient.addColorStop(1, options.fade.sides.bottom ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");

    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  let items = [];
  let layout = null;
  let frameId = 0;
  let lastTime = 0;
  let width = Math.max(1, canvas.clientWidth || 1);
  let height = Math.max(1, canvas.clientHeight || 1);
  let documentHidden = document.hidden;
  let nearViewport = typeof IntersectionObserver !== "function";

  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");

  const syncCanvasSize = (nextWidth, nextHeight) => {
    const resolvedWidth = Math.max(1, nextWidth || 1);
    const resolvedHeight = Math.max(1, nextHeight || 1);
    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), options.maxDpr);
    const pixelWidth = Math.round(resolvedWidth * dpr);
    const pixelHeight = Math.round(resolvedHeight * dpr);

    const sizeChanged = resolvedWidth !== width || resolvedHeight !== height;
    width = resolvedWidth;
    height = resolvedHeight;

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sizeChanged) {
      layout = items.length ? buildLayout({ width, height, items }) : null;
    }
  };

  const render = (dt = 0) => {
    updateLayout({
      layout,
      dt,
      reducedMotion: motionQuery.matches,
    });
    drawLayout({ width, height, layout });
    applyFade({ width, height });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const shouldAnimate = () =>
    !documentHidden &&
    nearViewport &&
    !(motionQuery.matches && options.pauseOnReducedMotion);

  const frame = (time) => {
    if (!shouldAnimate()) {
      frameId = 0;
      lastTime = 0;
      render(0);
      return;
    }

    const dt = lastTime ? Math.min(50, time - lastTime) : 0;
    lastTime = time;

    render(dt);
    frameId = requestAnimationFrame(frame);
  };

  const sync = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    lastTime = 0;
    render(0);

    if (shouldAnimate()) {
      frameId = requestAnimationFrame(frame);
    }
  };

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            nearViewport = Boolean(entry?.isIntersecting);
            sync();
          },
          {
            rootMargin: "20% 0px 20%",
            threshold: 0.01,
          },
        )
      : null;

  observer?.observe(root);

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(([entry]) => {
          if (!entry) return;

          syncCanvasSize(entry.contentRect.width, entry.contentRect.height);
          sync();
        })
      : null;

  resizeObserver?.observe(canvas);

  const handleFallbackResize = () => {
    syncCanvasSize(canvas.clientWidth, canvas.clientHeight);
    sync();
  };

  if (!resizeObserver) {
    window.addEventListener("resize", handleFallbackResize, { passive: true });
  }

  document.addEventListener("visibilitychange", () => {
    documentHidden = document.hidden;
    sync();
  });

  window.addEventListener("pageshow", () => {
    syncCanvasSize(canvas.clientWidth, canvas.clientHeight);
    sync();
  });

  motionQuery.addEventListener?.("change", sync);

  syncCanvasSize(width, height);

  Promise.all(sourceNodes.map((node, index) => loadImage(node, index))).then((loaded) => {
    items = loaded.filter(
      (item) => item && item.image && item.image.naturalWidth > 0 && item.image.naturalHeight > 0,
    );

    if (!items.length) {
      root.dataset.galleryState = "error";
      return;
    }

    root.dataset.galleryState = "ready";
    layout = buildLayout({ width, height, items });
    sync();
  });

}

document
  .querySelectorAll('[data-animated-canvas-gallery][data-gallery-profile="production"]')
  .forEach(initProductionMasonry);
