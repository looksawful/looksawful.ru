import type { MediaLoading } from "./media-presentation.ts";

export interface PageFlipPageData<EntryId extends string = string> {
  entryId: EntryId;
  index: number;
  density?: "soft" | "hard";
  loading?: MediaLoading;
}

export interface PageFlipCreditsData {
  title: string;
  lines?: readonly string[];
}

export interface PageFlipData<EntryId extends string = string> {
  credits: PageFlipCreditsData;
  pages: readonly PageFlipPageData<EntryId>[];
  lightbox?: boolean;
}
