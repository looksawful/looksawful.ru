import {
  getGalleryItems,
  getGallerySeriesId,
  type GalleryItem,
} from "../../data/media/gallery.ts";
import { responsiveImageSrcSet } from "../../data/media/responsive.ts";
import { escapeHtml } from "../../utils/html.ts";
import type { GalleryPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

function groupBySeries(
  items: readonly GalleryItem[],
): readonly { id: string; items: readonly GalleryItem[] }[] {
  const groups = new Map<string, GalleryItem[]>();

  for (const item of items) {
    const seriesId = getGallerySeriesId(item);
    const group = groups.get(seriesId);
    if (group) group.push(item);
    else groups.set(seriesId, [item]);
  }

  return [...groups].map(([id, seriesItems]) => ({ id, items: seriesItems }));
}

function renderGalleryCard(item: GalleryItem): string {
  const srcset = responsiveImageSrcSet(item.asset);
  const srcsetAttribute = srcset ? ` srcset="${escapeHtml(srcset)}"` : "";
  const title = item.title || item.alt || "";

  return `<figure class="gallery-card" data-gallery-card data-gallery-item-id="${escapeHtml(item.id)}" data-gallery-src="${escapeHtml(item.asset.src)}" data-gallery-width="${item.width}" data-gallery-height="${item.height}" data-gallery-alt="${escapeHtml(item.alt)}" data-gallery-title="${escapeHtml(title)}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Открыть изображение">
  <img class="gallery-card__image" src="${escapeHtml(item.asset.src)}"${srcsetAttribute} sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, (max-width: 1500px) 25vw, 20vw" width="${item.width}" height="${item.height}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
</figure>`;
}

function renderGallerySeries(items: readonly GalleryItem[]): string {
  return groupBySeries(items)
    .map(({ id, items: seriesItems }) => `<section class="gallery-series" data-gallery-series="${escapeHtml(id)}">
  <div class="gallery-series__grid" data-gallery-series-grid>
    ${seriesItems.map(renderGalleryCard).join("\n    ")}
  </div>
</section>`)
    .join("\n");
}

export function renderGalleryPage(page: GalleryPageDefinition): string {
  const items = getGalleryItems();

  return renderPageShell({
    page,
    title: "gallery — Иван Крушинский",
    description: "Photography archive by Ivan Krushinsky.",
    content: `<section class="gallery" data-gallery>
  <header class="gallery__header">
    <h1 class="gallery__title">gallery</h1>
  </header>
  <div class="gallery__content">
${renderGallerySeries(items)}
  </div>
</section>
<script type="module" src="/src/components/gallery/gallery-entry.ts"></script>`,
  });
}
