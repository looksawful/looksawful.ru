import {
  awfulMockupsIntro,
  awfulMockupsMockupDeck,
  awfulMockupsPhotoshopGroup,
  awfulMockupsPreviewGroup,
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
        { type: "mockup-deck", data: awfulMockupsMockupDeck },
        { type: "media-group", data: awfulMockupsPreviewGroup },
      ],
    },
    {
      type: "content",
      id: "awful-mockups-structure",
      intro: awfulMockupsStructureIntro,
      blocks: [{ type: "media-group", data: awfulMockupsPhotoshopGroup }],
    },
  ],
} as const satisfies EntityPageContent;
