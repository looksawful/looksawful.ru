export type MediaLoading = "eager" | "lazy";

export type MediaCaptionView = "full" | "summary" | "overlay" | "lightbox-only";

/** `index` is a legacy authored selector retained for compatibility; renderers ignore it. */
export type MediaCaptionField = "index" | "title" | "text" | "meta";

export type MediaPresentation = "banner";

export type MediaPreload = "none" | "metadata" | "auto";

export type MediaFit = "cover" | "contain";

export interface MediaVideoOptions {
  autoplay?: boolean;
  autoplayWhenMotionAllowed?: boolean;
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
  fit?: MediaFit;
  position?: string;
  ratio?: string;
}

export interface MediaFigurePresentationOptions {
  surface?: MediaSurfacePresentation;
  captionView?: MediaCaptionView;
}

export interface MediaVideoPresentationOptions {
  video?: MediaVideoOptions;
}

export interface MediaElementOptions extends MediaVideoPresentationOptions {
  className?: string;
  dimensions?: boolean;
  loading?: MediaLoading;
}
