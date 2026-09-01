import type { MediaEntryData } from "../../types/media.ts";
import type { ProjectId } from "../catalog/projects/index.ts";
import { mediaCatalogItems } from "./catalog.ts";

const projectIdsByAssetId = new Map<string, readonly ProjectId[]>(
  mediaCatalogItems.map((item) => [item.asset.id, item.projectIds] as const),
);

/**
 * Resolves the canonical media→Project relation from catalog metadata.
 * Entry-level projectIds are accepted only for explicit transient/tool fixtures;
 * production MediaEntry records are normalized from MediaCatalogMetadata.
 */
export function resolveAssignedProjectIds(
  entry: Pick<MediaEntryData<string, string>, "assetId" | "projectIds">,
): readonly ProjectId[] | undefined {
  if (entry.projectIds?.length) {
    return entry.projectIds as readonly ProjectId[];
  }

  const projectIds = projectIdsByAssetId.get(entry.assetId);
  return projectIds?.length ? projectIds : undefined;
}
