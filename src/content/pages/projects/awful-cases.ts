import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../../../data/content/awful-cases.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awfulCasesPageContent = {
  pageId: "project:awful-cases",
  intro: awfulCasesIntro,
  sections: [
    {
      type: "project",
      id: "awful-cases-demo",
      projectId: "awful-cases",
      blocks: [
        {
          type: "media-figure",
          data: awfulCasesDemo,
        },
      ],
    },
    {
      type: "project",
      id: "awful-cases-settings",
      projectId: "awful-cases",
      blocks: [
        {
          type: "mockup",
          data: awfulCasesSettingsMockup,
        },
      ],
    },
  ],
} as const satisfies EntityPageContent;
