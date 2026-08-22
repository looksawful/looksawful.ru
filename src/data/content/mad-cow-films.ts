import type { ProjectIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const madCowFilmsIntro = {
  head: {
    type: "text",
    text: "Mad Cow Films",
  },

  title: {
    type: "text",
    text: "Mad Cow Films",
  },

  role: "ассистент продюсера",
  period: "2019",

  summary: "Международный рекламный продакшн с офисами в Лондоне и Москве.",
} as const satisfies ProjectIntroData<LogoUsageId>;
