import type { ProjectIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const moskovskieNovostiIntro = {
  head: {
    type: "text",
    text: "РИА Новости / Московские новости",
  },

  title: {
    type: "text",
    text: "Московские новости",
  },

  role: "Дизайнер-верстальщик",
  period: "2012",

  summary: "Ежедневная городская общественно-политическая газета о Москве.",
} as const satisfies ProjectIntroData<LogoUsageId>;
