import type { MediaUsageMetadata } from "../../types/media.ts";
import { projects, type ProjectId } from "../catalog/projects/index.ts";
import {
  MEDIA_CATALOG_DELIVERABLE_IDS,
  MEDIA_CATALOG_PROJECT_TYPE_IDS,
  MEDIA_CATALOG_WORK_AREA_IDS,
  type MediaCatalogDeliverableId,
  type MediaCatalogProjectTypeId,
  type MediaCatalogWorkAreaId,
} from "../taxonomy/media-taxonomy.ts";

import usageChunk1 from "../../content/media-usages/dedupe-context-1.json" with { type: "json" };
import usageChunk2 from "../../content/media-usages/dedupe-context-2.json" with { type: "json" };
import usageChunk3 from "../../content/media-usages/dedupe-context-3.json" with { type: "json" };
import usageChunk4 from "../../content/media-usages/dedupe-context-4.json" with { type: "json" };

export type DedupeMediaUsageMetadata = MediaUsageMetadata<
  ProjectId,
  MediaCatalogWorkAreaId,
  MediaCatalogProjectTypeId,
  MediaCatalogDeliverableId
>;

export interface DedupeMediaUsageRecord extends DedupeMediaUsageMetadata {
  entryId: string;
  evidenceComponentId: number;
  fromAssetId: string;
  toAssetId: string;
}

const PROJECT_IDS = new Set<string>(projects.map(({ id }) => id));
const WORK_AREA_IDS = new Set<string>(MEDIA_CATALOG_WORK_AREA_IDS);
const PROJECT_TYPE_IDS = new Set<string>(MEDIA_CATALOG_PROJECT_TYPE_IDS);
const DELIVERABLE_IDS = new Set<string>(MEDIA_CATALOG_DELIVERABLE_IDS);

const AUDIT_KEYS = [
  "entryId",
  "evidenceComponentId",
  "fromAssetId",
  "toAssetId",
] as const;

const METADATA_KEYS = [
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
] as const;

const ALLOWED_KEYS = new Set<string>([...AUDIT_KEYS, ...METADATA_KEYS]);

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function expectOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`);
  return value;
}

function expectPositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return value as number;
}

function expectUniqueStringArray(value: unknown, label: string): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);

  const values = value.map((item, index) => expectString(item, `${label}[${index}]`));
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must not contain duplicates`);
  }
  return values;
}

function expectKnownIds<Id extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
): readonly Id[] | undefined {
  const values = expectUniqueStringArray(value, label);
  if (values === undefined) return undefined;
  for (const id of values) {
    if (!allowed.has(id)) throw new Error(`${label} contains unknown id "${id}"`);
  }
  return values as readonly Id[];
}

function parseRecord(value: unknown, index: number): DedupeMediaUsageRecord {
  const label = `Dedupe media usage record ${index}`;
  const record = expectObject(value, label);

  for (const key of Object.keys(record)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }

  const fromAssetId = expectString(record.fromAssetId, `${label}.fromAssetId`);
  const toAssetId = expectString(record.toAssetId, `${label}.toAssetId`);
  if (fromAssetId === toAssetId) {
    throw new Error(`${label} must map different source and canonical asset ids`);
  }

  const metadata: DedupeMediaUsageMetadata = {
    ...(record.title !== undefined
      ? { title: expectOptionalString(record.title, `${label}.title`) }
      : {}),
    ...(record.alt !== undefined ? { alt: expectOptionalString(record.alt, `${label}.alt`) } : {}),
    ...(record.description !== undefined
      ? { description: expectOptionalString(record.description, `${label}.description`) }
      : {}),
    ...(record.date !== undefined
      ? { date: expectOptionalString(record.date, `${label}.date`) }
      : {}),
    ...(record.projectIds !== undefined
      ? { projectIds: expectKnownIds<ProjectId>(record.projectIds, PROJECT_IDS, `${label}.projectIds`) }
      : {}),
    ...(record.workAreaIds !== undefined
      ? {
          workAreaIds: expectKnownIds<MediaCatalogWorkAreaId>(
            record.workAreaIds,
            WORK_AREA_IDS,
            `${label}.workAreaIds`,
          ),
        }
      : {}),
    ...(record.projectTypeIds !== undefined
      ? {
          projectTypeIds: expectKnownIds<MediaCatalogProjectTypeId>(
            record.projectTypeIds,
            PROJECT_TYPE_IDS,
            `${label}.projectTypeIds`,
          ),
        }
      : {}),
    ...(record.deliverableIds !== undefined
      ? {
          deliverableIds: expectKnownIds<MediaCatalogDeliverableId>(
            record.deliverableIds,
            DELIVERABLE_IDS,
            `${label}.deliverableIds`,
          ),
        }
      : {}),
    ...(record.tags !== undefined
      ? { tags: expectUniqueStringArray(record.tags, `${label}.tags`) }
      : {}),
    ...(record.credits !== undefined
      ? { credits: expectUniqueStringArray(record.credits, `${label}.credits`) }
      : {}),
  };

  return {
    entryId: expectString(record.entryId, `${label}.entryId`),
    evidenceComponentId: expectPositiveInteger(
      record.evidenceComponentId,
      `${label}.evidenceComponentId`,
    ),
    fromAssetId,
    toAssetId,
    ...metadata,
  };
}

export function parseDedupeMediaUsageRecords(value: unknown): readonly DedupeMediaUsageRecord[] {
  if (!Array.isArray(value)) throw new TypeError("Dedupe media usage records must be an array");

  const records = value.map(parseRecord);
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.entryId)) {
      throw new Error(`Dedupe media usage records contain duplicate entryId "${record.entryId}"`);
    }
    seen.add(record.entryId);
  }
  return records;
}

function usageMetadataFor(record: DedupeMediaUsageRecord): DedupeMediaUsageMetadata {
  const metadata: DedupeMediaUsageMetadata = {};
  for (const key of METADATA_KEYS) {
    const value = record[key];
    if (value !== undefined) Object.assign(metadata, { [key]: value });
  }
  return metadata;
}

const rawUsageRecords: unknown[] = [
  ...usageChunk1,
  ...usageChunk2,
  ...usageChunk3,
  ...usageChunk4,
];

export const dedupeMediaUsageRecords = parseDedupeMediaUsageRecords(rawUsageRecords);

export const mediaUsageMetadataByEntryId = new Map<string, DedupeMediaUsageMetadata>(
  dedupeMediaUsageRecords.map((record) => [record.entryId, usageMetadataFor(record)] as const),
);

export const dedupeUsageEvidenceByEntryId = new Map<string, DedupeMediaUsageRecord>(
  dedupeMediaUsageRecords.map((record) => [record.entryId, record] as const),
);
