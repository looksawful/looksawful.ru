export interface ProductionCanvasGallerySourceData<EntryId extends string = string> {
  entryId: EntryId;
  sourceIndex?: number;
  mediaTitle?: string;
  mediaCredits?: string;
  fallbackSrc?: string;
}

export interface ProductionAnimatedCanvasGalleryData<EntryId extends string = string> {
  profile: "production";
  variant: "masonry";
  ariaLabel: string;
  className?: string;
  sources: readonly ProductionCanvasGallerySourceData<EntryId>[];
}

export interface MovesCanvasGalleryItemData<EntryId extends string = string> {
  entryId: EntryId;
  title?: string;
}

export type MovesCanvasGalleryVariant =
  | "arc"
  | "spiral"
  | "horizontal"
  | "diagonal"
  | "showcase-diagonal"
  | "masonry";

export interface MovesAnimatedCanvasGalleryData<EntryId extends string = string> {
  profile: "moves";
  variant: MovesCanvasGalleryVariant;
  id?: string;
  className?: string;
  items: readonly MovesCanvasGalleryItemData<EntryId>[];
}

export type AnimatedCanvasGalleryData<EntryId extends string = string> =
  | ProductionAnimatedCanvasGalleryData<EntryId>
  | MovesAnimatedCanvasGalleryData<EntryId>;
