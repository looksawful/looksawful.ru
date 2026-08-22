import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const sensetiqueIntro = {
  head: {
    type: "logo",
    logoUsageId: "sensetique-case-head-logo",
    wrapper: "none",
  },

  title: {
    type: "logo",
    logoUsageId: "sensetique-case-title-logo",
  },

  role: "Основатель",
  period: "2017–2018",

  lead: "Занимался запуском, управлением, продюсированием съёмок и организацией команды московской фотостудии и продакшн для моды, рекламы и визуального контента.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const sensetiqueStudioIntro = {
  title: "Студия",

  paragraphs: [
    "В 2018 году мы закончили строительство студии с тремя съёмочными пространствами в здании завода на улице Дмитрия Ульянова, 42.",
  ],
} as const satisfies SectionIntroData;

export const sensetiqueProductionIntro = {
  title: "Продакшен",

  paragraphs: [
    "В 2017 году я запустил production-агентство полного цикла Moch Fashn. Мы продюсировали и создавали фотосъёмки, занимались SMM и рекламой, разрабатывали и дорабатывали сайты. Снимали лукбуки и кампейны, стилизовали съёмки, администрировали интернет-магазины и делали редизайн сайтов для локальных брендов одежды и интернет-магазинов. В 2018 мы провели ребрендинг и масштабировали проект: начали строительство коммерческой фотостудии, начали совместную работу с другими продакшн-агентствами, выступая в роли субподрядчиков, выполняя часть задач крупных агентств, например организовывая кастинги, логистику, предоставляли стилистов и ассистентов на рекламных проектах.",
  ],
} as const satisfies SectionIntroData;
