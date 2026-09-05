import {
  movesAwfulAnimationsIntro,
  movesAwfulCanvasGallery,
  movesAwfulIntro,
  movesAwfulLandingCredits,
  movesAwfulLandingMedia,
  movesAwfulLandingNote,
} from "../../../data/content/moves-awful.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const movesAwfulPageContent = {
  pageId: "project:moves-awful",
  intro: movesAwfulIntro,
  sections: [
    {
      type: "specialized",
      kind: "moves-canvas-demo",
      id: "moves-awful-canvas-demo",
      projectId: "moves-awful",
      gallery: movesAwfulCanvasGallery,
    },
    {
      type: "project",
      id: "moves-awful-landing-animations",
      projectId: "moves-awful",
      intro: movesAwfulAnimationsIntro,
      credits: movesAwfulLandingCredits,
      note: movesAwfulLandingNote,
      presentation: {
        layout: "infinite-media-reel",
        motion: "section-owned",
      },
      blocks: [
        { type: "media-figure", data: movesAwfulLandingMedia[0] },
        { type: "media-figure", data: movesAwfulLandingMedia[1] },
        { type: "media-figure", data: movesAwfulLandingMedia[2] },
      ],
    },
  ],
} as const satisfies EntityPageContent;
