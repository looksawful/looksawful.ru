import type { ModelMedia } from "../../types/media.ts";
import type { MediaCatalogItem } from "./catalog.ts";
import { getMediaAsset } from "./index.ts";
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
  seriesId: "jestei-3d-symbols" | "awful-3d-mockups";
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
]);

const GALLERY_JESTEI_SYMBOL_VARIANTS = [
  "metal",
  "pear",
  "orange",
  "blue",
  "biloba",
] as const;

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
 * Gallery photography remains a curated view over the canonical Media Catalog.
 *
 * Curated musician photography and Styx photography form the default portfolio selection.
 * Any other real photograph remains hidden until the existing
 * `showInCatalog` / "Показывать в галерее" editorial flag is enabled in
 * CMS or MediaDesk. Non-photographic catalog assets never enter this photo
 * projection even when a broader Public Catalog direction can resolve to `photo`.
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

/**
 * Explicit curation for the approved interactive 3D series.
 *
 * These are generated production assets, not photographs, so they stay outside
 * the photo eligibility rules above. Keeping the five approved variants here
 * keeps Gallery opt-in deterministic instead of exposing every ready 3D asset.
 * The iPhone mockup reuses the canonical registered device delivery asset.
 */
export function getGalleryModelItems(): readonly GalleryModelItem[] {
  const altByVariant: Record<(typeof GALLERY_JESTEI_SYMBOL_VARIANTS)[number], string> = {
    metal: "3D-символ Jestei Pool, материал metal",
    pear: "3D-символ Jestei Pool, цвет: pear",
    orange: "3D-символ Jestei Pool, материал basic",
    blue: "3D-символ Jestei Pool, цвет pro",
    biloba: "3D-символ Jestei Pool, цвет biloba",
  };
  const symbols: GalleryModelItem[] = GALLERY_JESTEI_SYMBOL_VARIANTS.map((variant, seriesOrder) => {
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
      alt: altByVariant[variant],
      seriesId: "jestei-3d-symbols",
      seriesOrder,
    };
  });
  const iphone = getMediaAsset("device-iphone-17-v30-model");
  if (iphone.type !== "model") throw new Error("Gallery iPhone asset must be a model");

  return [
    ...symbols,
    {
      id: iphone.id,
      asset: iphone,
      posterSrc: "/media/models/devices/preview/iphone-17-v30.png",
      title: "iPhone 17 mockup",
      alt: "Интерактивная 3D-модель iPhone 17",
      seriesId: "awful-3d-mockups",
      seriesOrder: 0,
    },
  ];
}

export function getGallerySeriesId(item: GalleryItem): string {
  return item.seriesId;
}
