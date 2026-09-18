import type { MediaFigureData, ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";
import type { MediaEntryId } from "../media/index.ts";

export const awful3dMockupsIntro = {
  head: { type: "text", text: "Awful 3D Mockups" },
  title: { type: "text", text: "Awful 3D Mockups" },
  role: "3D-дизайнер",
  period: "2026",
  summary: "Набор 3D-мокапов устройств для интерфейсов, анимации и рендера.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awful3dMockupsDeviceMedia = [
  {
    entryId: "device-iphone-17-v30-model-use-01",
    captionView: "summary",
    lightbox: false,
    surface: { ratio: "4 / 5" },
  },
  {
    entryId: "device-ipad-pro-11-m5-v6-model-use-01",
    captionView: "summary",
    lightbox: false,
    surface: { ratio: "4 / 5" },
  },
  {
    entryId: "device-ipad-pro-13-m5-v6-model-use-01",
    captionView: "summary",
    lightbox: false,
    surface: { ratio: "4 / 5" },
  },
  {
    entryId: "device-macbook-pro-14-m5-v1-model-use-01",
    captionView: "summary",
    lightbox: false,
    surface: { ratio: "4 / 5" },
  },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];
