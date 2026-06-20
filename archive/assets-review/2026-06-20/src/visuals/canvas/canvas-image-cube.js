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

const drawFace = (ctx, image, points) => {
  const [a, b, c, d] = points;
  const minX = Math.min(a.x, b.x, c.x, d.x);
  const minY = Math.min(a.y, b.y, c.y, d.y);
  const maxX = Math.max(a.x, b.x, c.x, d.x);
  const maxY = Math.max(a.y, b.y, c.y, d.y);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.clip();
  fitCover(ctx, image, minX, minY, maxX - minX, maxY - minY);
  ctx.restore();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.stroke();
};

export const mountImageCube = async (canvasId, options = {}) => {
  const canvas = globalThis.document?.getElementById?.(canvasId);
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const config = readOptions(canvas, options);
  const images = await loadImages(getScene(config.scene), Math.max(6, config.maxItems));
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
      const size = Math.min(width, height) * 0.34;
      const depth = size * 0.38;
      const step = Math.floor(frame / Math.max(1, Math.round(90 / config.speed)));
      const front = images[step % images.length];
      const side = images[(step + 1) % images.length];
      const top = images[(step + 2) % images.length];
      const t = (frame % 90) / 90;
      const skew = (t - 0.5) * depth * 0.32;

      const frontFace = [
        { x: cx - size / 2 + skew, y: cy - size / 2 },
        { x: cx + size / 2 + skew, y: cy - size / 2 },
        { x: cx + size / 2 + skew, y: cy + size / 2 },
        { x: cx - size / 2 + skew, y: cy + size / 2 },
      ];
      const sideFace = [
        frontFace[1],
        { x: frontFace[1].x + depth, y: frontFace[1].y - depth * 0.55 },
        { x: frontFace[2].x + depth, y: frontFace[2].y - depth * 0.55 },
        frontFace[2],
      ];
      const topFace = [
        { x: frontFace[0].x + depth, y: frontFace[0].y - depth * 0.55 },
        { x: frontFace[1].x + depth, y: frontFace[1].y - depth * 0.55 },
        frontFace[1],
        frontFace[0],
      ];

      drawFace(ctx, top, topFace);
      drawFace(ctx, side, sideFace);
      drawFace(ctx, front, frontFace);
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
