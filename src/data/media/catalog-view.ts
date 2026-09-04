import type { MediaEntryData } from "../../types/media.ts";
import {
  mediaCatalogItems as baseMediaCatalogItems,
  type MediaCatalogFilters,
  type MediaCatalogItem,
} from "./catalog.ts";
import { mediaEntries } from "./entries/index.ts";

type CatalogFacetKey =
  | "projectIds"
  | "workAreaIds"
  | "projectTypeIds"
  | "deliverableIds"
  | "tags"
  | "credits";

type CatalogUsageEntry = Pick<
  MediaEntryData,
  | "assetId"
  | "projectIds"
  | "workAreaIds"
  | "projectTypeIds"
  | "deliverableIds"
  | "tags"
  | "credits"
>;

function stableUnion(values: readonly (readonly string[])[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of values) {
    for (const value of group) {
      if (seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

function deriveFacet(
  item: MediaCatalogItem,
  entries: readonly CatalogUsageEntry[],
  key: CatalogFacetKey,
): readonly string[] {
  const explicitUsageValues = entries
    .map((entry) => entry[key])
    .filter((values): values is readonly string[] => values !== undefined);

  return stableUnion([item[key], ...explicitUsageValues]);
}

/**
 * Builds the read-only browsing projection.
 *
 * The base catalog remains the library/editor source. Contextual relations are
 * added from MediaEntry usages, but this aggregate is never written back into
 * an individual MediaEntry.
 */
export function deriveMediaCatalogItems(
  baseItems: readonly MediaCatalogItem[],
  entries: readonly CatalogUsageEntry[],
): readonly MediaCatalogItem[] {
  const entriesByAssetId = new Map<string, CatalogUsageEntry[]>();
  for (const entry of entries) {
    const group = entriesByAssetId.get(entry.assetId);
    if (group) group.push(entry);
    else entriesByAssetId.set(entry.assetId, [entry]);
  }

  return baseItems.map((item) => {
    const assetEntries = entriesByAssetId.get(item.asset.id) ?? [];
    if (assetEntries.length === 0) return item;

    return {
      ...item,
      projectIds: deriveFacet(item, assetEntries, "projectIds"),
      workAreaIds: deriveFacet(item, assetEntries, "workAreaIds"),
      projectTypeIds: deriveFacet(item, assetEntries, "projectTypeIds"),
      deliverableIds: deriveFacet(item, assetEntries, "deliverableIds"),
      tags: deriveFacet(item, assetEntries, "tags"),
      credits: deriveFacet(item, assetEntries, "credits"),
    } as MediaCatalogItem;
  });
}

export const mediaCatalogItems =
  deriveMediaCatalogItems(baseMediaCatalogItems, mediaEntries);

const mediaCatalogItemByAssetId = new Map(
  mediaCatalogItems.map((item) => [item.asset.id, item] as const),
);

export function getMediaCatalogItem(assetId: string): MediaCatalogItem {
  const item = mediaCatalogItemByAssetId.get(assetId);
  if (!item) throw new Error(`Unknown media catalog asset: ${assetId}`);
  return item;
}

function includesAny(
  values: readonly string[],
  candidates: readonly string[] | undefined,
): boolean {
  return !candidates?.length
    || candidates.some((candidate) => values.includes(candidate));
}

function normalizeTag(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
}

export function findMediaCatalogItems(
  filters: MediaCatalogFilters = {},
): readonly MediaCatalogItem[] {
  const requestedTags = filters.tags?.map(normalizeTag);

  return mediaCatalogItems.filter((item) => {
    if (filters.reusable !== undefined && item.reusable !== filters.reusable) {
      return false;
    }
    if (filters.archived !== undefined && item.archived !== filters.archived) {
      return false;
    }
    if (filters.mediaTypes?.length && !filters.mediaTypes.includes(item.asset.type)) {
      return false;
    }
    if (!includesAny(item.projectIds, filters.projectIds)) return false;
    if (!includesAny(item.workAreaIds, filters.workAreaIds)) return false;
    if (!includesAny(item.projectTypeIds, filters.projectTypeIds)) return false;
    if (!includesAny(item.deliverableIds, filters.deliverableIds)) return false;

    if (requestedTags?.length) {
      const itemTags = item.tags.map(normalizeTag);
      if (!requestedTags.some((tag) => itemTags.includes(tag))) return false;
    }

    return true;
  });
}
