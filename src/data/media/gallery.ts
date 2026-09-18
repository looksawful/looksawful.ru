import type { MediaCatalogItem } from "./catalog.ts";
import { contextualMediaCatalogItems } from "./catalog-view.ts";
import {
  toCatalogItem,
  type CatalogItem,
} from "./public-catalog.ts";

export interface GalleryItem extends CatalogItem {
  asset: Extract<CatalogItem["asset"], { type: "image" }>;
  width: number;
  height: number;
  aspectRatio: number;
  seriesId: string;
  seriesOrder: number;
}

const DEFAULT_GALLERY_PROJECT_IDS = new Set([
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-behance-offmi",
  "shootings-dava",
]);

function isCanonicalPhotograph(item: MediaCatalogItem): boolean {
  return item.asset.type === "image"
    && !item.archived
    && item.workAreaIds.includes("photography");
}

function isDefaultGalleryPhotograph(item: MediaCatalogItem): boolean {
  return item.projectIds.some((projectId) => (
    DEFAULT_GALLERY_PROJECT_IDS.has(projectId)
    || projectId.startsWith("styx-")
  ));
}

function seriesIdFor(item: CatalogItem): string {
  return item.projectIds[0] ?? `asset-${item.id}`;
}

function toGalleryItems(catalogItems: readonly CatalogItem[]): readonly GalleryItem[] {
  const sequenceBySeries = new Map<string, number>();

  return catalogItems
    .filter((item): item is CatalogItem & {
      asset: Extract<CatalogItem["asset"], { type: "image" }>;
      width: number;
      height: number;
      aspectRatio: number;
    } => (
      item.asset.type === "image"
      && item.width !== undefined
      && item.height !== undefined
      && item.aspectRatio !== undefined
    ))
    .map((item) => {
      const seriesId = seriesIdFor(item);
      const seriesOrder = sequenceBySeries.get(seriesId) ?? 0;
      sequenceBySeries.set(seriesId, seriesOrder + 1);
      return { ...item, seriesId, seriesOrder };
    });
}

/**
 * Gallery is a curated view over the canonical Media Catalog.
 *
 * Curated musician photography and Styx photography form the default portfolio selection.
 * Any other real photograph remains hidden until the existing
 * `showInCatalog` / "Показывать в галерее" editorial flag is enabled in
 * CMS or MediaDesk. Non-photographic assets never enter Gallery even when a
 * broader Public Catalog direction can resolve to `photo`.
 */
export function getGalleryItemsFromMediaCatalog(
  mediaItems: readonly MediaCatalogItem[] = contextualMediaCatalogItems,
): readonly GalleryItem[] {
  const catalogItems = mediaItems
    .filter(isCanonicalPhotograph)
    .filter((item) => isDefaultGalleryPhotograph(item) || item.showInCatalog)
    .map(toCatalogItem);

  return toGalleryItems(catalogItems);
}

export function getGalleryItems(): readonly GalleryItem[] {
  return getGalleryItemsFromMediaCatalog();
}

export function getGallerySeriesId(item: GalleryItem): string {
  return item.seriesId;
}
