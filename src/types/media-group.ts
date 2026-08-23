import type {
  EmbeddedMediaDeckData,
  MediaCaptionField,
  MediaCaptionView,
  MediaLoading,
  MediaSurfaceEntryData,
  MediaSurfaceLayout,
  MediaSurfaceOverlayData,
  MediaSurfacePresentation,
  MediaVideoOptions,
} from "./media-presentation.ts";

/* ==================================================
   Shared content
   ================================================== */

export interface MediaGroupLinkData {
  label: string;
  href: string;

  target?: "_blank";
  rel?: string;
}

export interface MediaGroupCreditsData {
  title?: string;

  lines?: readonly string[];
}

export interface MediaGroupNoteData {
  kind: "editorial" | "group";

  text: string;

  link?: MediaGroupLinkData;
}

export interface MediaGroupHeadData {
  className?: string;
  style?: string;

  credits?: MediaGroupCreditsData;

  note?: MediaGroupNoteData;
}

/* ==================================================
   Shared item
   ================================================== */

export interface MediaGroupItemBase<EntryId extends string = string> {
  entryId: EntryId;

  /**
   * Optional override.
   *
   * If omitted, the item inherits
   * captionView from its group.
   */
  captionView?: MediaCaptionView;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;
  surfaceClassName?: string;
  captionClassName?: string;

  captionFields?: readonly MediaCaptionField[];

  surface?: MediaSurfacePresentation;

  surfaceLayout?: MediaSurfaceLayout;

  surfaceEntries?: readonly MediaSurfaceEntryData<EntryId>[];

  surfaceDeck?: EmbeddedMediaDeckData<EntryId>;

  surfaceOverlay?: MediaSurfaceOverlayData;

  lightbox?: boolean;

  video?: MediaVideoOptions;
}

/* ==================================================
   Shared group
   ================================================== */

interface MediaGroupBase {
  captionView: MediaCaptionView;

  element?: "section" | "div";

  className?: string;

  ariaLabelledBy?: string;

  head?: MediaGroupHeadData;
}

/* ==================================================
   Grid
   ================================================== */

export interface GridMediaGroupItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {
  /**
   * In the existing plain-grid CSS,
   * wide means "span the complete row".
   */
  role?: "wide";
}

/**
 * Ordinary responsive grid.
 */
export interface PlainGridMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "grid";

  mode?: "plain";

  items: readonly GridMediaGroupItemData<EntryId>[];

  columns?: number;
  mobileColumns?: number;
}

/**
 * A grid represented as a horizontal rail
 * at every container width.
 */
export interface OverflowReelGridMediaGroupData<
  EntryId extends string = string,
> extends MediaGroupBase {
  layout: "grid";

  mode: "overflow-reel";

  items: readonly GridMediaGroupItemData<EntryId>[];

  mobileRows?: number;

  reelHeight?: string;
}

/**
 * Horizontal reel in compact containers,
 * authored grid in wide containers.
 */
export interface CompactReelGridMediaGroupData<
  EntryId extends string = string,
> extends MediaGroupBase {
  layout: "grid";

  mode: "compact-reel";

  items: readonly GridMediaGroupItemData<EntryId>[];

  columns?: number;

  compactItemSize?: string;

  compactItemInlineSize?: string;

  compactAlign?: "stretch" | "flex-start" | "center" | "flex-end";

  wideItemInlineSize?: string;
}

export type GridMediaGroupData<EntryId extends string = string> =
  | PlainGridMediaGroupData<EntryId>
  | OverflowReelGridMediaGroupData<EntryId>
  | CompactReelGridMediaGroupData<EntryId>;

/* ==================================================
   Strip
   ================================================== */

export interface StripMediaGroupItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {}

export interface InfiniteReelData {
  duration?: string;
}

export interface StripMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "strip";

  items: readonly StripMediaGroupItemData<EntryId>[];

  height?: string;

  infiniteReel?: InfiniteReelData;
}

/* ==================================================
   Masonry
   ================================================== */

export interface MasonryMediaGroupItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {}

export interface MasonryMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "masonry";

  items: readonly MasonryMediaGroupItemData<EntryId>[];

  columns?: number;

  mobileColumns?: number;
}

/* ==================================================
   Bento
   ================================================== */

export interface BentoMediaGroupItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {
  colSpan?: number;
  rowSpan?: number;
}

export interface BentoMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "bento";

  items: readonly BentoMediaGroupItemData<EntryId>[];

  rows?: number;
  columns?: number;

  cellSize?: string;
  height?: string;
}

/* ==================================================
   Editorial
   ================================================== */

/**
 * Editorial is deliberately separate from grid.
 *
 * --start and --span belong to this layout
 * in the existing CSS.
 */
export interface EditorialMediaGroupItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {
  role?: "wide";

  start?: number;
  span?: number;
}

export interface EditorialMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "editorial";

  items: readonly EditorialMediaGroupItemData<EntryId>[];
}

/* ==================================================
   Sequence
   ================================================== */

export interface SequenceWideMediaItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {}

export interface SequenceMiddleMediaItemData<
  EntryId extends string = string,
> extends MediaGroupItemBase<EntryId> {}

export interface SequenceMediaGroupData<EntryId extends string = string> extends MediaGroupBase {
  layout: "sequence";

  /**
   * Actual DOM contract:
   *
   * wide
   * middle[]
   * wide
   */
  leading: SequenceWideMediaItemData<EntryId>;

  middle: readonly SequenceMiddleMediaItemData<EntryId>[];

  trailing: SequenceWideMediaItemData<EntryId>;

  columns?: number;

  mobileRows?: number;

  ratio?: string;

  middleOverflow?: "reel";
}

/* ==================================================
   Complete union
   ================================================== */

export type MediaGroupData<EntryId extends string = string> =
  | GridMediaGroupData<EntryId>
  | StripMediaGroupData<EntryId>
  | MasonryMediaGroupData<EntryId>
  | BentoMediaGroupData<EntryId>
  | EditorialMediaGroupData<EntryId>
  | SequenceMediaGroupData<EntryId>;
