import type { EntityPageId } from "./types.ts";

export interface EntityIntroPresentationPolicy {
  head?: boolean;
  role?: boolean;
  period?: boolean;
  summary?: boolean;
  lead?: boolean;
  links?: boolean;
}

export interface EntitySectionPresentationPolicy {
  copy?: boolean;
  omitEmpty?: boolean;
}

export interface EntityStandalonePresentation {
  intro?: EntityIntroPresentationPolicy;
  hiddenSectionIds?: readonly string[];
  sections?: EntitySectionPresentationPolicy;
  suppressCaptions?: boolean;
}

export interface EntityShellPresentation {
  articleId: string;
  theme: string;
  navigationProject: boolean;
}

export type EntityShellPresentationRegistry = ReadonlyMap<EntityPageId, EntityShellPresentation>;

export const entityShellPresentationRegistry: EntityShellPresentationRegistry = new Map([
  ["case:jestei-pool", { articleId: "project-jestei", theme: "pink-red", navigationProject: true }],
  ["case:styx", { articleId: "project-styx", theme: "red-pink", navigationProject: true }],
  ["case:sensetique", { articleId: "project-sensetique", theme: "pink-red", navigationProject: true }],
  ["collection:music-photography", { articleId: "project-shootings", theme: "neutral", navigationProject: true }],
  ["project:awful-cases", { articleId: "project-awful-cases", theme: "neutral", navigationProject: false }],
  ["project:awful-mockups", { articleId: "project-awful-mockups", theme: "neutral", navigationProject: false }],
  ["project:awful-3d-mockups", { articleId: "project-awful-3d-mockups", theme: "neutral", navigationProject: false }],
  ["project:awful-studio", { articleId: "project-awful-studio", theme: "neutral", navigationProject: false }],
  ["project:keys", { articleId: "project-keys", theme: "neutral", navigationProject: false }],
  ["project:sea", { articleId: "project-sea", theme: "neutral", navigationProject: false }],
  ["project:moves-awful", { articleId: "project-moves-awful", theme: "orange-cream", navigationProject: false }],
  ["project:berry-social-content-2020", { articleId: "project-berry-social-content-2020", theme: "berry-pink", navigationProject: false }],
]);

const entityStandalonePresentationRegistry = new Map<EntityPageId, EntityStandalonePresentation>([
  ["case:styx", { hiddenSectionIds: ["styx-social-instructions"] }],
  ["collection:music-photography", {
    intro: {
      head: false,
      role: false,
      period: false,
      summary: false,
      lead: false,
      links: false,
    },
    sections: { copy: false, omitEmpty: true },
    suppressCaptions: true,
  }],
]);

export function getEntityShellPresentation(pageId: EntityPageId): EntityShellPresentation {
  const presentation = entityShellPresentationRegistry.get(pageId);
  if (!presentation) throw new Error(`Missing entity shell presentation: ${pageId}`);
  return presentation;
}

export function getEntityStandalonePresentation(pageId: EntityPageId): EntityStandalonePresentation {
  return entityStandalonePresentationRegistry.get(pageId) ?? {};
}
