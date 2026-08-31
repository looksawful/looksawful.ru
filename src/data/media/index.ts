import type { MediaAsset, MediaEntryData } from "../../types/media.ts";

import { mediaAssets, type MediaAssetId, type MediaAssetRecord } from "./assets/index.ts";

import { mediaEntries, type MediaEntryId, type MediaEntryRecord } from "./entries/index.ts";
import {
  findMediaCatalogItems,
  getMediaCatalogItem,
  mediaCatalogItems,
  type MediaCatalogFilters,
  type MediaCatalogItem,
} from "./catalog.ts";

export {
  findMediaCatalogItems,
  getMediaCatalogItem,
  mediaAssets,
  mediaCatalogItems,
  mediaEntries,
};

export type {
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
