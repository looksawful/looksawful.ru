import type { MediaFigureData, MockupData, ProjectIntroData } from "../../types/content.ts";

import type { MediaEntryId } from "../media/index.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const awfulCasesIntro = {
  head: {
    type: "text",
    text: "Awful Cases",
  },

  title: {
    type: "text",
    text: "Awful Cases",
  },

  role: "Разработчик",
  period: "2024–2026",

  summary: "Утилита для Windows, которая меняет регистр и типографику выделенного текста.",

  lead: "Awful Cases работает через глобальные горячие клавиши. Выделите текст в любом редактируемом поле, нажмите сочетание клавиш — приложение заменит выделенный текст на преобразованный вариант.",

  links: [
    {
      label: "GitHub",
      href: "https://github.com/looksawful/awful-cases",
      rel: "noopener",
      target: "_blank",
    },
    {
      label: "Download ZIP",
      href: "https://github.com/looksawful/awful-cases/archive/refs/heads/main.zip",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulCasesDemo = {
  entryId: "awful-cases-assets-recording-2026-08-15-121210-use-01",

  presentation: "banner",

  video: {
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: "metadata",
  },
} as const satisfies MediaFigureData<MediaEntryId>;

export const awfulCasesSettingsMockup = {
  entryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",

  device: "desktop",
  theme: "dark",

  loading: "lazy",
} as const satisfies MockupData<MediaEntryId>;
