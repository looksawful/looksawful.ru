import type { MediaEntryData } from "../../types/media.ts";
import type { ProjectId } from "../catalog/projects/index.ts";

/**
 * Resolves project membership for one contextual media usage.
 *
 * Project membership belongs to MediaEntry/usage semantics. MediaAsset and
 * catalog metadata are never consulted here. An explicit empty array remains
 * authoritative and means the usage is intentionally unassigned.
 */
export function resolveAssignedProjectIds(
  entry: Pick<MediaEntryData<string, string>, "assetId" | "projectIds">,
): readonly ProjectId[] | undefined {
  return entry.projectIds as readonly ProjectId[] | undefined;
}
