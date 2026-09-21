import type { ModelMedia } from "../../types/media.ts";
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

export interface GalleryModelItem {
  id: string;
  asset: ModelMedia;
  posterSrc: string;
  title: string;
  alt: string;
  seriesId: "jestei-3d-symbols";
  seriesOrder: number;
}

export const GALLERY_IMAGE_ASSET_IDS = [
  "obladaet-01-source-01-32x45",
  "obladaet-01-source-02-2x3",
  "obladaet-01-source-03-4x5",
  "evasha-05-source-01-1x1",
  "evasha-06-source-01-2x3",
  "evasha-06-source-02-2x3",
  "igguana-11-source-01-1x1",
  "igguana-11-source-02-4x5",
  "igguana-11-source-03-4x5",
  "esmi-12-source-01-1x1",
  "hypression-14-source-01-5x4",
  "hypression-15-source-01-1x1",
  "hypression-15-source-02-256x181",
  "ofelia-19-source-01-4x5",
  "ofelia-19-source-02-3x4",
  "ofelia-19-source-03-1553x2135",
  "behance-offmi-001",
  "behance-offmi-002",
  "behance-offmi-003",
  "styx-09-source-01-1x1",
  "styx-09-source-02-3x4",
  "styx-09-source-03-1x1",
] as const;

const galleryImageOrder = new Map<string, number>(
  GALLERY_IMAGE_ASSET_IDS.map((id, index) => [id, index]),
);

const GALLERY_JESTEI_SYMBOL_VARIANTS = [
  "pear",
  "orange",
  "blue",
] as const;

function isCanonicalPhotograph(item: MediaCatalogItem): boolean {
  return item.asset.type === "image"
    && !item.archived
    && item.workAreaIds.includes("photography");
}

function isCuratedGalleryImage(item: MediaCatalogItem): boolean {
  return galleryImageOrder.has(item.asset.id);
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

export function getGalleryItemsFromMediaCatalog(
  mediaItems: readonly MediaCatalogItem[] = contextualMediaCatalogItems,
): readonly GalleryItem[] {
  const catalogItems = mediaItems
    .filter(isCanonicalPhotograph)
    .filter(isCuratedGalleryImage)
    .sort((left, right) => (
      (galleryImageOrder.get(left.asset.id) ?? Number.MAX_SAFE_INTEGER)
      - (galleryImageOrder.get(right.asset.id) ?? Number.MAX_SAFE_INTEGER)
    ))
    .map(toCatalogItem);

  return toGalleryItems(catalogItems);
}

export function getGalleryItems(): readonly GalleryItem[] {
  const items = getGalleryItemsFromMediaCatalog();
  if (items.length !== GALLERY_IMAGE_ASSET_IDS.length) {
    const found = new Set(items.map((item) => item.asset.id));
    const missing = GALLERY_IMAGE_ASSET_IDS.filter((id) => !found.has(id));
    throw new Error(`Gallery curation is missing canonical image assets: ${missing.join(", ")}`);
  }
  return items;
}

export function getGalleryModelItems(): readonly GalleryModelItem[] {
  return GALLERY_JESTEI_SYMBOL_VARIANTS.map((variant, seriesOrder) => {
    const id = `jestei-symbol-${variant}`;
    return {
      id,
      asset: {
        id,
        type: "model",
        src: `/media/logo-3d/jestei/${id}.glb`,
        mimeType: "model/gltf-binary",
      },
      posterSrc: `/media/logo-3d/jestei/preview/${id}.png`,
      title: `Jestei Pool 3D symbol — ${variant}`,
      alt: `Jestei Pool 3D symbol, ${variant} material`,
      seriesId: "jestei-3d-symbols",
      seriesOrder,
    };
  });
}

export function getGallerySeriesId(item: GalleryItem): string {
  return item.seriesId;
}
