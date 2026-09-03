import type { MediaCatalogItem } from "../../data/media/catalog.ts";
import { pickMediaEditorialMetadata, type MediaEditorialPatch } from "./editor-model.ts";

export type BulkArrayField =
  | "projectIds"
  | "workAreaIds"
  | "projectTypeIds"
  | "deliverableIds"
  | "tags";

export type BulkArrayMode = "add" | "remove" | "set";

export interface BulkArrayEdit {
  field: BulkArrayField;
  mode: BulkArrayMode;
  values: readonly string[];
}

export interface BulkEditPlan {
  arrays: readonly BulkArrayEdit[];
  reusable?: boolean;
  archived?: boolean;
}

export interface BulkMetadataRequestItem {
  id: string;
  metadata: MediaEditorialPatch;
}

function clean(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function applyBulkArrayOperation(
  current: readonly string[],
  mode: BulkArrayMode,
  values: readonly string[],
): string[] {
  const base = clean(current);
  const next = clean(values);
  if (mode === "set") return next;
  if (mode === "remove") {
    const removed = new Set(next);
    return base.filter((value) => !removed.has(value));
  }
  return clean([...base, ...next]);
}

export function applyBulkEditorialPlan(
  current: MediaEditorialPatch,
  plan: BulkEditPlan,
): MediaEditorialPatch {
  const next: MediaEditorialPatch = {
    ...current,
    projectIds: [...current.projectIds],
    workAreaIds: [...current.workAreaIds],
    projectTypeIds: [...current.projectTypeIds],
    deliverableIds: [...current.deliverableIds],
    tags: [...current.tags],
    credits: [...current.credits],
  };

  for (const operation of plan.arrays) {
    const values = applyBulkArrayOperation(next[operation.field], operation.mode, operation.values);
    if (operation.field === "projectIds") {
      next.projectIds = values as MediaEditorialPatch["projectIds"];
    } else if (operation.field === "workAreaIds") {
      next.workAreaIds = values as MediaEditorialPatch["workAreaIds"];
    } else if (operation.field === "projectTypeIds") {
      next.projectTypeIds = values as MediaEditorialPatch["projectTypeIds"];
    } else if (operation.field === "deliverableIds") {
      next.deliverableIds = values as MediaEditorialPatch["deliverableIds"];
    } else {
      next.tags = values;
    }
  }
  if (plan.reusable !== undefined) next.reusable = plan.reusable;
  if (plan.archived !== undefined) next.archived = plan.archived;
  return next;
}

export function buildBulkMetadataRequest(
  items: readonly MediaCatalogItem[],
  plan: BulkEditPlan,
): BulkMetadataRequestItem[] {
  return items.map((item) => ({
    id: item.asset.id,
    metadata: applyBulkEditorialPlan(pickMediaEditorialMetadata(item), plan),
  }));
}
