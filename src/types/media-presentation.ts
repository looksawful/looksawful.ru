export type MediaLoading = "eager" | "lazy";

export type MediaCaptionView = "full" | "summary" | "overlay" | "lightbox-only";

/** `index` is a legacy authored selector retained for compatibility; renderers ignore it. */
export type MediaCaptionField = "index" | "title" | "text" | "meta";

export type MediaPresentation = "banner";

export type MediaPreload = "none" | "metadata" | "auto";

export type MediaFit = "cover" | "contain";

export interface MediaVideoOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: MediaPreload;
  mimeType?: string;
}

/**
 * Presentation properties of the media surface.
 *
 * These become the existing CSS custom properties:
 *
 * --media-fit
 * --media-position
 *
 * TypeScript describes the authored value.
 * CSS still owns the actual layout.
 */
export interface MediaSurfacePresentation {
  /**
   * Disable the ordinary asset-dimension ratio when a special surface
   * owns its geometry entirely in CSS. Defaults to true.
   */
  deriveRatio?: boolean;

  /**
   * Optional authored surface ratio.
   *
   * Ordinary single-media figures derive the ratio from MediaAsset dimensions.
   * Compound or intentionally cropped surfaces can override that derived value.
   */
  ratio?: string;

  fit?: MediaFit;
  position?: string;
}

export type MediaSurfaceLayout = "pair" | "triptych";

export interface MediaSurfaceEntryData<EntryId extends string = string> {
  entryId: EntryId;

  loading?: MediaLoading;

  mediaClassName?: string;

  video?: MediaVideoOptions;
}

export interface MediaSurfaceOverlayData {
  className: string;
  text: string;
}

export type MediaDeckAutoplay = "off" | "forward" | "ping-pong";

export interface EmbeddedMediaDeckData<EntryId extends string = string> {
  className?: string;

  slides: readonly MediaSurfaceEntryData<EntryId>[];

  autoplay?: MediaDeckAutoplay;

  advanceOnEnded?: boolean;
}

export interface MediaCaptionPresentation {
  captionView: MediaCaptionView;
}

export interface MediaFigureData<EntryId extends string = string> extends MediaCaptionPresentation {
  entryId: EntryId;

  presentation?: MediaPresentation;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;
  surfaceClassName?: string;
  captionClassName?: string;

  captionFields?: readonly MediaCaptionField[];

  surface?: MediaSurfacePresentation;

  surfaceLayout?: MediaSurfaceLayout;

  surfaceEntries?: readonly MediaSurfaceEntryData<EntryId>[];

  surfaceOverlay?: MediaSurfaceOverlayData;

  surfaceDeck?: EmbeddedMediaDeckData<EntryId>;

  /**
   * false produces data-lightbox="off".
   *
   * true and undefined both mean that the ordinary
   * lightbox mechanism may handle this media.
   */
  lightbox?: boolean;

  video?: MediaVideoOptions;
}

export type MockupDevice = "desktop" | "mobile";

export interface MockupData<EntryId extends string = string> extends MediaCaptionPresentation {
  entryId: EntryId;

  device: MockupDevice;

  role?: string;
  theme?: string;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;

  video?: MediaVideoOptions;
}
