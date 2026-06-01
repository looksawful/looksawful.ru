import {
  beginMount,
  completeMount,
  createAnimationKey,
  createCanvasAnimation,
  disposeCanvasAnimationsByPrefix,
  isCurrentMount,
  loadImage,
  noop,
  roundedRect,
} from "../../shared/canvas-animation.js";

const COMMUNITY_ORBIT_KEY_PREFIX = "community-orbit:";

const COMMUNITY_ORBIT_ASSET_MODULES = import.meta.glob(
  [
    "../../assets/cv/media/community-orbit/*.webp",
    "../../assets/cv/media/community-orbit/*.png",
    "../../assets/cv/media/community-orbit/*.jpg",
    "../../assets/cv/media/community-orbit/*.jpeg",
    "../../assets/cv/media/community-orbit/*.avif",
  ],
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const config = {
  count: 7,
  speed: 0.0000032,
  pauseOnReducedMotion: true,

  viewport: {
    margin: 28,
  },

  rows: [
    { y: -0.32, phase: 0, spread: 0.18 },
    { y: 0.28, phase: 0.5, spread: 0.2 },
  ],

  camera: {
    focalLength: 820,
    centerZ: 1180,
    orbitRadiusX: 0.44,
    orbitRadiusXMax: 520,
    orbitRadiusZ: 540,
    vanishingPointX: 0.5,
    vanishingPointY: 0.5,
  },

  card: {
    baseSize: 165,
    minSize: 54,
    minScale: 0.36,
    maxScale: 1.08,
    focusPower: 1.35,
    maxWidthRatio: 0.2,
    maxHeightRatio: 0.34,
    radiusRatio: 0.045,
    variance: 0.38,
  },

  float: {
    amplitude: 30,
    speed: 0.00007,
    secondaryRatio: 0.34,
    secondarySpeedRatio: 0.53,
  },

  fade: {
    nearAlpha: 1,
    farAlpha: 0.22,
    edgeFadeRange: 0.14,
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const getModuleUrl = (moduleValue) => {
  if (typeof moduleValue === "string") {
    return moduleValue;
  }

  return moduleValue?.default || "";
};

const getFilename = (path) => path.split("/").pop() || "";
const getStem = (filename) => filename.replace(/\.[^.]+$/, "");

const getAssetOrder = (path) => {
  const filename = getFilename(path);
  const stem = getStem(filename);
  const numberMatch = stem.match(/^\d+/);

  if (numberMatch) {
    return Number(numberMatch[0]);
  }

  return Number.MAX_SAFE_INTEGER;
};

const hashString = (value) => {
  let hash = 2166136261;
  const source = String(value || "");

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const getSeed = (value) => (hashString(value) % 1000) / 1000;

const getVerticalOffset = (index, seed) => {
  const offsets = [-0.82, 0.38, -0.18, 0.86, -0.46, 0.18, 0.64];

  if (index < offsets.length) {
    return offsets[index];
  }

  return seed * 2 - 1;
};

const createItemsFromAssetModules = (modules) => {
  const count = Math.max(0, Math.floor(Number(config.count) || 0));

  return Object.entries(modules)
    .map(([path, moduleValue]) => {
      const filename = getFilename(path);
      const stem = getStem(filename);
      const seed = getSeed(stem || filename);

      return {
        imageUrl: getModuleUrl(moduleValue),
        filename,
        stem,
        order: getAssetOrder(path),
        seed,
      };
    })
    .filter((item) => item.imageUrl)
    .sort((a, b) => a.order - b.order || a.filename.localeCompare(b.filename, "en", { numeric: true }))
    .slice(0, count)
    .map((item, index) => ({
      ...item,
      sourceIndex: index,
      rowIndex: index % config.rows.length,
      phase: index / Math.max(1, count),
      verticalOffset: getVerticalOffset(index, item.seed),
    }));
};

const communityOrbitItems = createItemsFromAssetModules(COMMUNITY_ORBIT_ASSET_MODULES);

const createDisposeHandle = (dispose = noop) => {
  const handle = () => dispose();
  handle.dispose = handle;
  return handle;
};

const loadImages = async (items) => {
  const loadedItems = await Promise.all(
    items.map(async (item) => {
      try {
        return {
          ...item,
          imageElement: await loadImage(item.imageUrl),
        };
      } catch {
        return null;
      }
    }),
  );

  return loadedItems.filter(Boolean);
};

const drawRoundedCover = (ctx, image, x, y, size, radius) => {
  if (!image || !size) {
    return;
  }

  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = 1;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sh = sourceHeight;
    sw = sh * targetRatio;
    sx = (sourceWidth - sw) * 0.5;
  } else {
    sw = sourceWidth;
    sh = sw / targetRatio;
    sy = (sourceHeight - sh) * 0.5;
  }

  const safeRadius = Math.min(radius, size * 0.5);

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, size, size, safeRadius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, x, y, size, size);
  ctx.restore();
};

const getEdgeAlpha = ({ x, y, size, width, height }) => {
  const rangeX = width * config.fade.edgeFadeRange;
  const rangeY = height * config.fade.edgeFadeRange;

  const left = smoothstep(-size, -size + rangeX, x);
  const right = 1 - smoothstep(width + size - rangeX, width + size, x);
  const top = smoothstep(-size, -size + rangeY, y);
  const bottom = 1 - smoothstep(height + size - rangeY, height + size, y);

  return clamp01(left * right * top * bottom);
};

const getCard = ({ item, time, width, height, reducedMotion }) => {
  const motionTime = reducedMotion && config.pauseOnReducedMotion ? 0 : time;
  const row = config.rows[item.rowIndex % config.rows.length];
  const phase = (motionTime * config.speed + item.phase + row.phase) % 1;
  const angle = phase * Math.PI * 2;

  const orbitRadiusX = Math.min(width * config.camera.orbitRadiusX, config.camera.orbitRadiusXMax);
  const worldX = Math.cos(angle) * orbitRadiusX;
  const worldZ = config.camera.centerZ + Math.sin(angle) * config.camera.orbitRadiusZ;

  const rowBaseY = row.y * height;
  const staticRowBreak = item.verticalOffset * row.spread * height;

  const floatingY =
    Math.sin(motionTime * config.float.speed + item.sourceIndex * 1.73 + item.rowIndex * 2.1) * config.float.amplitude;

  const secondaryFloatingY =
    Math.sin(motionTime * config.float.speed * config.float.secondarySpeedRatio + item.sourceIndex * 2.4) *
    config.float.amplitude *
    config.float.secondaryRatio;

  const worldY = rowBaseY + staticRowBreak + floatingY + secondaryFloatingY;

  const perspective = config.camera.focalLength / Math.max(120, worldZ);
  const minZ = config.camera.centerZ - config.camera.orbitRadiusZ;
  const maxZ = config.camera.centerZ + config.camera.orbitRadiusZ;
  const normalizedDepth = clamp01((worldZ - minZ) / Math.max(1, maxZ - minZ));
  const near = 1 - normalizedDepth;
  const focus = Math.pow(smoothstep(0, 1, near), config.card.focusPower);

  const perspectiveScale = clamp(perspective, 0.22, 1.32);
  const focusScale = lerp(config.card.minScale, config.card.maxScale, focus);
  const varianceScale = 1 + (item.seed - 0.5) * config.card.variance;
  const scale = perspectiveScale * focusScale * varianceScale;

  let size = Math.max(config.card.minSize, config.card.baseSize * scale);

  const sizeLimitScale = Math.min(
    1,
    (width * config.card.maxWidthRatio) / Math.max(1, size),
    (height * config.card.maxHeightRatio) / Math.max(1, size),
  );

  size *= sizeLimitScale;

  let x = width * config.camera.vanishingPointX + worldX * perspective;
  let y = height * config.camera.vanishingPointY + worldY * perspective;

  const margin = Math.min(config.viewport.margin, width * 0.08, height * 0.08);
  const maxVisibleWidth = Math.max(24, width - margin * 2);
  const maxVisibleHeight = Math.max(24, height - margin * 2);
  const fitScale = Math.min(1, maxVisibleWidth / size, maxVisibleHeight / size);

  size *= fitScale;

  x = clamp(x, margin + size * 0.5, width - margin - size * 0.5);
  y = clamp(y, margin + size * 0.5, height - margin - size * 0.5);

  const depthAlpha = lerp(config.fade.farAlpha, config.fade.nearAlpha, focus);
  const edgeAlpha = getEdgeAlpha({ x, y, size, width, height });

  return {
    item,
    x,
    y,
    z: worldZ,
    size,
    alpha: depthAlpha * edgeAlpha,
  };
};

const drawCard = ({ ctx, card }) => {
  if (card.alpha <= 0.01) {
    return;
  }

  const size = card.size;
  const x = card.x - size * 0.5;
  const y = card.y - size * 0.5;
  const radius = size * config.card.radiusRatio;

  ctx.globalAlpha = card.alpha;
  drawRoundedCover(ctx, card.item.imageElement, x, y, size, radius);
};

const renderCommunityOrbit = ({ ctx, items, time, width, height, reducedMotion }) => {
  ctx.clearRect(0, 0, width || 0, height || 0);

  if (!width || !height || !items.length) {
    return;
  }

  items
    .map((item) => getCard({ item, time, width, height, reducedMotion }))
    .sort((a, b) => b.z - a.z || a.item.sourceIndex - b.item.sourceIndex)
    .forEach((card) => drawCard({ ctx, card }));

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
};

export const mountCommunityOrbit = async (canvasId = "community-orbit-container") => {
  const canvas = globalThis.document?.getElementById?.(canvasId);

  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return createDisposeHandle();
  }

  const ctx = canvas.getContext?.("2d");

  if (!ctx) {
    console.error(`Failed to get 2d context from canvas "${canvasId}"`);
    return createDisposeHandle();
  }

  const key = createAnimationKey(COMMUNITY_ORBIT_KEY_PREFIX, canvasId);
  const mountToken = beginMount(key);
  const items = await loadImages(communityOrbitItems);

  if (!isCurrentMount(key, mountToken)) {
    return createDisposeHandle();
  }

  const state = {
    disposed: false,
  };

  const baseDispose = createCanvasAnimation({
    key,
    canvas,
    ctx,
    renderFrame: ({ time, width, height, reducedMotion }) => {
      if (state.disposed) {
        return;
      }

      renderCommunityOrbit({
        ctx,
        items,
        time,
        width,
        height,
        reducedMotion,
      });
    },
  });

  const dispose = completeMount(key, mountToken, baseDispose);

  return createDisposeHandle(() => {
    state.disposed = true;
    dispose();
  });
};

export const mountCommunityCards = mountCommunityOrbit;
export const mountLinearPerspectiveOrbit = mountCommunityOrbit;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeCanvasAnimationsByPrefix(COMMUNITY_ORBIT_KEY_PREFIX);
  });
}
