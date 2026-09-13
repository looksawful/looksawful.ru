import { contextualMediaCatalogItems } from "./catalog-view.ts";
import {
  catalogDirectionIdsForTaxonomy,
  getPublicCatalogItems,
  type CatalogItem,
} from "./public-catalog.ts";

export type GalleryImageAsset = Extract<CatalogItem["asset"], { type: "image" }>;

export interface GalleryItem extends Omit<CatalogItem, "asset" | "width" | "height"> {
  asset: GalleryImageAsset;
  width: number;
  height: number;
  seriesId: string;
  seriesOrder: number;
}

function getPrereleaseCatalogItems(): readonly CatalogItem[] {
  // Historical photo records already have canonical taxonomy/usages but many
  // have not yet had showInCatalog materialized by the CMS. The isolated
  // prerelease bridge promotes only canonical photo-direction image records
  // through the existing Public Catalog converter. It does not invent a
  // production/art layer and does not change the global publication default.
  const candidates = contextualMediaCatalogItems
    .filter((item) => (
      item.asset.type === "image"
      && !item.archived
      && catalogDirectionIdsForTaxonomy(item).includes("photo")
    ))
    .map((item) => item.showInCatalog ? item : { ...item, showInCatalog: true });

  return getPublicCatalogItems(candidates)
    .filter((item) => item.asset.type === "image" && item.directions.includes("photo"));
}

function seriesIdFor(item: CatalogItem): string {
  return item.projectIds[0] ?? `catalog:${item.id}`;
}

export function getGalleryItems(
  catalogItems: readonly CatalogItem[] = getPrereleaseCatalogItems(),
): readonly GalleryItem[] {
  const seriesCounts = new Map<string, number>();
  const result: GalleryItem[] = [];

  for (const item of catalogItems) {
    if (item.asset.type !== "image") continue;
    if (!item.directions.includes("photo")) continue;
    if (!item.width || !item.height || item.width <= 0 || item.height <= 0) continue;

    const seriesId = seriesIdFor(item);
    const seriesOrder = seriesCounts.get(seriesId) ?? 0;
    seriesCounts.set(seriesId, seriesOrder + 1);

    result.push({
      ...item,
      asset: item.asset,
      width: item.width,
      height: item.height,
      seriesId,
      seriesOrder,
    });
  }

  return result;
}

export function getGallerySeriesId(item: GalleryItem): string {
  return item.seriesId;
}
