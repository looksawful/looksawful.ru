import type {
  ImageMedia,
  MediaAsset,
  MediaCatalogItemData,
  MediaCatalogMetadata,
  VideoMedia,
} from "../../types/media.ts";
import { projects, type ProjectId } from "../catalog/projects/index.ts";
import {
  MEDIA_CATALOG_DELIVERABLE_IDS,
  MEDIA_CATALOG_PROJECT_TYPE_IDS,
  MEDIA_CATALOG_WORK_AREA_IDS,
  type MediaCatalogDeliverableId,
  type MediaCatalogProjectTypeId,
  type MediaCatalogWorkAreaId,
} from "../taxonomy/media-taxonomy.ts";
import { registeredMediaAssets } from "./assets/registered.ts";
import {
  registeredMediaCatalogSources,
  uploadedMediaCatalogSources,
} from "./catalog-records.generated.ts";

const REGISTERED_COMPACT_KEYS = [
  "id",
  "title",
  "alt",
  "description",
  "date",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "reusable",
  "archived",
] as const;

const REGISTERED_LEGACY_KEYS = [
  "id",
  "mediaType",
  "src",
  "sourceSrc",
  "width",
  "height",
  "durationSeconds",
  "mimeType",
  "byteLength",
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "reusable",
  "archived",
] as const;

const UPLOADED_KEYS = [
  "id",
  "mediaType",
  "src",
  "deliverySrc",
  "posterSrc",
  "width",
  "height",
  "durationSeconds",
  "mimeType",
  "byteLength",
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "reusable",
  "archived",
] as const;

const OPTIONAL_METADATA_KEYS = ["showInCatalog"] as const;

const projectIdSet = new Set<string>(projects.map(({ id }) => id));
const workAreaIdSet = new Set<string>(MEDIA_CATALOG_WORK_AREA_IDS);
const projectTypeIdSet = new Set<string>(MEDIA_CATALOG_PROJECT_TYPE_IDS);
const deliverableIdSet = new Set<string>(MEDIA_CATALOG_DELIVERABLE_IDS);

export type CmsMediaAssetId = `cms-${string}`;

export type MediaCatalogMetadataRecord = MediaCatalogMetadata<
  ProjectId,
  MediaCatalogWorkAreaId,
  MediaCatalogProjectTypeId,
  MediaCatalogDeliverableId
>;

/**
 * Normalized registered catalog metadata.
 *
 * The persisted compact source intentionally excludes technical MediaAsset
 * fields and project membership. Legacy sources are still accepted during the
 * migration and normalize into this shape.
 */
export interface RegisteredMediaCatalogRecord extends MediaCatalogMetadataRecord {
  id: string;
}

export interface UploadedMediaCatalogRecord extends MediaCatalogMetadataRecord {
  id: string;
  mediaType: "image" | "video";
  src: string;
  deliverySrc: string;
  posterSrc: string;
  width: number;
  height: number;
  durationSeconds: number;
  mimeType: string;
  byteLength: number;
}

export interface ParsedUploadedMediaCatalogRecord extends UploadedMediaCatalogRecord {
  asset: (ImageMedia | VideoMedia) & { id: CmsMediaAssetId };
}

export type MediaCatalogItem = MediaCatalogItemData<
  ProjectId,
  MediaCatalogWorkAreaId,
  MediaCatalogProjectTypeId,
  MediaCatalogDeliverableId
>;

export interface MediaCatalogFilters {
  mediaTypes?: readonly MediaAsset["type"][];
  projectIds?: readonly ProjectId[];
  workAreaIds?: readonly MediaCatalogWorkAreaId[];
  projectTypeIds?: readonly MediaCatalogProjectTypeId[];
  deliverableIds?: readonly MediaCatalogDeliverableId[];
  tags?: readonly string[];
  reusable?: boolean;
  archived?: boolean;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
  label: string,
  optional: readonly string[] = [],
): void {
  const allowed = new Set([...expected, ...optional]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }
  for (const key of expected) {
    if (!(key in record)) throw new Error(`${label} is missing field "${key}"`);
  }
}

