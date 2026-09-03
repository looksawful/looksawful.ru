declare module "photoswipe-dynamic-caption-plugin" {
  import type PhotoSwipeLightbox from "photoswipe/lightbox";
  import type { SlideData } from "photoswipe";

  export type PhotoSwipeDynamicCaptionSlide = {
    data: SlideData;
  };

  export type PhotoSwipeDynamicCaptionOptions = {
    captionContent?:
      | string
      | ((
          slide: PhotoSwipeDynamicCaptionSlide,
        ) =>
          | string
          | HTMLElement
          | false
          | null
          | undefined);
    type?: "auto" | "below" | "aside";
    mobileLayoutBreakpoint?:
      | number
      | ((...args: unknown[]) => boolean);
    horizontalEdgeThreshold?: number;
    mobileCaptionOverlapRatio?: number;
    verticallyCenterImage?: boolean;
  };

  export default class PhotoSwipeDynamicCaption {
    constructor(
      lightbox: PhotoSwipeLightbox,
      options?: PhotoSwipeDynamicCaptionOptions,
    );
  }
}
