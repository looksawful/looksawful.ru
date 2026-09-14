import { berserkTimerIntro } from "../../../data/content/berserk-timer.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const berserkTimerPageContent = {
  pageId: "project:berserk-timer",
  intro: berserkTimerIntro,
  sections: [
    {
      type: "specialized",
      kind: "berserk-timer-showcase",
      id: "berserk-timer-showcase",
      projectId: "berserk-timer",
    },
  ],
} as const satisfies EntityPageContent;
