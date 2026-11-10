import type { MediaCatalogItem } from "./catalog.ts";

export interface GalleryPlacementCrop {
  aspectRatio: number;
  positionX: number;
  positionY: number;
}

export interface GalleryPlacementDefinition {
  assetId: string;
  slideAssetIds?: readonly string[];
  posterAssetId?: string;
  featured?: boolean;
  crop?: GalleryPlacementCrop;
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
  srcset?: string;
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
  projectId: string;
  featured: boolean;
  crop?: GalleryPlacementCrop;
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

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} must be non-empty`);
  return normalized;
}

function assertProjectOwnership(item: MediaCatalogItem, projectId: string): void {
  if (!item.projectIds.some((candidate) => candidate === projectId)) {
    throw new Error(
      `Gallery asset "${item.asset.id}" is not owned by project "${projectId}"`,
    );
  }
}

function normalizeCrop(
  definition: GalleryPlacementDefinition,
): GalleryPlacementCrop | undefined {
  if (!definition.crop) return undefined;
  if (definition.featured !== true) {
    throw new Error("Gallery crop is only valid on a featured placement");
  }

  const { aspectRatio, positionX, positionY } = definition.crop;
  const valid = Number.isFinite(aspectRatio)
    && aspectRatio > 0
    && Number.isFinite(positionX)
    && positionX >= 0
    && positionX <= 100
    && Number.isFinite(positionY)
    && positionY >= 0
    && positionY <= 100;
  if (!valid) throw new Error("Gallery placement has invalid crop values");

  return { aspectRatio, positionX, positionY };
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
  const usedSeriesIds = new Set<string>();
  const result: GalleryResolvedPlacement[] = [];

  const claimAsset = (assetId: string): void => {
    if (usedAssetIds.has(assetId)) {
      throw new Error(`Gallery contains duplicate canonical asset "${assetId}"`);
    }
    usedAssetIds.add(assetId);
  };

  seriesDefinitions.forEach((series, seriesOrder) => {
    const seriesId = requireNonEmpty(series.id, "Gallery series id");
    if (usedSeriesIds.has(seriesId)) {
      throw new Error(`Duplicate Gallery series id "${seriesId}"`);
    }
    usedSeriesIds.add(seriesId);
    const projectId = requireNonEmpty(
      series.projectId,
      `Gallery series "${seriesId}" project id`,
    );
    assertFeaturedInvariants(series);

    series.placements.forEach((definition, itemOrder) => {
      claimAsset(definition.assetId);
      const item = resolveCanonicalItem(itemById, definition.assetId);
      assertProjectOwnership(item, projectId);
      const media: GalleryResolvedMedia[] = [
        resolvedMedia(item, definition, itemById),
      ];

      for (const slideAssetId of definition.slideAssetIds ?? []) {
        claimAsset(slideAssetId);
        const slideItem = resolveCanonicalItem(itemById, slideAssetId);
        assertProjectOwnership(slideItem, projectId);
        media.push(resolvedSlide(itemById, slideAssetId));
      }

      const crop = normalizeCrop(definition);
      result.push({
        itemId: definition.assetId,
        seriesId,
        seriesOrder,
        itemOrder,
        projectId,
        featured: definition.featured === true,
        ...(crop ? { crop } : {}),
        media,
      });
    });
  });

  return result;
}
