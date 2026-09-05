import { responsiveImageSrcSet } from "../data/media/responsive.ts";
import type { ImageMedia } from "../types/media.ts";
import type { MediaLoading } from "../types/media-presentation.ts";
import { escapeHtml } from "../utils/html.ts";

export function renderResponsiveImageAttributes(
  asset: ImageMedia,
  loading: MediaLoading,
): string {
  const srcset = responsiveImageSrcSet(asset);
  if (!srcset) return "";

  const sizes = loading === "lazy" ? "auto, 100vw" : "100vw";
  return ` sizes="${escapeHtml(sizes)}" srcset="${escapeHtml(srcset)}"`;
}
