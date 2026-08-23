import type { AnimatedCanvasGalleryData } from "./animated-canvas-gallery.ts";
import type {
  MediaCaptionView,
  MediaLoading,
  MockupDevice,
} from "./media-presentation.ts";
import type { MediaCaptionData } from "./media.ts";

export interface MockupDeckImageSlideData<EntryId extends string = string> {
  kind?: "image";
  entryId: EntryId;
  loading?: MediaLoading;
  mediaClassName?: string;
  mediaDimensions?: boolean;
  captionView?: MediaCaptionView;
  mediaTitle?: string;
  caption?: MediaCaptionData;
}

export interface MockupDeckCanvasSlideData<EntryId extends string = string> {
  kind: "canvas-gallery";
  gallery: AnimatedCanvasGalleryData<EntryId>;
  className?: string;
  ariaHidden?: boolean;
  captionView?: MediaCaptionView;
  caption?: MediaCaptionData;
}

export type MockupDeckSlideData<EntryId extends string = string> =
  | MockupDeckImageSlideData<EntryId>
  | MockupDeckCanvasSlideData<EntryId>;

interface MockupDeckBase<EntryId extends string = string> {
  captionView: MediaCaptionView;
  className?: string;
  interval?: number;
  slides: readonly MockupDeckSlideData<EntryId>[];
  controls?: boolean;
  captions?: "slides" | "empty" | false;
}

export interface StandardMockupDeckData<EntryId extends string = string>
  extends MockupDeckBase<EntryId> {
  variant: "standard";
  device: MockupDevice;
  role?: string;
  theme?: string;
  style?: string;
}

export interface MobileDeviceMockupDeckData<EntryId extends string = string>
  extends MockupDeckBase<EntryId> {
  variant: "mobile-device";
  slides: readonly MockupDeckImageSlideData<EntryId>[];
}

export type MockupDeckData<EntryId extends string = string> =
  | StandardMockupDeckData<EntryId>
  | MobileDeviceMockupDeckData<EntryId>;
