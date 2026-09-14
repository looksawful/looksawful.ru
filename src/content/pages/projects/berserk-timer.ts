import { berserkTimerCover, berserkTimerIntro } from "../../../data/content/berserk-timer.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const berserkTimerPageContent = {
  pageId: "project:berserk-timer",
  intro: berserkTimerIntro,
  sections: [
    {
      type: "project",
      id: "berserk-timer-interface",
      projectId: "berserk-timer",
      blocks: [
        {
          type: "media-figure",
          data: berserkTimerCover,
        },
      ],
    },
  ],
} as const satisfies EntityPageContent;
