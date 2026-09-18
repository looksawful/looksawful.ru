import type {
  ProjectIntroData,
  SectionIntroData,
} from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const keysIntro = {
  head: { type: "text", text: "KEYS" },
  title: { type: "text", text: "KEYS" },
  role: "Разработчик",
  period: "2026",
  summary: "Браузерный тренажёр горячих клавиш.",
  lead:
    "Статическое HTML/CSS/JavaScript-приложение без runtime-зависимостей для тренировки сочетаний клавиш в Figma, VS Code, Photoshop, ComfyUI, Windows Terminal и других программах. Поддерживает обычные сочетания и последовательные chord-команды.",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/looksawful/Keys",
      rel: "noopener",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const keysArchitectureIntro = {
  title: "Browser runtime",
  paragraphs: [
    "Каталог сочетаний, нормализация клавиатуры и состояние интерфейса разделены между data.js, logic.js и app.js. Конфигурация тренировки хранится локально в браузере, а production-сборка остаётся dependency-free.",
  ],
} as const satisfies SectionIntroData;
