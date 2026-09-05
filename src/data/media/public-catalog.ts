import {
  MEDIA_CATALOG_DELIVERABLE_IDS,
  MEDIA_CATALOG_PROJECT_TYPE_IDS,
  MEDIA_CATALOG_WORK_AREA_IDS,
} from "../taxonomy/media-taxonomy.ts";
import type { MediaCatalogItem } from "./catalog.ts";
import { contextualMediaCatalogItems as mediaCatalogItems } from "./catalog-view.ts";

export const catalogDirections = [
  { id: "photo", label: "PHOTO" },
  { id: "production", label: "PRODUCTION" },
  { id: "graphic", label: "GRAPHIC" },
  { id: "identity", label: "IDENTITY" },
  { id: "illustration", label: "ILLUSTRATION" },
  { id: "motion", label: "MOTION" },
  { id: "3d", label: "3D" },
  { id: "product", label: "PRODUCT" },
] as const;

export type CatalogDirection = (typeof catalogDirections)[number];
export type CatalogDirectionId = CatalogDirection["id"];

export interface CatalogTaxonomyInput {
  workAreaIds: readonly string[];
  projectTypeIds: readonly string[];
  deliverableIds: readonly string[];
}

const knownWorkAreaIds = new Set<string>(MEDIA_CATALOG_WORK_AREA_IDS);
const knownProjectTypeIds = new Set<string>(MEDIA_CATALOG_PROJECT_TYPE_IDS);
const knownDeliverableIds = new Set<string>(MEDIA_CATALOG_DELIVERABLE_IDS);

const workAreaDirections = new Map<string, readonly CatalogDirectionId[]>([
  ["photography", ["photo"]],
  ["photo-direction", ["photo"]],
  ["production", ["production"]],
  ["illustration", ["illustration"]],
  ["graphic-design", ["graphic"]],
  ["editorial-design", ["graphic"]],
  ["identity", ["identity"]],
  ["brand-communication", ["identity"]],
  ["social-media", ["graphic"]],
  ["motion", ["motion"]],
  ["3d", ["3d"]],
  ["product-design", ["product"]],
  ["ux", ["product"]],
  ["ui", ["product"]],
  ["design-systems", ["product"]],
  ["frontend", ["product"]],
]);

const projectTypeDirections = new Map<string, readonly CatalogDirectionId[]>([
  ["shooting", ["photo"]],
  ["music-shooting", ["photo"]],
  ["lookbook", ["photo"]],
  ["catalog", ["photo"]],
  ["campaign-shooting", ["photo"]],
  ["editorial", ["photo"]],
  ["product-shooting", ["photo"]],
  ["fashion-shooting", ["photo"]],
  ["portrait-shooting", ["photo"]],
  ["cover-shooting", ["photo"]],
  ["backstage", ["production"]],
  ["content-production", ["production"]],
  ["advertorial", ["production"]],
  ["graphic-design-project", ["graphic"]],
  ["identity-project", ["identity"]],
  ["print-project", ["graphic"]],
  ["packaging-project", ["graphic"]],
  ["poster-project", ["graphic"]],
  ["social-content", ["graphic"]],
  ["motion-project", ["motion"]],
  ["animation", ["motion"]],
  ["interface-animation", ["motion"]],
  ["video-project", ["motion"]],
  ["3d-project", ["3d"]],
  ["3d-animation", ["motion", "3d"]],
  ["scanography-project", ["photo", "graphic"]],
  ["book-project", ["graphic"]],
  ["book-design", ["graphic"]],
]);

