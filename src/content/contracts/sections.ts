import type { ProjectId } from "../../data/catalog/projects/index.ts";
import type { CreditsData, SectionIntroData } from "../../types/content.ts";
import type { ContentBlock } from "./content-block.ts";
import type { SectionId } from "./ids.ts";

export const SECTION_TYPES = ["content", "project", "project-group", "specialized"] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type SectionLayout = "stack" | "mockup-grid-reel";

export interface SectionPresentation {
  layout?: SectionLayout;
}

export interface ContentSection {
  type: "content";
  id: SectionId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectSection {
  type: "project";
  id: SectionId;
  projectId: ProjectId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectPresentation {
  projectId: ProjectId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  presentation?: SectionPresentation;
  blocks: readonly ContentBlock[];
}

export interface ProjectGroupSection {
  type: "project-group";
  id: SectionId;
  intro?: SectionIntroData;
  credits?: CreditsData;
  items: readonly ProjectPresentation[];
}

/**
 * Closed specialized section contract for the one section-level runtime that
 * is already known to require ownership above an ordinary ContentBlock.
 * Additional specialized sections must be added as named union members.
 */
export interface JesteiTrackFilterSection {
  type: "specialized";
  kind: "jestei-track-filter";
  id: SectionId;
  projectId: ProjectId;
  intro?: SectionIntroData;
}

export type SpecializedSection = JesteiTrackFilterSection;

export type Section =
  | ContentSection
  | ProjectSection
  | ProjectGroupSection
  | SpecializedSection;

export function assertNeverSection(value: never): never {
  throw new Error(`Unhandled Section: ${JSON.stringify(value)}`);
}
