import type { MediaEntryId } from "../../data/media/index.ts";
import type { AnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type { BeforeAfterData } from "../../types/before-after.ts";
import type { JesteiThemeOrganismMockupData } from "../../types/jestei-theme-organism.ts";
import type { JustifiedGalleryData } from "../../types/justified-gallery.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaFigureData, MockupData } from "../../types/media-presentation.ts";
import type { MediaSliderData } from "../../types/media-slider.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";
import type { PageFlipData } from "../../types/page-flip.ts";

export const CONTENT_BLOCK_TYPES = [
  "media-figure",
  "media-group",
  "media-slider",
  "mockup",
  "mockup-deck",
  "justified-gallery",
  "before-after",
  "page-flip",
  "animated-canvas-gallery",
  "jestei-theme",
  "awful-cases-game",
] as const;

export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

export interface MediaFigureBlockPresentation {
  mediaDimensions?: boolean;
}

export interface MediaFigureBlock {
  type: "media-figure";
  data: MediaFigureData<MediaEntryId>;
  presentation?: MediaFigureBlockPresentation;
}

export interface MediaGroupBlock {
  type: "media-group";
  data: MediaGroupData<MediaEntryId>;
}

export interface MediaSliderBlock {
  type: "media-slider";
  data: MediaSliderData<MediaEntryId>;
}

export interface MockupBlock {
  type: "mockup";
  data: MockupData<MediaEntryId>;
}

export interface MockupDeckBlock {
  type: "mockup-deck";
  data: MockupDeckData<MediaEntryId>;
}

export interface JustifiedGalleryBlock {
  type: "justified-gallery";
  data: JustifiedGalleryData<MediaEntryId>;
}

export interface BeforeAfterBlock {
  type: "before-after";
  data: BeforeAfterData<MediaEntryId>;
}

export interface PageFlipBlock {
  type: "page-flip";
  data: PageFlipData<MediaEntryId>;
}

export interface AnimatedCanvasGalleryBlock {
  type: "animated-canvas-gallery";
  data: AnimatedCanvasGalleryData<MediaEntryId>;
}

export interface JesteiThemeBlock {
  type: "jestei-theme";
  data: JesteiThemeOrganismMockupData<MediaEntryId>;
}

export interface AwfulCasesGameBlock {
  type: "awful-cases-game";
}

export type ContentBlock =
  | MediaFigureBlock
  | MediaGroupBlock
  | MediaSliderBlock
  | MockupBlock
  | MockupDeckBlock
  | JustifiedGalleryBlock
  | BeforeAfterBlock
  | PageFlipBlock
  | AnimatedCanvasGalleryBlock
  | JesteiThemeBlock
  | AwfulCasesGameBlock;

export function assertNeverContentBlock(value: never): never {
  throw new Error(`Unhandled ContentBlock: ${JSON.stringify(value)}`);
}
