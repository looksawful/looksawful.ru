import type { MediaFigureData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";

import type { MediaEntryId } from "../media/index.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const shootingsIntro = {
  head: {
    type: "text",
    text: "Shootings",
  },

  title: {
    type: "text",
    text: "Shootings",
  },

  role: "Фотограф",
  period: "2016–2025",

  summary:
    "Делаю дизайн обложек для российских музыкантов, продюсирую и снимаю контент-съёмки для музыкальных лейблов и для брендов одежды и публикую творческие работы в российских и европейских fashion- и арт-изданиях с 2017 года.",

  lead: "Кадры ниже — мои собственные фотографии, съёмки, которые я продюсировал, экспериментальные микс-медиа, которые я делал из собственных и чужих фотографий на заказ и дизайн, который делал я и который делали другие люди с моими фотографиями.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const shootingsObladaetIntro = {
  title: "Obladaet",

  paragraphs: [
    "Портреты, коллажи, обложки и микс-медиа работы для Obladaet, созданные в 2020–2022 годах.",
  ],
} as const satisfies SectionIntroData;

export const shootingsEvashaIntro = {
  title: "Evasha",

  paragraphs: ["Серия портретов, обложек и микс-медиа работ для Evasha и ВК Музыки, 2025."],
} as const satisfies SectionIntroData;

export const shootingsEvashaBanner = {
  entryId: "evasha-05-source-01-1x1-use-02",

  presentation: "banner",
  captionRest: "summary",

  loading: "lazy",
} as const satisfies MediaFigureData<MediaEntryId>;

export const shootingsIgguanaIntro = {
  title: "Igguana",

  paragraphs: ["Обложка и серия микс-медиа работ для Igguana, 2023."],
} as const satisfies SectionIntroData;

export const shootingsEsmiIntro = {
  title: "ESMI",

  paragraphs: ["Фотография для обложки Esmi."],
} as const satisfies SectionIntroData;

export const shootingsEsmiBanner = {
  entryId: "esmi-12-source-01-1x1-use-02",

  presentation: "banner",
  captionRest: "summary",

  loading: "lazy",
} as const satisfies MediaFigureData<MediaEntryId>;

export const shootingsHypressionIntro = {
  title: "HYPRESSION",

  paragraphs: ["Фотографии, коллажи и микс-медиа работы для HYPRESSION, 2023."],
} as const satisfies SectionIntroData;

export const shootingsHypressionBanner = {
  entryId: "hypression-14-source-01-5x4-use-02",

  presentation: "banner",
  captionRest: "none",

  loading: "lazy",
} as const satisfies MediaFigureData<MediaEntryId>;

export const shootingsOfeliaIntro = {
  title: "Ofelia",

  paragraphs: ["Серия фотографий для спектакля Ofelia, 2023."],
} as const satisfies SectionIntroData;
