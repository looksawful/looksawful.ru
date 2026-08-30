import type { ImageMedia } from "../../types/media.ts";
import { responsiveMediaVariants } from "./responsive-generated.ts";
import { responsiveVariantSrc } from "./responsive-policy.ts";

export {
  isResponsiveImageSrc,
  RESPONSIVE_NEAR_MASTER_RATIO,
  RESPONSIVE_OUTPUT_PREFIX,
  RESPONSIVE_WIDTHS,
  responsiveVariantSrc,
  responsiveVariantWidths,
} from "./responsive-policy.ts";

export type ResponsiveMediaVariant = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

export function responsiveVariantsFor(asset: ImageMedia): readonly ResponsiveMediaVariant[] {
  const variants = (responsiveMediaVariants as Record<string, readonly ResponsiveMediaVariant[]>)[asset.id] ?? [];

  return variants.every(
    (variant) => variant.src === responsiveVariantSrc(asset.src, variant.width),
  )
    ? variants
    : [];
}

export function responsiveImageSrcSet(asset: ImageMedia): string {
  return responsiveVariantsFor(asset)
    .map((variant) => `${encodeURI(variant.src)} ${variant.width}w`)
    .join(", ");
}
