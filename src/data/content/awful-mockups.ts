import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "Дизайн и ретушь",
  period: "2026",
  summary: "PSD-мокапы телефона и ноутбука для презентации интерфейсов и графики.",
  lead:
    "Экран, корпус, фон и обработка разделены по слоям. Можно быстро менять изображение, цвет и фон, не собирая сцену заново.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulMockupsStructureIntro = {
  title: "Как устроены мокапы",
  paragraphs: [
    "Файлы остаются редактируемыми: экран, устройство, фон и постобработка не склеены в один слой.",
    "В наборе есть разные ракурсы и сцены для интерфейсов, айдентики и графики.",
  ],
} as const satisfies SectionIntroData;
