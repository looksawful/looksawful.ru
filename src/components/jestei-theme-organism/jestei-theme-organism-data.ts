export const JESTEI_THEME_NAMES = Object.freeze([
  "neutral",
  "basic",
  "event",
  "pro",
  "feature",
]);

export const JESTEI_THEME_DETAIL_METRICS = Object.freeze({
  minInlineSize: "38rem",
  preferredInlineSize: "48rem",
  maxInlineSize: "64rem",
});

export const JESTEI_THEME_CSS_PROPERTIES = Object.freeze({
  slideWidth: "--jestei-slide-width",
  progress: "--jestei-theme-progress-percent",
});

export const JESTEI_THEME_RENDER_QUALITY = Object.freeze({
  compactMaxInlineSize: 672,
  compactPixelRatioLimit: 1.5,
  widePixelRatioLimit: 2,
});

export function resolveJesteiThemePixelRatio({
  devicePixelRatio,
  inlineSize,
}: {
  devicePixelRatio: number;
  inlineSize: number;
}): number {
  const safeDevicePixelRatio =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;
  const safeInlineSize =
    Number.isFinite(inlineSize) && inlineSize > 0 ? inlineSize : 0;
  const pixelRatioLimit =
    safeInlineSize > JESTEI_THEME_RENDER_QUALITY.compactMaxInlineSize
      ? JESTEI_THEME_RENDER_QUALITY.widePixelRatioLimit
      : JESTEI_THEME_RENDER_QUALITY.compactPixelRatioLimit;

  return Math.min(safeDevicePixelRatio, pixelRatioLimit);
}

export const JESTEI_THEME_SETTINGS = Object.freeze({
  modelRadius: 1.3,
  gridCellSize: 0.062,
  gridLineWidth: 0.075,
  passDuration: 5,
  get pixelRatioLimit() {
    const devicePixelRatio =
      typeof window === "undefined" ? 1 : window.devicePixelRatio;
    const inlineSize =
      typeof window === "undefined" ? 0 : window.innerWidth;

    return resolveJesteiThemePixelRatio({ devicePixelRatio, inlineSize });
  },
  baseRotationX: -12,
  baseRotationY: 25,
  baseRotationZ: 1,
});

export const JESTEI_THEME_MODEL_URL =
  "/media/projects/jestei/theme-organism/jestei-theme-organism.glb";
export const JESTEI_THEME_DRACO_PATH = "/vendor/draco/gltf/";