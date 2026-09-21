import type {
  GalleryResolvedMedia,
  GalleryResolvedPlacement,
} from "../../data/media/gallery-curation.ts";
import { escapeHtml } from "../../utils/html.ts";

export interface GalleryResolvedSeriesMarkup {
  id: string;
  projectLabel: string;
  placements: readonly GalleryResolvedPlacement[];
}

function creditsAttribute(credits: readonly string[]): string {
  return escapeHtml(JSON.stringify([...new Set(credits.filter((credit) => credit.trim()))]));
}

function dimensionAttributes(media: GalleryResolvedMedia): string {
  const width = media.width && media.width > 0 ? ` width="${media.width}"` : "";
  const height = media.height && media.height > 0 ? ` height="${media.height}"` : "";
  return `${width}${height}`;
}

function renderMediaDescriptor(
  media: GalleryResolvedMedia,
  slide: number,
): string {
  return `<span hidden data-gallery-media data-gallery-slide="${slide}" data-gallery-asset-id="${escapeHtml(media.assetId)}" data-gallery-kind="${media.kind}" data-gallery-src="${escapeHtml(media.src)}" data-gallery-poster-src="${escapeHtml(media.posterSrc)}"${media.width ? ` data-gallery-width="${media.width}"` : ""}${media.height ? ` data-gallery-height="${media.height}"` : ""} data-gallery-alt="${escapeHtml(media.alt)}" data-gallery-title="${escapeHtml(media.title)}" data-gallery-credits="${creditsAttribute(media.credits)}"></span>`;
}

function renderCardMedia(media: GalleryResolvedMedia): string {
  return `<img class="gallery-card__image" src="${escapeHtml(media.posterSrc)}"${dimensionAttributes(media)} alt="${escapeHtml(media.alt)}" loading="lazy" decoding="async">`;
}

export function renderGalleryResolvedPlacement(
  placement: GalleryResolvedPlacement,
): string {
  const primary = placement.media[0];
  if (!primary) {
    throw new Error(`Gallery placement "${placement.itemId}" has no media`);
  }

  const featuredAttribute = placement.featured ? " data-gallery-featured" : "";
  const label = primary.alt.trim() || primary.title.trim() || placement.itemId;
  const descriptors = placement.media
    .map((media, index) => renderMediaDescriptor(media, index + 1))
    .join("\n  ");

  return `<figure class="gallery-card gallery-card--${primary.kind}" data-gallery-card data-gallery-item-id="${escapeHtml(placement.itemId)}" data-gallery-kind="${primary.kind}"${featuredAttribute} tabindex="0" role="button" aria-haspopup="dialog" aria-label="Открыть: ${escapeHtml(label)}">
  ${renderCardMedia(primary)}
  ${descriptors}
</figure>`;
}

export function renderGalleryResolvedSeries(
  series: GalleryResolvedSeriesMarkup,
): string {
  const marker = series.projectLabel.trim()
    ? `  <p class="gallery-series__marker">${escapeHtml(series.projectLabel.trim())}</p>\n`
    : "";

  return `<section class="gallery-series" data-gallery-series="${escapeHtml(series.id)}">
${marker}  <div class="gallery-series__grid" data-gallery-series-grid>
    ${series.placements.map(renderGalleryResolvedPlacement).join("\n    ")}
  </div>
</section>`;
}
