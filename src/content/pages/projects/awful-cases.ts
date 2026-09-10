import {
  awfulCasesCodeBlocks,
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
          type: "awful-cases-game",
        },
      ],
    },
    {
      type: "project",
      id: "awful-cases-code",
      projectId: "awful-cases",
      blocks: [
        {
          type: "code-block",
          data: awfulCasesCodeBlocks.install,
        },
        {
          type: "code-block",
          data: awfulCasesCodeBlocks.run,
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
