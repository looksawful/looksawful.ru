import type {
  MediaCatalogMetadata,
  MediaUsageMetadata,
} from "../../types/media.ts";

export type ResolvedMediaUsageMetadata<
  ProjectId extends string = string,
  WorkAreaId extends string = string,
  ProjectTypeId extends string = string,
  DeliverableId extends string = string,
> = Omit<
  MediaCatalogMetadata<ProjectId, WorkAreaId, ProjectTypeId, DeliverableId>,
  "reusable" | "archived"
>;

/**
 * Resolves contextual usage metadata during the normalization migration.
 * Only `undefined` falls back to catalog defaults. Empty strings and arrays are
 * explicit values and therefore survive unchanged.
 */
export function resolveMediaUsageMetadata<
  ProjectId extends string = string,
  WorkAreaId extends string = string,
  ProjectTypeId extends string = string,
  DeliverableId extends string = string,
>(
  usage: MediaUsageMetadata<ProjectId, WorkAreaId, ProjectTypeId, DeliverableId>,
  catalog: MediaCatalogMetadata<ProjectId, WorkAreaId, ProjectTypeId, DeliverableId>,
): ResolvedMediaUsageMetadata<ProjectId, WorkAreaId, ProjectTypeId, DeliverableId> {
  return {
    title: usage.title !== undefined ? usage.title : catalog.title,
    alt: usage.alt !== undefined ? usage.alt : catalog.alt,
    description: usage.description !== undefined ? usage.description : catalog.description,
    date: usage.date !== undefined ? usage.date : catalog.date,
    projectIds: usage.projectIds !== undefined ? usage.projectIds : catalog.projectIds,
    workAreaIds: usage.workAreaIds !== undefined ? usage.workAreaIds : catalog.workAreaIds,
    projectTypeIds:
      usage.projectTypeIds !== undefined ? usage.projectTypeIds : catalog.projectTypeIds,
    deliverableIds:
      usage.deliverableIds !== undefined ? usage.deliverableIds : catalog.deliverableIds,
    tags: usage.tags !== undefined ? usage.tags : catalog.tags,
    credits: usage.credits !== undefined ? usage.credits : catalog.credits,
  };
}
