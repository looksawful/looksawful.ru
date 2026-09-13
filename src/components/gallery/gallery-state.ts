import {
  DEFAULT_GALLERY_LAYER,
  isGalleryLayer,
  type GalleryLayer,
} from "../../data/media/gallery.ts";

export interface GalleryState {
  layer: GalleryLayer;
  itemId: string | null;
}

function normalizeItemId(value: string | null): string | null {
  const itemId = value?.trim();
  return itemId ? itemId : null;
}

export function parseGallerySearch(search: string): GalleryState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const layerParam = params.get("layer");

  return {
    layer: isGalleryLayer(layerParam) ? layerParam : DEFAULT_GALLERY_LAYER,
    itemId: normalizeItemId(params.get("item")),
  };
}

export function serializeGalleryState(state: GalleryState): string {
  const params = new URLSearchParams();

  if (state.layer !== DEFAULT_GALLERY_LAYER) {
    params.set("layer", state.layer);
  }

  const itemId = normalizeItemId(state.itemId);
  if (itemId) params.set("item", itemId);

  const value = params.toString();
  return value ? `?${value}` : "";
}
