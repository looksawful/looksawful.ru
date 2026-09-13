export interface GalleryState {
  itemId: string | null;
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
