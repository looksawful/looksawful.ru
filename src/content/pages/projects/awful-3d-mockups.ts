import {
  awful3dMockupsDeviceMedia,
  awful3dMockupsIntro,
} from "../../../data/content/awful-3d-mockups.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awful3dMockupsPageContent = {
  pageId: "project:awful-3d-mockups",
  intro: awful3dMockupsIntro,
  sections: [
    {
      type: "project",
      id: "awful-3d-mockups-devices",
      projectId: "awful-3d-mockups",
      heading: {
        text: "Устройства",
      },
      presentation: {
        layout: "media-stack",
      },
      blocks: [
        { type: "media-figure", data: awful3dMockupsDeviceMedia[0] },
        { type: "media-figure", data: awful3dMockupsDeviceMedia[1] },
        { type: "media-figure", data: awful3dMockupsDeviceMedia[2] },
        { type: "media-figure", data: awful3dMockupsDeviceMedia[3] },
      ],
    },
  ],
} as const satisfies EntityPageContent;
