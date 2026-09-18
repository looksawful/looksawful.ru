import type { ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

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
