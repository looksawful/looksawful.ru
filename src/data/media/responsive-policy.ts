export const RESPONSIVE_WIDTHS = [480, 768, 1280, 1920, 2560] as const;
export const RESPONSIVE_NEAR_MASTER_RATIO = 0.9;
export const RESPONSIVE_OUTPUT_PREFIX = "/media/generated/responsive";

const RESPONSIVE_INPUT_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

function cleanSrc(src: string): string {
  return src.split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/^\.?\//, "");
}

function extensionFor(src: string): string {
  const path = cleanSrc(src);
  const basename = path.slice(path.lastIndexOf("/") + 1);
  const dot = basename.lastIndexOf(".");
  return dot >= 0 ? basename.slice(dot + 1).toLowerCase() : "";
}

export function isResponsiveImageSrc(src: string): boolean {
  return RESPONSIVE_INPUT_FORMATS.has(extensionFor(src));
}

export function responsiveVariantWidths(
  sourceWidth: number | undefined,
  widths: readonly number[] = RESPONSIVE_WIDTHS,
): number[] {
  const width = Number(sourceWidth);
  if (!Number.isFinite(width) || width <= 0) return [];

  return [...new Set(widths)]
    .filter((candidate) => Number.isFinite(candidate) && candidate > 0)
    .sort((a, b) => a - b)
    .filter((candidate) => candidate < width * RESPONSIVE_NEAR_MASTER_RATIO);
}

export function responsiveVariantSrc(sourceSrc: string, width: number): string {
  const clean = cleanSrc(sourceSrc).replace(/^media\//, "");
  const slash = clean.lastIndexOf("/");
  const dir = slash >= 0 ? clean.slice(0, slash + 1) : "";
  const basename = slash >= 0 ? clean.slice(slash + 1) : clean;
  const dot = basename.lastIndexOf(".");
  const name = dot >= 0 ? basename.slice(0, dot) : basename;
  return `${RESPONSIVE_OUTPUT_PREFIX}/${dir}${name}@${width}.webp`;
}
