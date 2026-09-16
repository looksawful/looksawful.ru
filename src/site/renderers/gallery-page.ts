import {
  getGalleryItems,
  type GalleryImageItem,
  type GalleryItem,
  type GalleryVideoItem,
} from "../../data/media/gallery.ts";
import { responsiveImageSrcSet } from "../../data/media/responsive.ts";
import { escapeHtml } from "../../utils/html.ts";
import type { GalleryPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

function galleryText(item: GalleryItem): {
  title: string;
  accessibleAlt: string;
  credits: string;
} {
  const title = item.title || item.alt || "";
  const accessibleAlt = item.alt.trim() || title;
  const credits = JSON.stringify([
    ...new Set(item.credits.filter((credit) => credit.trim())),
  ]);
  return { title, accessibleAlt, credits };
}

function commonGalleryCardAttributes(
  item: GalleryItem,
  title: string,
  accessibleAlt: string,
  credits: string,
): string {
  const poster = item.kind === "video"
    ? ` data-gallery-poster="${escapeHtml(item.posterSrc)}"`
    : "";

  return `class="gallery-card" data-gallery-card data-gallery-kind="${item.kind}" data-gallery-item-id="${escapeHtml(item.id)}" data-gallery-src="${escapeHtml(item.asset.src)}"${poster} data-gallery-width="${item.width}" data-gallery-height="${item.height}" data-gallery-alt="${escapeHtml(accessibleAlt)}" data-gallery-title="${escapeHtml(title)}" data-gallery-credits="${escapeHtml(credits)}" tabindex="0" role="button" aria-haspopup="dialog"`;
}

function renderImageCard(item: GalleryImageItem): string {
  const srcset = responsiveImageSrcSet(item.asset);
  const srcsetAttribute = srcset ? ` srcset="${escapeHtml(srcset)}"` : "";
  const { title, accessibleAlt, credits } = galleryText(item);
  const attributes = commonGalleryCardAttributes(item, title, accessibleAlt, credits);

  return `<figure ${attributes} aria-label="Открыть изображение">
  <img class="gallery-card__image" src="${escapeHtml(item.asset.src)}"${srcsetAttribute} sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, (max-width: 1500px) 25vw, 20vw" width="${item.width}" height="${item.height}" alt="${escapeHtml(accessibleAlt)}" loading="lazy" decoding="async">
</figure>`;
}

function renderVideoCard(item: GalleryVideoItem): string {
  const { title, accessibleAlt, credits } = galleryText(item);
  const attributes = commonGalleryCardAttributes(item, title, accessibleAlt, credits);

  return `<figure ${attributes} aria-label="Открыть видео">
  <video class="gallery-card__video" data-gallery-video src="${escapeHtml(item.asset.src)}" poster="${escapeHtml(item.posterSrc)}" width="${item.width}" height="${item.height}" muted loop playsinline preload="metadata" aria-label="${escapeHtml(accessibleAlt)}"></video>
</figure>`;
}

function renderGalleryCard(item: GalleryItem): string {
  return item.kind === "video" ? renderVideoCard(item) : renderImageCard(item);
}

export function renderGalleryPage(page: GalleryPageDefinition): string {
  const items = getGalleryItems();

  return renderPageShell({
    page,
    title: "gallery — Иван Крушинский",
    description: "Photography archive by Ivan Krushinsky.",
    content: `<section class="gallery" data-gallery>
  <div class="gallery__content" data-gallery-grid>
    ${items.map(renderGalleryCard).join("\n    ")}
  </div>
</section>
<script type="module" src="/src/components/gallery/gallery-entry.ts"></script>`,
  });
}
