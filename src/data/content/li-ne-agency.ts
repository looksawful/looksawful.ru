import type { ProjectIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const liNeAgencyIntro = {
  head: {
    type: "text",
    text: "LI-NE Agency",
  },

  title: {
    type: "text",
    text: "LI-NE Agency",
  },

  role: "JR продюсер",
  period: "2017",

  summary: "Продакшн-агентство в сфере моды, рекламы и медиа.",
} as const satisfies ProjectIntroData<LogoUsageId>;