const deliverableDirections = new Map<string, readonly CatalogDirectionId[]>([
  ["identity-system", ["identity"]],
  ["logo", ["identity"]],
  ["brandbook", ["identity"]],
  ["brand-assets", ["identity"]],
  ["design-assets", ["graphic"]],
  ["business-card", ["graphic"]],
  ["banner", ["graphic"]],
  ["advertising-banner", ["graphic"]],
  ["social-post", ["graphic"]],
  ["social-media-assets", ["graphic"]],
  ["advertising-creative", ["graphic"]],
  ["cover", ["graphic"]],
  ["certificate", ["graphic"]],
  ["poster", ["graphic"]],
  ["sticker", ["graphic"]],
  ["booklet", ["graphic"]],
  ["t-shirt", ["graphic"]],
  ["print-materials", ["graphic"]],
  ["packaging", ["graphic"]],
  ["merch", ["graphic"]],
  ["campaign-assets", ["graphic"]],
  ["product-photography", ["photo"]],
  ["catalog", ["photo"]],
  ["lookbook", ["photo"]],
  ["website", ["product"]],
  ["landing-page", ["product"]],
  ["ui-kit", ["product"]],
  ["wireframe", ["product"]],
  ["prototype", ["product"]],
  ["screen-mockup", ["product"]],
  ["music-cover", ["graphic"]],
  ["book", ["graphic"]],
]);

function assertKnownIds(
  values: readonly string[],
  known: ReadonlySet<string>,
  label: string,
): void {
  for (const value of values) {
    if (!known.has(value)) {
      throw new Error(`Public Catalog taxonomy contains unknown ${label} "${value}"`);
    }
  }
}

export function catalogDirectionIdsForTaxonomy(
  input: CatalogTaxonomyInput,
): readonly CatalogDirectionId[] {
  assertKnownIds(input.workAreaIds, knownWorkAreaIds, "work area");
  assertKnownIds(input.projectTypeIds, knownProjectTypeIds, "project type");
  assertKnownIds(input.deliverableIds, knownDeliverableIds, "deliverable");

  const selected = new Set<CatalogDirectionId>();
  for (const id of input.workAreaIds) {
    for (const direction of workAreaDirections.get(id) ?? []) selected.add(direction);
  }
  for (const id of input.projectTypeIds) {
    for (const direction of projectTypeDirections.get(id) ?? []) selected.add(direction);
  }
  for (const id of input.deliverableIds) {
    for (const direction of deliverableDirections.get(id) ?? []) selected.add(direction);
  }

  return catalogDirections
    .map(({ id }) => id)
    .filter((id) => selected.has(id));
}

export interface CatalogItem {
  id: string;
  asset: MediaCatalogItem["asset"];
  title: string;
  alt: string;
  date: string;
  directions: readonly CatalogDirectionId[];
  projectIds: MediaCatalogItem["projectIds"];
  tags: readonly string[];
  credits: readonly string[];
  year?: number;
  rating?: MediaCatalogItem["asset"]["rating"];
  width?: number;
  height?: number;
  aspectRatio?: number;
  posterSrc?: string;
  durationSeconds?: number;
  mimeType?: string;
  byteLength?: number;
}

export function isPublicCatalogItem(item: MediaCatalogItem): boolean {
  return item.showInCatalog && !item.archived;
}

function yearFromDate(date: string): number | undefined {
  const match = date.match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : undefined;
}

export function toCatalogItem(item: MediaCatalogItem): CatalogItem {
  const width = item.asset.width;
  const height = item.asset.height;
  const year = yearFromDate(item.date);
  const aspectRatio = width && height && width > 0 && height > 0
    ? width / height
    : undefined;

  return {
    id: item.asset.id,
    asset: item.asset,
    title: item.title,
    alt: item.alt,
    date: item.date,
    directions: catalogDirectionIdsForTaxonomy(item),
    projectIds: item.projectIds,
    tags: item.tags,
    credits: item.credits,
    ...(year !== undefined ? { year } : {}),
    ...(item.asset.rating !== undefined ? { rating: item.asset.rating } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
    ...(item.posterSrc !== undefined ? { posterSrc: item.posterSrc } : {}),
    ...(item.durationSeconds !== undefined ? { durationSeconds: item.durationSeconds } : {}),
    ...(item.mimeType !== undefined ? { mimeType: item.mimeType } : {}),
    ...(item.byteLength !== undefined ? { byteLength: item.byteLength } : {}),
  };
}

export function getPublicCatalogItems(
  items: readonly MediaCatalogItem[] = mediaCatalogItems,
): readonly CatalogItem[] {
  return items.filter(isPublicCatalogItem).map(toCatalogItem);
}
