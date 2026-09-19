import {
  awfulMockupsCanvasGallery,
  awfulMockupsIntro,
  awfulMockupsMockupDeck,
  awfulMockupsStructureIntro,
} from "../../../data/content/awful-mockups.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awfulMockupsPageContent = {
  pageId: "project:awful-mockups",
  intro: awfulMockupsIntro,
  sections: [
    {
      type: "content",
      id: "awful-mockups-showcase",
      blocks: [
        { type: "animated-canvas-gallery", data: awfulMockupsCanvasGallery },
      ],
    },
    {
      type: "content",
      id: "awful-mockups-preview",
      blocks: [
        { type: "mockup-deck", data: awfulMockupsMockupDeck },
      ],
    },
    {
      type: "content",
      id: "awful-mockups-structure",
      intro: awfulMockupsStructureIntro,
      blocks: [],
    },
  ],
} as const satisfies EntityPageContent;
