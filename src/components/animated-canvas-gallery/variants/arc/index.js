import { createCanvasInteractions } from "../../runtime/interactions.js";

const activeInstances = new WeakMap();
const imageCache = new Map();

export const ARC_DEFAULTS = Object.freeze({
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
  cardRadiusScale: 0.1,
  maxDpr: 2,
  paused: false,
  pauseOnReducedMotion: true,
  interaction: {},
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

const resolveCanvas = (target) => {
  if (target?.getContext) return target;
  if (typeof target !== "string" || typeof document === "undefined") return null;
  return document.querySelector(target) || document.getElementById(target.replace(/^#/, ""));
};

const sourceOf = (item) =>
  typeof item === "string" ? item : item?.src || item?.imageUrl || item?.url || "";

const loadImage = (source, label) => {
  if (!source) return Promise.reject(new Error(`${label} item has no image source.`));
  if (imageCache.has(source)) return imageCache.get(source);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* loaded images remain drawable */ }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`${label} failed to load ${source}`));
    image.src = source;
  }).catch((error) => {
    imageCache.delete(source);
    throw error;
  });
  imageCache.set(source, promise);
  return promise;
};

const loadItems = async (items, label) => {
  const results = await Promise.allSettled(
    (Array.isArray(items) ? items : []).map(async (item, sourceIndex) => ({
      ...(typeof item === "object" ? item : {}),
      sourceIndex,
      src: sourceOf(item),
      title: typeof item === "object" ? item.title || "" : "",
      image: await loadImage(sourceOf(item), label),
    })),
  );
  return results.filter((result) => result.status === "fulfilled").map((result) => result.value);
};

const roundedRect = (ctx, x, y, width, height, radius) => {
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

const drawCover = (ctx, image, x, y, width, height, radius) => {
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
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
};

const mergeOptions = (current, next = {}) => ({
  ...current,
  ...next,
  interaction: {
    ...(current?.interaction || {}),
    ...(next?.interaction || {}),
  },
});

const createLoop = ({ canvas, ctx, getOptions, render, invalidate = () => {} }) => {
  let disposed = false;
  let frameId = null;
  let lastTime = 0;
  let elapsed = 0;
  let manuallyPaused = Boolean(getOptions().paused);
  let documentHidden = Boolean(document.hidden);
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const measure = () => ({
    width: Math.max(1, canvas.clientWidth || 1),
    height: Math.max(1, canvas.clientHeight || 1),
  });

  const redraw = () => {
    if (disposed) return;
    const { width, height } = measure();
    const dpr = Math.min(Math.max(1, devicePixelRatio || 1), Math.max(1, getOptions().maxDpr || 2));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      invalidate();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render({ elapsed, width, height, reducedMotion });
  };

  const shouldAnimate = () =>
    !disposed && !manuallyPaused && !documentHidden && !(reducedMotion && getOptions().pauseOnReducedMotion);

  const cancel = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastTime = 0;
  };

  const frame = (time) => {
    if (!shouldAnimate()) {
      cancel();
      redraw();
      return;
    }
    const dt = lastTime ? Math.min(64, time - lastTime) : 0;
    lastTime = time;
    elapsed += dt;
    const { width, height } = measure();
    render({ elapsed, width, height, reducedMotion });
    frameId = requestAnimationFrame(frame);
  };

  const sync = () => {
    cancel();
    redraw();
    if (shouldAnimate()) frameId = requestAnimationFrame(frame);
  };

  const handleVisibility = () => { documentHidden = document.hidden; sync(); };
  const handleMotion = () => { reducedMotion = motionQuery.matches; sync(); };
  const resizeObserver = new ResizeObserver(redraw);
  resizeObserver.observe(canvas);
  addEventListener("resize", redraw, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  motionQuery.addEventListener?.("change", handleMotion);
  sync();

  return {
    pause() { manuallyPaused = true; sync(); },
    play() { manuallyPaused = false; sync(); },
    redraw,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      resizeObserver.disconnect();
      removeEventListener("resize", redraw);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotion);
    },
    getState() { return { paused: manuallyPaused, reducedMotion, elapsed }; },
  };
};

const drawWrappedText = ({ ctx, text, x, y, maxWidth, lineHeight, maxLines }) => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible.at(-1);
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    visible[visible.length - 1] = `${last}…`;
  }
  visible.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight, maxWidth));
};

