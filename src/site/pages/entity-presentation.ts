import type { EntityPageId } from "./types.ts";

export interface EntityShellPresentation {
  articleId: string;
  theme: string;
  navigationProject: boolean;
}

const entityShellPresentations = {
  "case:jestei-pool": {
    articleId: "project-jestei",
    theme: "pink-red",
    navigationProject: true,
  },
  "case:styx": {
    articleId: "project-styx",
    theme: "red-pink",
    navigationProject: true,
  },
  "case:sensetique": {
    articleId: "project-sensetique",
    theme: "pink-red",
    navigationProject: true,
  },
  "collection:music-photography": {
    articleId: "project-shootings",
    theme: "neutral",
    navigationProject: true,
  },
  "project:awful-cases": {
    articleId: "project-awful-cases",
    theme: "neutral",
    navigationProject: false,
  },
  "project:moves-awful": {
    articleId: "project-moves-awful",
    theme: "orange-cream",
    navigationProject: false,
  },
  "project:berry-social-content-2020": {
    articleId: "project-berry-social-content-2020",
    theme: "berry-pink",
    navigationProject: false,
  },
} as const satisfies Partial<Record<EntityPageId, EntityShellPresentation>>;

export function getEntityShellPresentation(pageId: EntityPageId): EntityShellPresentation {
  const presentation = entityShellPresentations[pageId as keyof typeof entityShellPresentations];

  if (!presentation) {
    throw new Error(`Missing entity shell presentation: ${pageId}`);
  }

  return presentation;
}
