import type { MediaFigureData, ProjectIntroData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const berserkTimerIntro = {
  head: { type: "text", text: "Berserk Timer" },
  title: { type: "text", text: "Berserk Timer" },
  role: "Разработчик",
  summary: "Консольный помодоро-таймер для Windows.",
  lead:
    "Python CLI-таймер с гибким вводом длительности, пресетами, интерактивным управлением, звуковыми сигналами, целями и опциональным witness-логом после сессии.",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/looksawful/berserk-timer",
      rel: "noopener",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const berserkTimerCover = {
  entryId: "berserk-timer-cover-use-01",
  presentation: "banner",
  captionView: "full",
  loading: "eager",
} as const satisfies MediaFigureData<MediaEntryId>;