const readTitleStyle = (canvas) => {
  const style = getComputedStyle(canvas);
  return {
    family: style.getPropertyValue("--arc-title-font-family").trim() || '"Rubik Variable", system-ui, sans-serif',
    weight: style.getPropertyValue("--arc-title-font-weight").trim() || "500",
    color: style.getPropertyValue("--arc-title-color").trim() || "#fff",
  };
};

const rotatedPolygon = (centerX, centerY, width, height, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [-width / 2, -height / 2], [width / 2, -height / 2],
    [width / 2, height / 2], [-width / 2, height / 2],
  ].map(([x, y]) => ({ x: centerX + x * cos - y * sin, y: centerY + x * sin + y * cos }));
};

export async function mountArc(target, userOptions = {}) {
  const canvas = resolveCanvas(target);
  if (!canvas) throw new Error("mountArc: canvas not found.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mountArc: 2D context is unavailable.");
  activeInstances.get(canvas)?.dispose();

  let options = mergeOptions(ARC_DEFAULTS, userOptions);
  let items = await loadItems(options.items, "Arc");
  let titleStyle = readTitleStyle(canvas);
  let requestRender = () => {};
  const interaction = createCanvasInteractions({ canvas, getOptions: () => options, requestRender: () => requestRender() });

  const render = ({ elapsed, width, height, reducedMotion }) => {
    ctx.clearRect(0, 0, width, height);
    if (!items.length) { interaction.setRegions([]); return; }
    const motionState = interaction.advance({ elapsed, laneCount: 0 });
    const minSide = Math.min(width, height);
    const centerX = width * 0.5;
    const centerY = height;
    const phase = reducedMotion && options.pauseOnReducedMotion ? 0 : motionState.globalTime * options.speed;
    const arcRadius = minSide * options.radiusScale;
    const cardBaseSize = minSide * options.cardBaseScale;
    const slotCount = Math.max(1, Math.floor(options.slots));
    const regions = [];

    for (let index = 0; index < slotCount; index += 1) {
      const raw = index / slotCount + phase;
      const normalized = mod(raw, 1);
      const angle = normalized * Math.PI * 2;
      const itemIndex = mod(index + Math.floor(raw), items.length);
      const item = items[itemIndex] || items[index % items.length];
      const x = centerX + Math.cos(angle) * arcRadius;
      const y = centerY + Math.sin(angle) * arcRadius;
      const topZone = Math.max(0, Math.cos(angle - Math.PI * 1.5));
      const focus = Math.pow(topZone, options.cardFocusPower);
      const size = cardBaseSize * (options.cardMinScale + focus * options.cardMaxBonus);
      const edge = centerX ? Math.abs(x - centerX) / centerX : 0;
      const alpha = clamp01(1 - (edge - options.edgeFadeStart) * options.edgeFadePower);
      const rotation = angle + Math.PI / 2;
      const baseRegion = { key: `arc:${index}:${item.sourceIndex}`, item, width: size, height: size };
      const scale = interaction.getCardScale(baseRegion, 0);
      const drawSize = size * scale;
      const region = { ...baseRegion, width: drawSize, height: drawSize, polygon: rotatedPolygon(x, y, drawSize, drawSize, rotation) };
      regions.push(region);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      drawCover(ctx, item.image, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize, drawSize * options.cardRadiusScale);
      if (item.title) {
        const fontSize = Math.max(7, size * options.titleScale);
        ctx.font = `${titleStyle.weight} ${fontSize}px ${titleStyle.family}`;
        ctx.fillStyle = titleStyle.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        drawWrappedText({ ctx, text: item.title, x: 0, y: drawSize * options.titleOffsetY, maxWidth: drawSize * options.titleMaxWidth, lineHeight: fontSize * 1.12, maxLines: 2 });
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    interaction.setRegions(regions);
  };

  const loop = createLoop({ canvas, ctx, getOptions: () => options, render });
  requestRender = loop.redraw;
  const controller = {
    pause: loop.pause,
    play: loop.play,
    async update(nextOptions = {}) {
      options = mergeOptions(options, nextOptions);
      if (Object.hasOwn(nextOptions, "items")) items = await loadItems(nextOptions.items, "Arc");
      titleStyle = readTitleStyle(canvas);
      loop.redraw();
      return controller;
    },
    async setItems(nextItems) { return controller.update({ items: nextItems }); },
    dispose() {
      interaction.dispose();
      loop.dispose();
      if (activeInstances.get(canvas) === controller) activeInstances.delete(canvas);
    },
    getState() { return { ...loop.getState(), interaction: interaction.getState(), options: { ...options }, itemCount: items.length }; },
  };
  activeInstances.set(canvas, controller);
  return controller;
}
