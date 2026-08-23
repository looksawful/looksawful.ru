import type {
  MediaCaptionView,
  MediaFigureData,
} from "./media-presentation.ts";

export type JustifiedGalleryRowKind = "landscape" | "portrait" | "mixed";

export interface JustifiedGalleryItemData<EntryId extends string = string>
  extends Omit<MediaFigureData<EntryId>, "captionView"> {
  captionView?: MediaCaptionView;
}

export interface JustifiedGalleryRowData<EntryId extends string = string> {
  kind: JustifiedGalleryRowKind;

  items: readonly JustifiedGalleryItemData<EntryId>[];
}

export interface JustifiedGalleryData<EntryId extends string = string> {
  captionView: MediaCaptionView;

  className?: string;

  rows: readonly JustifiedGalleryRowData<EntryId>[];
}
