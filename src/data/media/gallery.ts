import { projects } from "../catalog/projects/index.ts";
import {
  getPublicCatalogItems,
  type CatalogItem,
} from "./public-catalog.ts";

export const galleryLayers = ["photography", "production"] as const;

export type GalleryLayer = (typeof galleryLayers)[number];

export const DEFAULT_GALLERY_LAYER: GalleryLayer = "photography";

export type GalleryImageAsset = Extract<CatalogItem["asset"], { type: "image" }>;

export interface GalleryItem extends Omit<CatalogItem, "asset" | "width" | "height"> {
  asset: GalleryImageAsset;
  width: number;
  height: number;
  layers: readonly GalleryLayer[];
  seriesId: string;
  seriesByLayer: Readonly<Partial<Record<GalleryLayer, string>>>;
  seriesOrder: number;
}

const projectById = new Map(
  projects.map((project) => [project.id, project] as const),
);

const PHOTOGRAPHY_ROLE_IDS = new Set(["photographer", "digital-artist"]);

export function isGalleryLayer(value: string | null | undefined): value is GalleryLayer {
  return value === "photography" || value === "production";
}

function projectRoleIds(projectId: string): readonly string[] {
  const project = projectById.get(projectId as (typeof projects)[number]["id"]);
  if (!project) return [];

  return [
    ...(project.primaryRoleId ? [project.primaryRoleId] : []),
    ...(project.roleIds ?? []),
  ];
}

function projectSupportsPhotography(projectId: string): boolean {
  if (projectId.startsWith("shootings-")) return true;
  return projectRoleIds(projectId).some((roleId) => PHOTOGRAPHY_ROLE_IDS.has(roleId));
}

function projectSupportsProduction(projectId: string): boolean {
  // Sensetique is an established production case. A few historical subprojects
  // do not yet carry normalized role metadata, so the stable project identity
  // remains the prerelease migration fallback until CMS layer flags land.
  if (projectId.startsWith("sensetique-")) return true;
  return projectRoleIds(projectId).includes("producer");
}

function firstSeriesId(
  item: CatalogItem,
  layer: GalleryLayer,
): string | undefined {
  return item.projectIds.find((projectId) => (
    layer === "photography"
      ? projectSupportsPhotography(projectId)
      : projectSupportsProduction(projectId)
  ));
}

function layersFor(item: CatalogItem): readonly GalleryLayer[] {
  const layers: GalleryLayer[] = [];

  if (item.projectIds.some(projectSupportsPhotography)) layers.push("photography");
  if (item.projectIds.some(projectSupportsProduction)) layers.push("production");

  return layers;
}

export function getGalleryItems(
  catalogItems: readonly CatalogItem[] = getPublicCatalogItems(),
): readonly GalleryItem[] {
  const seriesCounts = new Map<string, number>();
  const result: GalleryItem[] = [];

  for (const item of catalogItems) {
    if (item.asset.type !== "image") continue;
    if (!item.width || !item.height || item.width <= 0 || item.height <= 0) continue;

    const layers = layersFor(item);
    if (!layers.length) continue;

    const seriesByLayer: Partial<Record<GalleryLayer, string>> = {};
    for (const layer of layers) {
      const seriesId = firstSeriesId(item, layer);
      if (seriesId) seriesByLayer[layer] = seriesId;
    }

    const seriesId = seriesByLayer[layers[0]] ?? `catalog:${item.id}`;
    const seriesOrder = seriesCounts.get(seriesId) ?? 0;
    seriesCounts.set(seriesId, seriesOrder + 1);

    result.push({
      ...item,
      asset: item.asset,
      width: item.width,
      height: item.height,
      layers,
      seriesId,
      seriesByLayer,
      seriesOrder,
    });
  }

  return result;
}

export function getGalleryItemsForLayer(
  layer: GalleryLayer,
  items: readonly GalleryItem[] = getGalleryItems(),
): readonly GalleryItem[] {
  return items.filter((item) => item.layers.includes(layer));
}

export function getGallerySeriesId(item: GalleryItem, layer: GalleryLayer): string {
  return item.seriesByLayer[layer] ?? item.seriesId;
}
