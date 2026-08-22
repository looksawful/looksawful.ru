import type { ProjectIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const progressTraditionIntro = {
  head: {
    type: "text",
    text: "Издательство Прогресс-Традиция",
  },

  title: {
    type: "text",
    text: "Издательство Прогресс-Традиция",
  },

  role: "Книжный дизайнер",
  period: "2013–2015",

  summary:
    "Российское издательство переводной, гуманитарной, художественной и образовательной литературы. Компания выпускает книги и работает с полным издательским циклом: текстом, структурой, редакционной подготовкой, иллюстрациями, вёрсткой и подготовкой материалов к печати.",
} as const satisfies ProjectIntroData<LogoUsageId>;
