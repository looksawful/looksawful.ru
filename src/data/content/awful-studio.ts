import type { ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulStudioIntro = {
  head: { type: "text", text: "AWFUL STUDIO" },
  title: { type: "text", text: "AWFUL STUDIO" },
  role: "Разработчик",
  period: "2026",
  summary: "Расширение Blender для сборки виртуальной предметной студии.",
  lead:
    "Blender-native виртуальная предметная и рекламная студия для сборки редактируемых сцен, света, камер, окружения, процедурных мокапов и motion-пресетов без замены нативных инструментов Blender.",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/looksawful/awful-studio",
      rel: "noopener",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;
