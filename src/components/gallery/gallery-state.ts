export interface GalleryState {
  itemId: string | null;
}

export type GalleryViewerHistoryAction = "none" | "push" | "replace" | "back";
export type GalleryViewerHistoryCause = "viewer-change" | "viewer-close";

export interface GalleryViewerHistoryTransitionInput {
  currentItemId: string | null;
  nextItemId: string | null;
  ownsViewerEntry: boolean;
  cause: GalleryViewerHistoryCause;
}

export interface GalleryViewerHistoryTransition {
  action: GalleryViewerHistoryAction;
  ownsViewerEntry: boolean;
}

function normalizeItemId(value: string | null): string | null {
  const itemId = value?.trim();
  return itemId ? itemId : null;
}

export function parseGallerySearch(search: string): GalleryState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  return {
    itemId: normalizeItemId(params.get("item")),
  };
}

export function serializeGalleryState(state: GalleryState): string {
  const params = new URLSearchParams();
  const itemId = normalizeItemId(state.itemId);
  if (itemId) params.set("item", itemId);

  const value = params.toString();
  return value ? `?${value}` : "";
}

export function galleryViewerHistoryTransition({
  currentItemId,
  nextItemId,
  ownsViewerEntry,
  cause,
}: GalleryViewerHistoryTransitionInput): GalleryViewerHistoryTransition {
  const current = normalizeItemId(currentItemId);
  const next = normalizeItemId(nextItemId);

  if (current === next) {
    return { action: "none", ownsViewerEntry };
  }

  if (cause === "viewer-close") {
    return ownsViewerEntry
      ? { action: "back", ownsViewerEntry: false }
      : { action: "replace", ownsViewerEntry: false };
  }

  if (!current && next) {
    return { action: "push", ownsViewerEntry: true };
  }

  return { action: "replace", ownsViewerEntry };
}
