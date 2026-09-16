import type { MediaCatalogItem } from "./catalog.ts";
import { contextualMediaCatalogItems } from "./catalog-view.ts";
import { mediaEntries } from "./entries/index.ts";
import {
  toCatalogItem,
  type CatalogItem,
} from "./public-catalog.ts";
import { responsiveVariantsFor } from "./responsive.ts";

export type GalleryBaseItem = Omit<
  CatalogItem,
  "asset" | "width" | "height" | "aspectRatio"
> & {
  width: number;
  height: number;
  aspectRatio: number;
};

export type GalleryImageItem = GalleryBaseItem & {
  kind: "image";
  asset: Extract<CatalogItem["asset"], { type: "image" }>;
};

export type GalleryVideoItem = GalleryBaseItem & {
  kind: "video";
  asset: Extract<CatalogItem["asset"], { type: "video" }>;
  posterSrc: string;
};

export type GalleryItem = GalleryImageItem | GalleryVideoItem;

const DEFAULT_MUSICIAN_PROJECT_IDS: ReadonlySet<string> = new Set([
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-behance-offmi",
]);

const HIDDEN_PROJECT_IDS: ReadonlySet<string> = new Set(["shootings-dava"]);

const APPROVED_MOVES_AWFUL_ENTRY_IDS: ReadonlySet<string> = new Set([
  "moves-awful-jestei-landing-animation-01-use-01",
  "moves-awful-jestei-landing-animation-02-use-01",
  "moves-awful-jestei-landing-animation-03-use-01",
]);

const APPROVED_JESTEI_BRAND_ENTRY_IDS: ReadonlySet<string> = new Set([
  "jestei-system-logo-source-logo-anatomy-slide-use-01",
  "jestei-system-logo-source-logo-color-slide-use-01",
  "jestei-system-logo-source-logo-type-slide-use-01",
  "jestei-system-logo-source-logo-system-01-use-01",
  "jestei-system-type-source-logo-druk-slide-use-01",
]);

const APPROVED_JESTEI_BANNER_ENTRY_IDS: ReadonlySet<string> = new Set([
  "jestei-05-source-01-701x452-use-01",
  "jestei-05-source-02-1x1-use-01",
  "jestei-05-source-03-1x1-use-01",
  "jestei-05-source-04-1x1-use-01",
  "jestei-05-source-05-1x1-use-01",
  "jestei-05-source-06-1x1-use-01",
  "jestei-05-source-07-1x1-use-01",
  "jestei-05-source-08-1x1-use-01",
  "jestei-05-source-09-1x1-use-01",
  "jestei-05-source-10-1x1-use-01",
  "jestei-05-source-11-3x2-use-01",
]);

const APPROVED_JESTEI_LANDINGS_ENTRY_IDS: ReadonlySet<string> = new Set([
  "jestei-13-source-13-1280x588-use-01",
]);

function canonicalAssetIdsForEntryIds(entryIds: ReadonlySet<string>): ReadonlySet<string> {
  return new Set<string>(
    mediaEntries
      .filter((entry) => entryIds.has(entry.id))
      .map((entry) => entry.assetId),
  );
}

const APPROVED_EXACT_ASSET_IDS: ReadonlySet<string> = new Set<string>([
  ...canonicalAssetIdsForEntryIds(APPROVED_MOVES_AWFUL_ENTRY_IDS),
  ...canonicalAssetIdsForEntryIds(APPROVED_JESTEI_BRAND_ENTRY_IDS),
  ...canonicalAssetIdsForEntryIds(APPROVED_JESTEI_BANNER_ENTRY_IDS),
  ...canonicalAssetIdsForEntryIds(APPROVED_JESTEI_LANDINGS_ENTRY_IDS),
]);

const posterAssetIds: ReadonlySet<string> = new Set<string>(
  mediaEntries.flatMap((entry) => entry.posterAssetId ? [entry.posterAssetId] : []),
);
const usageAssetIds: ReadonlySet<string> = new Set<string>(
  mediaEntries.map((entry) => entry.assetId),
);

function isTechnicalPosterOnly(assetId: string): boolean {
  return posterAssetIds.has(assetId) && !usageAssetIds.has(assetId);
}

function belongsToFamily(item: MediaCatalogItem, prefix: string): boolean {
  return item.projectIds.some((projectId) => projectId.startsWith(prefix));
}

function isApprovedGalleryItem(item: MediaCatalogItem): boolean {
  if (item.archived) return false;
  if (item.projectIds.some((projectId) => HIDDEN_PROJECT_IDS.has(projectId))) return false;
  if (item.asset.type === "model") return false;
  if (isTechnicalPosterOnly(item.asset.id)) return false;

  if (APPROVED_EXACT_ASSET_IDS.has(item.asset.id)) return true;

  if (item.asset.type === "image" && belongsToFamily(item, "styx-")) return true;
  if (item.asset.type === "image" && belongsToFamily(item, "sensetique-")) return true;

  if (
    item.asset.type === "image"
    && item.projectIds.some((projectId) => DEFAULT_MUSICIAN_PROJECT_IDS.has(projectId))
  ) {
    return true;
  }

  return item.asset.type === "image"
    && item.showInCatalog
    && item.workAreaIds.includes("photography");
}

function resolvedGalleryGeometry(item: CatalogItem): {
  width: number;
  height: number;
  aspectRatio: number;
} | null {
  if (item.width && item.height && item.aspectRatio) {
    return {
      width: item.width,
      height: item.height,
      aspectRatio: item.aspectRatio,
    };
  }

  if (item.asset.type === "image") {
    const variants = responsiveVariantsFor(item.asset);
    const fallback = variants[variants.length - 1];
    if (fallback && fallback.width > 0 && fallback.height > 0) {
      return {
        width: fallback.width,
        height: fallback.height,
        aspectRatio: fallback.width / fallback.height,
      };
    }
  }

  return null;
}

function toGalleryItem(item: CatalogItem): GalleryItem | null {
  const geometry = resolvedGalleryGeometry(item);
  if (!geometry) return null;

  const base = {
    ...item,
    ...geometry,
  };

  if (item.asset.type === "image") {
    return {
      ...base,
      kind: "image",
      asset: item.asset,
    };
  }

  if (item.asset.type === "video" && item.posterSrc) {
    return {
      ...base,
      kind: "video",
      asset: item.asset,
      posterSrc: item.posterSrc,
    };
  }

  return null;
}

/**
 * Curated mixed-media Gallery projection over canonical media ownership.
 * Bulk project families are selected by canonical context; exact Jestei and
 * Moves Awful selections resolve MediaEntry IDs to canonical asset IDs once.
 * Historical raster assets missing dimensions reuse the existing generated
 * responsive metadata for stable intrinsic geometry instead of inventing a
 * Gallery-specific media registry.
 */
export function getGalleryItemsFromMediaCatalog(
  mediaItems: readonly MediaCatalogItem[] = contextualMediaCatalogItems,
): readonly GalleryItem[] {
  return mediaItems
    .filter(isApprovedGalleryItem)
    .map(toCatalogItem)
    .map(toGalleryItem)
    .filter((item): item is GalleryItem => item !== null);
}

export function getGalleryItems(): readonly GalleryItem[] {
  return getGalleryItemsFromMediaCatalog();
}

/** @deprecated Layout no longer groups the public wall by series. */
export function getGallerySeriesId(item: GalleryItem): string {
  return item.projectIds[0] ?? `asset-${item.id}`;
}
