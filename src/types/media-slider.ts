import type {
  MediaCaptionView,
  MediaLoading,
  MediaVideoOptions,
} from "./media-presentation.ts";

export type MediaDeckAutoplay = "off" | "forward" | "ping-pong";

export interface MediaSliderSlideData<EntryId extends string = string> {
  entryId: EntryId;

  captionView: MediaCaptionView;

  loading?: MediaLoading;

  mediaClassName?: string;

  video?: MediaVideoOptions;
}

export interface MediaSliderData<EntryId extends string = string> {
  captionView: MediaCaptionView;

  /**
   * Preserve whether the legacy slider authored intrinsic width/height
   * attributes on slide media. Defaults to true.
   */
  mediaDimensions?: boolean;

  className?: string;

  slides: readonly MediaSliderSlideData<EntryId>[];

  interval?: number;

  autoplay?: MediaDeckAutoplay;

  advanceOnEnded?: boolean;
}
