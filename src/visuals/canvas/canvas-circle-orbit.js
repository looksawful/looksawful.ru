import { createAnimationItems, CV_ANIMATION_SCENES } from "./showcase-animation-assets.js";

const getScene = (sceneId) => {
  const scene = CV_ANIMATION_SCENES?.[sceneId];
  if (!scene) return [];
  const items = createAnimationItems(scene.modules || scene.items || scene);
  return items.map((item) => (typeof item === "string" ? { src: item } : item)).filter((item) => item && (item.src || item.url));
};

const getSrc = (item) => item?.src || item?.url || item?.href || item?.default || "";

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.decoding = "async";
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const loadImages = async (items, maxItems) => {
  const selected = items.slice(0, maxItems || items.length);
  const loaded = await Promise.allSettled(selected.map((item) => loadImage(getSrc(item))));
  return loaded.filter((result) => result.status === "fulfilled").map((result) => result.value);
};

const fitCover = (ctx, image, x, y, width, height) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
};

const roundedClip = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
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

const resizeCanvas = (canvas, ctx, maxDpr = 2) => {
  const dpr = Math.min(maxDpr, globalThis.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || 1));
  const height = Math.max(1, Math.round(canvas.clientHeight || canvas.parentElement?.clientHeight || 1));
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
};

const readOptions = (canvas, options = {}) => {
  const data = canvas.dataset || {};
  return {
    scene: options.scene || data.animationScene || data.cvAnimationScene,
    maxItems: Number(options.maxItems || data.animationMaxItems || data.cvAnimationMaxItems || 18),
    speed: Number(options.speedScale || data.animationSpeed || data.cvAnimationSpeed || 1) || 1,
    ratio: String(options.ratio || data.animationRatio || "16:9"),
    maxDpr: Number(options.maxDpr || data.animationDpr || data.cvAnimationDpr || 2) || 2,
  };
};

const parseRatio = (ratio) => {
  const [w, h] = String(ratio).split(":").map(Number);
  if (!w || !h) return 16 / 9;
  return w / h;
};

export const mountCircleOrbit = async (canvasId, options = {}) => {
  const canvas = globalThis.document?.getElementById?.(canvasId);
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const config = readOptions(canvas, options);
  const images = await loadImages(getScene(config.scene), config.maxItems);
  let frame = 0;
  let disposed = false;
  let raf = 0;

  const render = () => {
    if (disposed) return;
    const { width, height } = resizeCanvas(canvas, ctx, config.maxDpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    if (images.length) {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.32;
      const baseSize = Math.min(width, height) * 0.18;
      const rotation = frame * 0.004 * config.speed;
      const sorted = images.map((image, index) => {
        const angle = rotation + (index / images.length) * Math.PI * 2;
        const depth = (Math.sin(angle) + 1) / 2;
        return { image, angle, depth };
      }).sort((a, b) => a.depth - b.depth);

      for (const item of sorted) {
        const x = cx + Math.cos(item.angle) * radius;
        const y = cy + Math.sin(item.angle) * radius * 0.48;
        const scale = 0.68 + item.depth * 0.46;
        const size = baseSize * scale;
        ctx.save();
        roundedClip(ctx, x - size / 2, y - size / 2, size, size, 16);
        ctx.clip();
        fitCover(ctx, item.image, x - size / 2, y - size / 2, size, size);
        ctx.restore();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        roundedClip(ctx, x - size / 2, y - size / 2, size, size, 16);
        ctx.stroke();
      }
    }

    frame += 1;
    raf = requestAnimationFrame(render);
  };

  render();
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
  };
};
