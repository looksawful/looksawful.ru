import type { MediaCaptionView, MediaLoading } from "./media-presentation.ts";

export interface BeforeAfterSideData<EntryId extends string = string> {
  entryId: EntryId;
  loading?: MediaLoading;
  label: string;
}

export interface BeforeAfterCaptionData {
  index?: number;
  title: string;
  text?: string;
}

export interface BeforeAfterData<EntryId extends string = string> {
  captionView: MediaCaptionView;
  before: BeforeAfterSideData<EntryId>;
  after: BeforeAfterSideData<EntryId>;
  caption: BeforeAfterCaptionData;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
}
