import type { ProjectId } from "../../data/catalog/projects/index.ts";
import type { MediaEntryId } from "../../data/media/index.ts";
import type { MovesAnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type {
  CreditsData,
  ResourceLinksData,
  SectionIntroData,
  SectionNoteData,
} from "../../types/content.ts";
import type { ContentBlock } from "./content-block.ts";
import type { SectionId } from "./ids.ts";

export const SECTION_TYPES = ["content", "project", "project-group", "specialized"] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type SectionLayout =
  | "stack"
  | "mockup-grid-reel"
  | "infinite-media-reel"
  | "split-always";
export type SectionMotion = "global-reveal" | "section-owned";
export type SectionSeparator = "before-blocks" | "between-blocks";
export type SectionNotePlacement = "before-blocks" | "after-blocks";

export interface SectionPresentation {
  layout?: SectionLayout;
  motion?: SectionMotion;
  separator?: SectionSeparator;
  notePlacement?: SectionNotePlacement;
}

export interface ContentSection {
  type: "content";
  id: SectionId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  note?: SectionNoteData;
  resources?: ResourceLinksData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectSection {
  type: "project";
  id: SectionId;
  projectId: ProjectId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  note?: SectionNoteData;
  resources?: ResourceLinksData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectPresentation {
  projectId: ProjectId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  note?: SectionNoteData;
  resources?: ResourceLinksData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectGroupSection {
  type: "project-group";
  id: SectionId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  note?: SectionNoteData;
  resources?: ResourceLinksData;
  items: readonly ProjectPresentation[];
}

/**
 * Closed specialized section contract for section-level runtime that cannot be
 * represented by an ordinary ContentBlock without changing DOM ownership.
 * Additional specialized sections must be added as named union members.
 */
export interface JesteiTrackFilterSection {
  type: "specialized";
  kind: "jestei-track-filter";
  id: SectionId;
  projectId: ProjectId;
  intro?: SectionIntroData;
}

export interface MovesCanvasDemoSection {
  type: "specialized";
  kind: "moves-canvas-demo";
  id: SectionId;
  projectId: ProjectId;
  gallery: MovesAnimatedCanvasGalleryData<MediaEntryId>;
}

export type SpecializedSection = JesteiTrackFilterSection | MovesCanvasDemoSection;

export type Section =
  | ContentSection
  | ProjectSection
  | ProjectGroupSection
  | SpecializedSection;

export function assertNeverSection(value: never): never {
  throw new Error(`Unhandled Section: ${JSON.stringify(value)}`);
}
