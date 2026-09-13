export const galleryLayers = ["photography", "production"] as const;

export type GalleryLayer = (typeof galleryLayers)[number];

export const DEFAULT_GALLERY_LAYER: GalleryLayer = "photography";

export function isGalleryLayer(value: string | null | undefined): value is GalleryLayer {
  return value === "photography" || value === "production";
}
