import type { MediaEntryData } from "../../types/media.ts";
import type { ProjectId } from "../catalog/projects/index.ts";
import { mediaCatalogItems } from "./catalog.ts";

const projectIdsByAssetId = new Map<string, readonly ProjectId[]>(
  mediaCatalogItems.map((item) => [item.asset.id, item.projectIds] as const),
);

/**
 * Resolves project membership for one media usage.
 *
 * Explicit entry-level values are authoritative, including an explicit empty
 * array. Catalog metadata remains only as a compatibility default for legacy
 * entries that do not yet carry their own project relation.
 */
export function resolveAssignedProjectIds(
  entry: Pick<MediaEntryData<string, string>, "assetId" | "projectIds">,
): readonly ProjectId[] | undefined {
  if (entry.projectIds !== undefined) {
    return entry.projectIds as readonly ProjectId[];
  }

  const projectIds = projectIdsByAssetId.get(entry.assetId);
  return projectIds?.length ? projectIds : undefined;
}
