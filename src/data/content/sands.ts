import type { ProjectIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const sandsIntro = {
  head: {
    type: "text",
    text: "S&S",
  },

  title: {
    type: "text",
    text: "S&S",
  },

  role: "СММ",
  period: "2018–2019",

  summary:
    "Бренд стильных боди и нижнего белья с акцентом на выразительный силуэт, женственность и современную подачу.",
} as const satisfies ProjectIntroData<LogoUsageId>;
