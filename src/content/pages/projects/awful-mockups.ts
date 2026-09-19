import {
  awfulMockupsIntro,
  awfulMockupsStructureIntro,
} from "../../../data/content/awful-mockups.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awfulMockupsPageContent = {
  pageId: "project:awful-mockups",
  intro: awfulMockupsIntro,
  sections: [
    {
      type: "content",
      id: "awful-mockups-structure",
      intro: awfulMockupsStructureIntro,
      blocks: [],
    },
  ],
} as const satisfies EntityPageContent;
