import type { MediaAsset, MediaEntryData } from "../../types/media.ts";

import { mediaAssets, type MediaAssetId, type MediaAssetRecord } from "./assets/index.ts";

import { mediaEntries, type MediaEntryId, type MediaEntryRecord } from "./entries/index.ts";
import {
  contextualMediaCatalogItems as mediaCatalogItems,
  findMediaCatalogItems,
  getMediaCatalogItem,
} from "./catalog-view.ts";
import {
  catalogDirections,
  catalogDirectionIdsForTaxonomy,
  getPublicCatalogItems,
  isPublicCatalogItem,
  toCatalogItem,
} from "./public-catalog.ts";
import type {
  MediaCatalogFilters,
  MediaCatalogItem,
} from "./catalog.ts";
import type {
  CatalogDirection,
  CatalogDirectionId,
  CatalogItem,
  CatalogTaxonomyInput,
} from "./public-catalog.ts";

export {
  catalogDirections,
  catalogDirectionIdsForTaxonomy,
  findMediaCatalogItems,
  getMediaCatalogItem,
  getPublicCatalogItems,
  isPublicCatalogItem,
  mediaAssets,
  mediaCatalogItems,
  mediaEntries,
  toCatalogItem,
};

export type {
  CatalogDirection,
  CatalogDirectionId,
  CatalogItem,
  CatalogTaxonomyInput,
  MediaAssetId,
  MediaAssetRecord,
  MediaCatalogFilters,
  MediaCatalogItem,
  MediaEntryId,
  MediaEntryRecord,
};

const mediaAssetById = new Map<string, MediaAsset>(
  mediaAssets.map((asset) => [asset.id, asset] as const),
);

const mediaEntryById = new Map<string, MediaEntryData<MediaAssetId>>(
  mediaEntries.map((entry) => [entry.id, entry] as const),
);

export function getMediaAsset(id: MediaAssetId): MediaAsset {
  const asset = mediaAssetById.get(id);

  if (!asset) {
    throw new Error(`Unknown MediaAsset: ${id}`);
  }

  return asset;
}

export function getMediaEntry(id: MediaEntryId): MediaEntryData<MediaAssetId> {
  const entry = mediaEntryById.get(id);

  if (!entry) {
    throw new Error(`Unknown MediaEntry: ${id}`);
  }

  return entry;
}