function expectString(value: unknown, label: string, { empty = true } = {}): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`);
  if (!empty && value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  if (value.length > 0 && value.trim().length === 0) {
    throw new TypeError(`${label} must be empty or contain non-whitespace text`);
  }
  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  return value;
}

function expectNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite non-negative number`);
  }
  return value;
}

function expectUniqueStrings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const result = value.map((item, index) =>
    expectString(item, `${label}[${index}]`, { empty: false })
  );
  if (new Set(result).size !== result.length) {
    throw new Error(`${label} must not contain duplicates`);
  }
  return result;
}

function expectKnownIds<Id extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
): readonly Id[] {
  const values = expectUniqueStrings(value, label);
  for (const id of values) {
    if (!allowed.has(id)) throw new Error(`${label} contains unknown id "${id}"`);
  }
  return values as readonly Id[];
}

function parseMetadata(
  record: Record<string, unknown>,
  label: string,
  { projectIds = true } = {},
): MediaCatalogMetadataRecord {
  return {
    title: expectString(record.title, `${label}.title`, { empty: false }),
    alt: expectString(record.alt, `${label}.alt`),
    description: expectString(record.description, `${label}.description`),
    date: expectString(record.date, `${label}.date`),
    projectIds: projectIds
      ? expectKnownIds<ProjectId>(record.projectIds, projectIdSet, `${label}.projectIds`)
      : [],
    workAreaIds: expectKnownIds<MediaCatalogWorkAreaId>(
      record.workAreaIds,
      workAreaIdSet,
      `${label}.workAreaIds`,
    ),
    projectTypeIds: expectKnownIds<MediaCatalogProjectTypeId>(
      record.projectTypeIds,
      projectTypeIdSet,
      `${label}.projectTypeIds`,
    ),
    deliverableIds: expectKnownIds<MediaCatalogDeliverableId>(
      record.deliverableIds,
      deliverableIdSet,
      `${label}.deliverableIds`,
    ),
    tags: expectUniqueStrings(record.tags, `${label}.tags`),
    credits: expectUniqueStrings(record.credits, `${label}.credits`),
    showInCatalog: record.showInCatalog === undefined
      ? false
      : expectBoolean(record.showInCatalog, `${label}.showInCatalog`),
    reusable: expectBoolean(record.reusable, `${label}.reusable`),
    archived: expectBoolean(record.archived, `${label}.archived`),
  };
}

function expectMediaType(value: unknown, label: string): MediaAsset["type"] {
  if (value !== "image" && value !== "video" && value !== "model") {
    throw new TypeError(`${label} must be image, video or model`);
  }
  return value;
}

function expectCmsMediaType(value: unknown, label: string): "image" | "video" {
  if (value !== "image" && value !== "video") {
    throw new TypeError(`${label} must be image or video`);
  }
  return value;
}

function technicalValuesFor(asset: MediaAsset) {
  return {
    mediaType: asset.type,
    src: asset.src,
    sourceSrc: asset.type === "video" ? (asset.sourceSrc ?? "") : "",
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    mimeType: asset.type === "model" ? (asset.mimeType ?? "") : "",
    byteLength: asset.type === "model" ? (asset.byteLength ?? 0) : 0,
  } as const;
}

function validateLegacyRegisteredTechnicalFields(
  record: Record<string, unknown>,
  asset: MediaAsset,
  id: string,
): void {
  const technical = {
    mediaType: expectMediaType(record.mediaType, `Registered media catalog record "${id}".mediaType`),
    src: expectString(record.src, `Registered media catalog record "${id}".src`, { empty: false }),
    sourceSrc: expectString(record.sourceSrc, `Registered media catalog record "${id}".sourceSrc`),
    width: expectNonNegativeNumber(record.width, `Registered media catalog record "${id}".width`),
    height: expectNonNegativeNumber(record.height, `Registered media catalog record "${id}".height`),
    mimeType: expectString(record.mimeType, `Registered media catalog record "${id}".mimeType`),
    byteLength: expectNonNegativeNumber(
      record.byteLength,
      `Registered media catalog record "${id}".byteLength`,
    ),
  };
  expectNonNegativeNumber(
    record.durationSeconds,
    `Registered media catalog record "${id}".durationSeconds`,
  );

  const expected = technicalValuesFor(asset);
  for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
    if (technical[key] !== expected[key]) {
      throw new Error(`Registered media catalog record "${id}".${key} does not match MediaAsset`);
    }
  }
}

