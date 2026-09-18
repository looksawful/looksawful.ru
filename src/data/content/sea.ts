import type { ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const seaIntro = {
  head: { type: "text", text: "SEA" },
  title: { type: "text", text: "SEA" },
  role: "Разработчик",
  period: "2026",
  summary: "Интерактивный тренажёр насмотренности и дизайн-навыков.",
  lead:
    "Веб-приложение с 60+ упражнениями по цвету, типографике, интервалам, доступности и анимации. В продукте есть теория, отслеживание прогресса, аккаунты, PWA-режим и русская/английская версии.",
  links: [
    {
      label: "Открыть SEA",
      href: "https://sea-eta.vercel.app/",
      rel: "noopener",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;
