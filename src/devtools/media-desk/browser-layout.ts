import type { MediaCatalogItem } from "../../data/media/catalog.ts";

const EDITORIAL_KEYS = [
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

type EditorialKey = (typeof EDITORIAL_KEYS)[number];

export type MediaDeskMetadataOverride = Partial<Pick<MediaCatalogItem, EditorialKey>>;

export function applyMediaDeskMetadata(
  item: MediaCatalogItem,
  metadata: MediaDeskMetadataOverride,
): MediaCatalogItem {
  const patch: Partial<Pick<MediaCatalogItem, EditorialKey>> = {};
  for (const key of EDITORIAL_KEYS) {
    if (key in metadata) {
      Object.assign(patch, { [key]: metadata[key] });
    }
  }
  return { ...item, ...patch };
}

export function idsBetween(
  ids: readonly string[],
  anchorId: string | null,
  targetId: string,
): readonly string[] {
  const targetIndex = ids.indexOf(targetId);
  if (targetIndex < 0) return [];
  const anchorIndex = anchorId ? ids.indexOf(anchorId) : -1;
  if (anchorIndex < 0) return [targetId];
  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return ids.slice(start, end + 1);
}
