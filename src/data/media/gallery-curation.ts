import type { MediaCatalogItem } from "./catalog.ts";

export interface GalleryPlacementDefinition {
  assetId: string;
  slideAssetIds?: readonly string[];
  posterAssetId?: string;
  featured?: boolean;
}

export interface GallerySeriesDefinition {
  id: string;
  projectId: string;
  placements: readonly GalleryPlacementDefinition[];
}

export type GalleryResolvedMediaKind = "image" | "video" | "model";

export interface GalleryResolvedMedia {
  assetId: string;
  kind: GalleryResolvedMediaKind;
  src: string;
  posterSrc: string;
  width?: number;
  height?: number;
  title: string;
  alt: string;
  credits: readonly string[];
}

export interface GalleryResolvedPlacement {
  itemId: string;
  seriesId: string;
  seriesOrder: number;
  itemOrder: number;
  featured: boolean;
  media: readonly GalleryResolvedMedia[];
}

function canonicalItemById(
  catalogItems: readonly MediaCatalogItem[],
): ReadonlyMap<string, MediaCatalogItem> {
  return new Map(catalogItems.map((item) => [item.asset.id, item] as const));
}

function resolveCanonicalItem(
  itemById: ReadonlyMap<string, MediaCatalogItem>,
  assetId: string,
): MediaCatalogItem {
  const item = itemById.get(assetId);
  if (!item) {
    throw new Error(`Unknown canonical asset "${assetId}"`);
  }
  if (item.archived) {
    throw new Error(`Archived canonical asset "${assetId}" cannot enter Gallery`);
  }
  return item;
}

function resolvePosterAsset(
  itemById: ReadonlyMap<string, MediaCatalogItem>,
  posterAssetId: string,
): string {
  const poster = resolveCanonicalItem(itemById, posterAssetId);
  if (poster.asset.type !== "image") {
    throw new Error(`Gallery poster asset "${posterAssetId}" must be an image`);
  }
  return poster.asset.src;
}

function resolvedMedia(
  item: MediaCatalogItem,
  definition: GalleryPlacementDefinition,
  itemById: ReadonlyMap<string, MediaCatalogItem>,
): GalleryResolvedMedia {
  const { asset } = item;

  let posterSrc: string;
  if (definition.posterAssetId) {
    posterSrc = resolvePosterAsset(itemById, definition.posterAssetId);
  } else if (asset.type === "image") {
    posterSrc = asset.src;
  } else if (item.posterSrc) {
    posterSrc = item.posterSrc;
  } else {
    throw new Error(`Gallery ${asset.type} "${asset.id}" requires a poster`);
  }

  return {
    assetId: asset.id,
    kind: asset.type,
    src: asset.src,
    posterSrc,
    ...(asset.width !== undefined ? { width: asset.width } : {}),
    ...(asset.height !== undefined ? { height: asset.height } : {}),
    title: item.title,
    alt: item.alt,
    credits: item.credits,
  };
}

function resolvedSlide(
  itemById: ReadonlyMap<string, MediaCatalogItem>,
  assetId: string,
): GalleryResolvedMedia {
  const item = resolveCanonicalItem(itemById, assetId);
  if (item.asset.type !== "image") {
    throw new Error(`Gallery slide asset "${assetId}" must be an image`);
  }
  return resolvedMedia(item, { assetId }, itemById);
}

function assertFeaturedInvariants(series: GallerySeriesDefinition): void {
  const featuredCount = series.placements.filter(({ featured }) => featured === true).length;
  if (featuredCount > 2) {
    throw new Error(`Gallery series "${series.id}" may contain at most 2 featured placements`);
  }
  if (featuredCount > 0 && series.placements[0]?.featured !== true) {
    throw new Error(`Gallery series "${series.id}" first placement must be featured when the series uses featured emphasis`);
  }
}

export function resolveGalleryCuration(
  seriesDefinitions: readonly GallerySeriesDefinition[],
  catalogItems: readonly MediaCatalogItem[],
): readonly GalleryResolvedPlacement[] {
  const itemById = canonicalItemById(catalogItems);
  const usedAssetIds = new Set<string>();
  const result: GalleryResolvedPlacement[] = [];

  const claimAsset = (assetId: string): void => {
    if (usedAssetIds.has(assetId)) {
      throw new Error(`Gallery contains duplicate canonical asset "${assetId}"`);
    }
    usedAssetIds.add(assetId);
  };

  seriesDefinitions.forEach((series, seriesOrder) => {
    assertFeaturedInvariants(series);

    series.placements.forEach((definition, itemOrder) => {
      claimAsset(definition.assetId);
      const item = resolveCanonicalItem(itemById, definition.assetId);
      const media: GalleryResolvedMedia[] = [
        resolvedMedia(item, definition, itemById),
      ];

      for (const slideAssetId of definition.slideAssetIds ?? []) {
        claimAsset(slideAssetId);
        media.push(resolvedSlide(itemById, slideAssetId));
      }

      result.push({
        itemId: definition.assetId,
        seriesId: series.id,
        seriesOrder,
        itemOrder,
        featured: definition.featured === true,
        media,
      });
    });
  });

  return result;
}
