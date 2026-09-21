export interface GalleryState {
  itemId: string | null;
  slide: number | null;
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

function normalizeSlide(value: string | number | null | undefined): number | null {
  const slide = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value)
      : Number.NaN;
  return Number.isInteger(slide) && slide >= 1 ? slide : null;
}

export function parseGallerySearch(search: string): GalleryState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const itemId = normalizeItemId(params.get("item"));
  return {
    itemId,
    slide: itemId ? normalizeSlide(params.get("slide")) : null,
  };
}

export function serializeGalleryState(state: GalleryState): string {
  const params = new URLSearchParams();
  const itemId = normalizeItemId(state.itemId);
  if (itemId) {
    params.set("item", itemId);
    const slide = normalizeSlide(state.slide);
    if (slide) params.set("slide", String(slide));
  }

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
