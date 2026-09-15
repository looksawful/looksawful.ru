import { CONTENT_BLOCK_TYPES, type ContentBlockType } from "./content-block.ts";
import {
  SPECIALIZED_SECTION_KINDS,
  type SpecializedSectionKind,
} from "./sections.ts";

export type ProjectComponentSurfaceFamily =
  | "content-block"
  | "specialized-section"
  | "composition"
  | "card";

export type ProjectComponentCmsOwnership = "editorial" | "code" | "mixed";
export type ProjectComponentMediaOwnership =
  | "catalog"
  | "none"
  | "mixed"
  | "legacy-path"
  | "external";

export interface ProjectComponentSurface {
  id: string;
  family: ProjectComponentSurfaceFamily;
  storybook: "required";
  cms: ProjectComponentCmsOwnership;
  media: ProjectComponentMediaOwnership;
  interaction: "static" | "runtime";
}

const contentBlockOwnership: Record<
  ContentBlockType,
  Pick<ProjectComponentSurface, "cms" | "media" | "interaction">
> = {
  "code-block": { cms: "editorial", media: "none", interaction: "runtime" },
  "media-figure": { cms: "code", media: "catalog", interaction: "static" },
  "media-group": { cms: "code", media: "catalog", interaction: "static" },
  "media-slider": { cms: "code", media: "catalog", interaction: "runtime" },
  mockup: { cms: "code", media: "catalog", interaction: "static" },
  "mockup-deck": { cms: "code", media: "catalog", interaction: "runtime" },
  "justified-gallery": { cms: "code", media: "catalog", interaction: "runtime" },
  "before-after": { cms: "code", media: "catalog", interaction: "runtime" },
  "page-flip": { cms: "code", media: "catalog", interaction: "runtime" },
  "animated-canvas-gallery": { cms: "code", media: "catalog", interaction: "runtime" },
  "jestei-theme": { cms: "code", media: "catalog", interaction: "runtime" },
  "awful-cases-game": { cms: "code", media: "none", interaction: "runtime" },
};

const specializedOwnership: Record<
  SpecializedSectionKind,
  Pick<ProjectComponentSurface, "cms" | "media" | "interaction">
> = {
  "jestei-track-filter": { cms: "mixed", media: "none", interaction: "runtime" },
  "moves-canvas-demo": { cms: "code", media: "catalog", interaction: "runtime" },
  "berserk-timer-showcase": { cms: "code", media: "external", interaction: "runtime" },
};

const compositionSurfaces = [
  { id: "entity-intro", cms: "mixed", media: "mixed", interaction: "static" },
  { id: "section-intro", cms: "mixed", media: "none", interaction: "static" },
  { id: "resource-links", cms: "mixed", media: "none", interaction: "static" },
  { id: "project-teaser", cms: "mixed", media: "catalog", interaction: "static" },
  { id: "portfolio-entity-card", cms: "mixed", media: "catalog", interaction: "static" },
  { id: "responsive-image", cms: "code", media: "catalog", interaction: "static" },
] as const;

const cardSurfaces = [
  // Homepage project cards still use authored cover paths in projects.json. This
  // is deliberately recorded as legacy-path until they migrate to MediaEntryId.
  { id: "project-card", cms: "mixed", media: "legacy-path", interaction: "runtime" },
  { id: "subproject-card", cms: "code", media: "catalog", interaction: "static" },
  { id: "pet-project-card", cms: "code", media: "catalog", interaction: "static" },
] as const;

export const projectComponentSurfaces: readonly ProjectComponentSurface[] = Object.freeze([
  ...CONTENT_BLOCK_TYPES.map((id) => ({
    id,
    family: "content-block" as const,
    storybook: "required" as const,
    ...contentBlockOwnership[id],
  })),
  ...SPECIALIZED_SECTION_KINDS.map((id) => ({
    id,
    family: "specialized-section" as const,
    storybook: "required" as const,
    ...specializedOwnership[id],
  })),
  ...compositionSurfaces.map((surface) => ({
    ...surface,
    family: "composition" as const,
    storybook: "required" as const,
  })),
  ...cardSurfaces.map((surface) => ({
    ...surface,
    family: "card" as const,
    storybook: "required" as const,
  })),
]);