export function parseRegisteredMediaCatalogRecord(
  value: unknown,
  assets: readonly MediaAsset[] = registeredMediaAssets,
): RegisteredMediaCatalogRecord {
  const record = expectRecord(value, "Registered media catalog record");
  const legacy = "mediaType" in record || "src" in record || "projectIds" in record;
  expectExactKeys(
    record,
    legacy ? REGISTERED_LEGACY_KEYS : REGISTERED_COMPACT_KEYS,
    "Registered media catalog record",
    OPTIONAL_METADATA_KEYS,
  );
  const id = expectString(record.id, "Registered media catalog record.id", { empty: false });
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Registered media catalog record has unknown asset id "${id}"`);

  if (legacy) validateLegacyRegisteredTechnicalFields(record, asset, id);

  return {
    id,
    ...parseMetadata(
      record,
      `Registered media catalog record "${id}"`,
      { projectIds: legacy },
    ),
  };
}

function cmsAssetId(recordId: string): CmsMediaAssetId {
  return `cms-${recordId}`;
}

function assetFromUploadedRecord(
  record: UploadedMediaCatalogRecord,
): ParsedUploadedMediaCatalogRecord["asset"] {
  const base = {
    id: cmsAssetId(record.id),
    src: record.deliverySrc || record.src,
    ...(record.width > 0 ? { width: record.width } : {}),
    ...(record.height > 0 ? { height: record.height } : {}),
  } as const;

  return record.mediaType === "video"
    ? {
        ...base,
        type: "video",
        ...(record.deliverySrc ? { sourceSrc: record.src } : {}),
      }
    : { ...base, type: "image" };
}

export function parseUploadedMediaCatalogRecord(value: unknown): ParsedUploadedMediaCatalogRecord {
  const record = expectRecord(value, "Uploaded media catalog record");
  expectExactKeys(record, UPLOADED_KEYS, "Uploaded media catalog record", OPTIONAL_METADATA_KEYS);
  const id = expectString(record.id, "Uploaded media catalog record.id", { empty: false });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error(`Uploaded media catalog record has invalid UUID "${id}"`);
  }
  const mediaType = expectCmsMediaType(record.mediaType, `Uploaded media catalog record "${id}".mediaType`);
  const src = expectString(record.src, `Uploaded media catalog record "${id}".src`, { empty: false });
  if (!src.startsWith("/media/catalog/")) {
    throw new Error(`Uploaded media catalog record "${id}".src must use /media/catalog/`);
  }

  const parsed: UploadedMediaCatalogRecord = {
    id,
    mediaType,
    src,
    deliverySrc: expectString(record.deliverySrc, `Uploaded media catalog record "${id}".deliverySrc`),
    posterSrc: expectString(record.posterSrc, `Uploaded media catalog record "${id}".posterSrc`),
    width: expectNonNegativeNumber(record.width, `Uploaded media catalog record "${id}".width`),
    height: expectNonNegativeNumber(record.height, `Uploaded media catalog record "${id}".height`),
    durationSeconds: expectNonNegativeNumber(
      record.durationSeconds,
      `Uploaded media catalog record "${id}".durationSeconds`,
    ),
    mimeType: expectString(record.mimeType, `Uploaded media catalog record "${id}".mimeType`),
    byteLength: expectNonNegativeNumber(
      record.byteLength,
      `Uploaded media catalog record "${id}".byteLength`,
    ),
    ...parseMetadata(record, `Uploaded media catalog record "${id}"`),
  };
  if (mediaType === "image" && parsed.deliverySrc) {
    throw new Error(`Uploaded image record "${id}" must not define deliverySrc`);
  }

  return { ...parsed, asset: assetFromUploadedRecord(parsed) };
}

function normalizeCatalogRecords() {
  const registered = registeredMediaCatalogSources.map((source) =>
    parseRegisteredMediaCatalogRecord(source),
  );
  const uploaded = uploadedMediaCatalogSources.map((source) =>
    parseUploadedMediaCatalogRecord(source),
  );
  const registeredAssetById = new Map<string, MediaAsset>(
    registeredMediaAssets.map((asset) => [asset.id, asset]),
  );
  const ids = new Set<string>();
  const sources = new Set<string>();

  for (const record of registered) {
    if (ids.has(record.id)) throw new Error(`Media catalog contains duplicate asset id "${record.id}"`);
    ids.add(record.id);
    const src = registeredAssetById.get(record.id)?.src;
    if (!src) throw new Error(`Missing registered MediaAsset "${record.id}"`);
    if (sources.has(src)) throw new Error(`Media catalog contains duplicate src "${src}"`);
    sources.add(src);
  }
  for (const record of uploaded) {
    const assetId = record.asset.id;
    if (ids.has(assetId)) throw new Error(`Media catalog contains duplicate asset id "${assetId}"`);
    ids.add(assetId);
    if (sources.has(record.src)) throw new Error(`Media catalog contains duplicate src "${record.src}"`);
    sources.add(record.src);
  }
  return { registered, uploaded };
}

const normalizedRecords = normalizeCatalogRecords();

export const uploadedMediaAssets = normalizedRecords.uploaded.map(({ asset }) => asset) as readonly (
  (ImageMedia | VideoMedia) & { id: CmsMediaAssetId }
)[];

export const mediaCatalogItems: readonly MediaCatalogItem[] = [
  ...normalizedRecords.registered.map((record) => {
    const asset = registeredMediaAssets.find((candidate) => candidate.id === record.id);
    if (!asset) throw new Error(`Missing registered MediaAsset "${record.id}"`);
    const technical = technicalValuesFor(asset);
    return {
      origin: "registered" as const,
      asset,
      title: record.title,
      alt: record.alt,
      description: record.description,
      date: record.date,
      projectIds: record.projectIds,
      workAreaIds: record.workAreaIds,
      projectTypeIds: record.projectTypeIds,
      deliverableIds: record.deliverableIds,
      tags: record.tags,
      credits: record.credits,
      showInCatalog: record.showInCatalog,
      reusable: record.reusable,
      archived: record.archived,
      ...(technical.mimeType ? { mimeType: technical.mimeType } : {}),
      ...(technical.byteLength > 0 ? { byteLength: technical.byteLength } : {}),
    };
  }),
  ...normalizedRecords.uploaded.map((record) => ({
    origin: "cms" as const,
    asset: record.asset,
    title: record.title,
    alt: record.alt,
    description: record.description,
    date: record.date,
    projectIds: record.projectIds,
    workAreaIds: record.workAreaIds,
    projectTypeIds: record.projectTypeIds,
    deliverableIds: record.deliverableIds,
    tags: record.tags,
    credits: record.credits,
    showInCatalog: record.showInCatalog,
    reusable: record.reusable,
    archived: record.archived,
    ...(record.posterSrc ? { posterSrc: record.posterSrc } : {}),
    ...(record.durationSeconds > 0 ? { durationSeconds: record.durationSeconds } : {}),
    ...(record.mimeType ? { mimeType: record.mimeType } : {}),
    ...(record.byteLength > 0 ? { byteLength: record.byteLength } : {}),
  })),
];

const mediaCatalogItemByAssetId = new Map(
  mediaCatalogItems.map((item) => [item.asset.id, item] as const),
);

export function getMediaCatalogItem(assetId: string): MediaCatalogItem {
  const item = mediaCatalogItemByAssetId.get(assetId);
  if (!item) throw new Error(`Unknown media catalog asset: ${assetId}`);
  return item;
}

function includesAny(values: readonly string[], candidates: readonly string[] | undefined): boolean {
  return !candidates?.length || candidates.some((candidate) => values.includes(candidate));
}

function normalizeTag(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
}

export function findMediaCatalogItems(filters: MediaCatalogFilters = {}): readonly MediaCatalogItem[] {
  const requestedTags = filters.tags?.map(normalizeTag);
  return mediaCatalogItems.filter((item) => {
    if (filters.reusable !== undefined && item.reusable !== filters.reusable) return false;
    if (filters.archived !== undefined && item.archived !== filters.archived) return false;
    if (filters.mediaTypes?.length && !filters.mediaTypes.includes(item.asset.type)) return false;
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

export function registeredCatalogTechnicalValues(asset: MediaAsset) {
  return technicalValuesFor(asset);
}