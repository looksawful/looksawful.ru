import {
  berryIntro,
  berryStoryMockups,
} from "../../../data/content/berry.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const berrySocialContentPageContent = {
  pageId: "project:berry-social-content-2020",
  intro: berryIntro,
  sections: [
    {
      type: "project",
      id: "berry-instagram-stories",
      projectId: "berry-social-content-2020",
      credits: {
        title: "Сторис с услугами в инстаграме",
      },
      presentation: {
        layout: "mockup-grid-reel",
      },
      blocks: [
        { type: "mockup", data: berryStoryMockups[0] },
        { type: "mockup", data: berryStoryMockups[1] },
        { type: "mockup", data: berryStoryMockups[2] },
        { type: "mockup", data: berryStoryMockups[3] },
      ],
    },
  ],
} as const satisfies EntityPageContent;
