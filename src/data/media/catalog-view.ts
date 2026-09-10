import type { MediaEntryData } from "../../types/media.ts";
import { retiredMediaAssetIds } from "./asset-aliases.ts";
import {
  mediaCatalogItems as baseMediaCatalogItems,
  type MediaCatalogFilters,
  type MediaCatalogItem,
} from "./catalog.ts";
import { mediaEntries } from "./entries/index.ts";

type CatalogScalarKey =
  | "title"
  | "alt"
  | "description"
  | "date";

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
  | "posterAssetId"
  | CatalogScalarKey
  | CatalogFacetKey
>;

const VIDEO_FALLBACK_POSTER_LANDSCAPE_SRC = "/media/fallback/video-16x9.svg";
const VIDEO_FALLBACK_POSTER_PORTRAIT_SRC = "/media/fallback/video-9x16.svg";

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

function entriesByAssetId(
  entries: readonly CatalogUsageEntry[],
): ReadonlyMap<string, readonly CatalogUsageEntry[]> {
  const grouped = new Map<string, CatalogUsageEntry[]>();
  for (const entry of entries) {
    const group = grouped.get(entry.assetId);
    if (group) group.push(entry);
    else grouped.set(entry.assetId, [entry]);
  }
  return grouped;
}

function everyUsageDefines(
  entries: readonly CatalogUsageEntry[],
  key: CatalogScalarKey | CatalogFacetKey,
): boolean {
  return entries.length > 0 && entries.every((entry) => entry[key] !== undefined);
}

function deriveScalar(
  item: MediaCatalogItem,
  entries: readonly CatalogUsageEntry[],
  key: CatalogScalarKey,
): string {
  if (!everyUsageDefines(entries, key)) return item[key];
  return entries[0][key] as string;
}

function deriveFacet(
  item: MediaCatalogItem,
  entries: readonly CatalogUsageEntry[],
  key: CatalogFacetKey,
): readonly string[] {
  const explicitUsageValues = entries
    .map((entry) => entry[key])
    .filter((values): values is readonly string[] => values !== undefined);

  return everyUsageDefines(entries, key)
    ? stableUnion(explicitUsageValues)
    : stableUnion([item[key], ...explicitUsageValues]);
}

function resolveVideoPosterSrc(
  item: MediaCatalogItem,
  entries: readonly CatalogUsageEntry[],
  itemByAssetId: ReadonlyMap<string, MediaCatalogItem>,
): string | undefined {
  if (item.asset.type !== "video") return item.posterSrc;
  if (item.posterSrc) return item.posterSrc;

  const explicitPosterAssetIds = stableUnion([
    entries
      .map((entry) => entry.posterAssetId)
      .filter((id): id is string => Boolean(id)),
  ]);

  for (const posterAssetId of explicitPosterAssetIds) {
    const poster = itemByAssetId.get(posterAssetId)?.asset;
    if (poster?.type === "image") return poster.src;
  }

  return typeof item.asset.width === "number"
      && typeof item.asset.height === "number"
      && item.asset.height > item.asset.width
    ? VIDEO_FALLBACK_POSTER_PORTRAIT_SRC
    : VIDEO_FALLBACK_POSTER_LANDSCAPE_SRC;
}

/**
 * Adds only resolved video posters to the editable library catalog model.
 * Editorial metadata stays untouched so Media Desk browser and editor keep
 * reading and writing the same values.
 */
export function deriveMediaCatalogDisplayItems(
  baseItems: readonly MediaCatalogItem[],
  entries: readonly CatalogUsageEntry[],
): readonly MediaCatalogItem[] {
  const groupedEntries = entriesByAssetId(entries);
  const itemByAssetId = new Map(
    baseItems.map((item) => [item.asset.id, item] as const),
  );

  return baseItems.map((item) => {
    const posterSrc = resolveVideoPosterSrc(
      item,
      groupedEntries.get(item.asset.id) ?? [],
      itemByAssetId,
    );
    return posterSrc === undefined || posterSrc === item.posterSrc
      ? item
      : { ...item, posterSrc };
  });
}

/**
 * Builds the read-only contextual browsing projection.
 *
 * During migration, legacy catalog context remains only as a fallback for keys
 * that have not yet been materialized on every usage of an asset. Once every
 * usage defines a contextual key, the catalog derives that key exclusively
 * from usages. This lets the source cleanup remove duplicated catalog context
 * without changing the browsing API.
 */
export function deriveMediaCatalogItems(
  baseItems: readonly MediaCatalogItem[],
  entries: readonly CatalogUsageEntry[],
): readonly MediaCatalogItem[] {
  const groupedEntries = entriesByAssetId(entries);
  const displayItems = deriveMediaCatalogDisplayItems(baseItems, entries);

  return displayItems
    .filter((item) => !retiredMediaAssetIds.has(item.asset.id))
    .map((item) => {
      const assetEntries = groupedEntries.get(item.asset.id) ?? [];
      if (assetEntries.length === 0) return item;

      return {
        ...item,
        title: deriveScalar(item, assetEntries, "title"),
        alt: deriveScalar(item, assetEntries, "alt"),
        description: deriveScalar(item, assetEntries, "description"),
        date: deriveScalar(item, assetEntries, "date"),
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
  deriveMediaCatalogDisplayItems(baseMediaCatalogItems, mediaEntries);

export const contextualMediaCatalogItems =
  deriveMediaCatalogItems(baseMediaCatalogItems, mediaEntries);

const mediaCatalogItemByAssetId = new Map(
  contextualMediaCatalogItems.map((item) => [item.asset.id, item] as const),
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

  return contextualMediaCatalogItems.filter((item) => {
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
