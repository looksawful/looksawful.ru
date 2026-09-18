import {
  awfulStudioDeviceMedia,
  awfulStudioIntro,
} from "../../../data/content/awful-studio.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awfulStudioPageContent = {
  pageId: "project:awful-studio",
  intro: awfulStudioIntro,
  sections: [
    {
      type: "project",
      id: "awful-studio-devices",
      projectId: "awful-studio",
      heading: {
        text: "Устройства",
      },
      presentation: {
        layout: "media-stack",
      },
      blocks: [
        { type: "media-figure", data: awfulStudioDeviceMedia[0] },
        { type: "media-figure", data: awfulStudioDeviceMedia[1] },
        { type: "media-figure", data: awfulStudioDeviceMedia[2] },
      ],
    },
  ],
} as const satisfies EntityPageContent;
