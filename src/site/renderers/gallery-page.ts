import { cases } from "../../data/catalog/cases.ts";
import { projects } from "../../data/catalog/projects/index.ts";
import type { GalleryResolvedPlacement } from "../../data/media/gallery-curation.ts";
import {
  getGalleryItems,
  getGalleryModelItems,
  getGallerySeriesId,
  type GalleryItem,
  type GalleryModelItem,
} from "../../data/media/gallery.ts";
import { responsiveImageSrcSet } from "../../data/media/responsive.ts";
import { renderGalleryResolvedSeries } from "../../components/gallery/gallery-markup.ts";
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

function projectLabelForSeries(seriesId: string): string {
  return projects.find(({ id }) => id === seriesId)?.name ?? "";
}

function caseLabel(caseId: string): string {
  return cases.find(({ id }) => id === caseId)?.name ?? "";
}

function toResolvedPhotoPlacement(
  item: GalleryItem,
  seriesOrder: number,
): GalleryResolvedPlacement {
  const title = item.title || item.alt || "";
  const alt = item.alt.trim() || title;
  const srcset = responsiveImageSrcSet(item.asset);

  return {
    itemId: item.id,
    seriesId: item.seriesId,
    seriesOrder,
    itemOrder: item.seriesOrder,
    projectId: item.projectIds[0] ?? item.seriesId,
    featured: false,
    media: [{
      assetId: item.id,
      kind: "image",
      src: item.asset.src,
      posterSrc: item.asset.src,
      ...(srcset ? { srcset } : {}),
      width: item.width,
      height: item.height,
      title,
      alt,
      credits: item.credits,
    }],
  };
}

function renderGalleryModelCard(item: GalleryModelItem): string {
  return `<figure class="gallery-card gallery-card--model" data-gallery-model-card>
  <div class="gallery-model" data-model-viewer-runtime data-model-src="${escapeHtml(item.asset.src)}" data-model-autorotate="false" role="img" aria-label="${escapeHtml(item.alt)}">
    <img class="gallery-model__poster" src="${escapeHtml(item.posterSrc)}" alt="" loading="lazy" decoding="async">
    <canvas class="gallery-model__canvas" data-model-viewer-canvas aria-hidden="true"></canvas>
  </div>
</figure>`;
}

function renderGallerySeries(items: readonly GalleryItem[]): string {
  return groupBySeries(items)
    .map(({ id, items: seriesItems }, seriesOrder) => renderGalleryResolvedSeries({
      id,
      projectLabel: projectLabelForSeries(id),
      placements: seriesItems.map((item) => toResolvedPhotoPlacement(item, seriesOrder)),
    }))
    .join("\n");
}

function renderGalleryModelSeries(items: readonly GalleryModelItem[]): string {
  if (!items.length) return "";

  return `<section class="gallery-series gallery-series--models" data-gallery-series="${escapeHtml(items[0].seriesId)}">
  <p class="gallery-series__marker">${escapeHtml(caseLabel("jestei-pool"))}</p>
  <div class="gallery-series__grid" data-gallery-series-grid>
    ${items.map(renderGalleryModelCard).join("\n    ")}
  </div>
</section>`;
}

export function renderGalleryPage(page: GalleryPageDefinition): string {
  const items = getGalleryItems();
  const modelItems = getGalleryModelItems();

  return renderPageShell({
    page,
    title: "gallery — Иван Крушинский",
    description: "Photography and selected 3D archive by Ivan Krushinsky.",
    content: `<section class="gallery" data-gallery>
  <h1 class="visually-hidden">Галерея</h1>
  <div class="gallery__content">
${renderGallerySeries(items)}
${renderGalleryModelSeries(modelItems)}
  </div>
</section>
<script type="module" src="/src/components/gallery/gallery-entry.ts"></script>`,
  });
}
