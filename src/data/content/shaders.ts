import type { ProjectIntroData } from "../../types/content.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const shadersIntro = {
  head: { type: "text", text: "Shaders" },
  title: { type: "text", text: "Shaders" },
  role: "Разработчик",
  period: "2024–2026",
  summary: "GLSL- и Three.js-эксперименты для интерфейсов и визуальных систем.",
  lead:
    "Набор собственных shader-экспериментов: фоновые GLSL-сцены, dark-mode варианты и production-материалы на Three.js. Часть наработок используется непосредственно в компонентах сайта, включая шейдерную тему Jestei.",
} as const satisfies ProjectIntroData<LogoUsageId>;
