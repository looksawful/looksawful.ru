import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";
import type {
  AnimatedCanvasGalleryData,
  MovesAnimatedCanvasGalleryData,
  ProductionAnimatedCanvasGalleryData,
} from "../types/animated-canvas-gallery.ts";
import { escapeHtml } from "../utils/html.ts";

function assetSrc(entryId: MediaEntryId): string {
  const entry = getMediaEntry(entryId);
  return getMediaAsset(entry.assetId).src;
}

function renderProductionGallery(
  data: ProductionAnimatedCanvasGalleryData<MediaEntryId>,
): string {
  const className = data.className ? ` class="${escapeHtml(data.className)}"` : "";
  const sources = data.sources
    .map((source) => {
      const attributes = [
        'alt=""',
        'data-masonry-source=""',
        typeof source.sourceIndex === "number"
          ? `data-source-index="${source.sourceIndex}"`
          : "",
        source.mediaTitle
          ? `data-media-title="${escapeHtml(source.mediaTitle)}"`
          : "",
        source.mediaCredits
          ? `data-media-credits="${escapeHtml(source.mediaCredits)}"`
          : "",
        source.fallbackSrc
          ? `data-fallback-src="${escapeHtml(source.fallbackSrc)}"`
          : "",
        'decoding="async"',
        `src="${escapeHtml(assetSrc(source.entryId))}"`,
      ]
        .filter(Boolean)
        .join(" ");

      return `<img ${attributes}>`;
    })
    .join("");

  return `<div aria-label="${escapeHtml(data.ariaLabel)}"${className} data-animated-canvas-gallery="" data-gallery-profile="production" data-gallery-state="loading" data-gallery-variant="masonry"><canvas aria-label="${escapeHtml(data.ariaLabel)}"></canvas><div aria-hidden="true" data-gallery-fallback="" hidden="">${sources}</div></div>`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function renderMovesGallery(data: MovesAnimatedCanvasGalleryData<MediaEntryId>): string {
  const id = data.id ? ` id="${escapeHtml(data.id)}"` : "";
  const className = data.className ? ` class="${escapeHtml(data.className)}"` : "";
  const items = data.items.map((item) => ({
    src: assetSrc(item.entryId),
    title: item.title ?? "",
  }));

  return `<div${className} data-animated-canvas-gallery="" data-gallery-profile="moves" data-gallery-variant="${escapeHtml(data.variant)}"${id}><canvas data-animated-canvas-gallery-canvas=""></canvas><script data-gallery-items="" type="application/json">\n${safeJson(items)}\n</script></div>`;
}

export function renderAnimatedCanvasGallery(
  data: AnimatedCanvasGalleryData<MediaEntryId>,
): string {
  return data.profile === "production"
    ? renderProductionGallery(data)
    : renderMovesGallery(data);
}
