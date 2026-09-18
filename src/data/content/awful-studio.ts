import type { MediaFigureData, ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";
import type { MediaEntryId } from "../media/index.ts";

export const awfulStudioIntro = {
  head: { type: "text", text: "AWFUL STUDIO" },
  title: { type: "text", text: "AWFUL STUDIO" },
  role: "Разработчик",
  period: "2026",
  summary: "Blender 5.2 LTS-расширение для виртуальной предметной и рекламной студии.",
  lead:
    "Завершённый Blender-native проект с релизом 1.0.0: редактируемые студийные сцены, свет, камеры, окружение, процедурные мокапы, motion-пресеты и проверенный каталог production-ассетов без замены нативных инструментов Blender.",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/looksawful/awful-studio",
      rel: "noopener",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;


export const awfulStudioDeviceMedia = [
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
    entryId: "device-macbook-pro-14-m5-v1-model-use-01",
    captionView: "summary",
    lightbox: false,
    surface: { ratio: "4 / 5" },
  },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];
