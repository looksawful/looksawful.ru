import {
  awfulMockupsIntro,
  awfulMockupsMockupDeck,
  awfulMockupsPhotoshopGroup,
  awfulMockupsPreviewGroup,
  awfulMockupsSelectionIntro,
  awfulMockupsShowcaseIntro,
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
      intro: awfulMockupsShowcaseIntro,
      blocks: [{ type: "mockup-deck", data: awfulMockupsMockupDeck }],
    },
    {
      type: "content",
      id: "awful-mockups-selection",
      intro: awfulMockupsSelectionIntro,
      blocks: [{ type: "media-group", data: awfulMockupsPreviewGroup }],
    },
    {
      type: "content",
      id: "awful-mockups-structure",
      intro: awfulMockupsStructureIntro,
      blocks: [{ type: "media-group", data: awfulMockupsPhotoshopGroup }],
    },
  ],
} as const satisfies EntityPageContent;
