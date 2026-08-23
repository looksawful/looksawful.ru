import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaFigureData } from "../../types/media-presentation.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const shootingsIntro = {
  head: { type: "text", text: "Shootings" },
  title: { type: "text", text: "Shootings" },
  role: "Фотограф",
  summary: "Делаю дизайн обложек для российских музыкантов, продюсирую и снимаю контент-съёмки для музыкальных лейблов и для брендов одежды и публикую творческие работы в российских и европейских fashion- и арт-изданиях с 2017 года.",
  lead: "Кадры ниже — мои собственные фотографии, съёмки, которые я продюсировал, экспериментальные микс-медиа, которые я делал из собственных и чужих фотографий на заказ и дизайн, который делал я и который делали другие люди с моими фотографиями.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const shootingsObladaetIntro = { title: "Obladaet", paragraphs: ["Портреты, коллажи, обложки и микс-медиа работы для Obladaet, созданные в 2020–2022 годах."] } as const satisfies SectionIntroData;
export const shootingsEvashaIntro = { title: "Evasha", paragraphs: ["Серия портретов, обложек и микс-медиа работ для Evasha и ВК Музыки, 2025."] } as const satisfies SectionIntroData;
export const shootingsEvashaBanner = { entryId: "evasha-05-source-01-1x1-use-02", presentation: "banner", captionView: "summary", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;
export const shootingsIgguanaIntro = { title: "Igguana", paragraphs: ["Обложка и серия микс-медиа работ для Igguana, 2023."] } as const satisfies SectionIntroData;
export const shootingsEsmiIntro = { title: "ESMI", paragraphs: ["Фотография для обложки Esmi."] } as const satisfies SectionIntroData;
export const shootingsEsmiBanner = { entryId: "esmi-12-source-01-1x1-use-02", presentation: "banner", captionView: "summary", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;
export const shootingsHypressionIntro = { title: "HYPRESSION", paragraphs: ["Фотографии, коллажи и микс-медиа работы для HYPRESSION, 2023."] } as const satisfies SectionIntroData;
export const shootingsHypressionBanner = { entryId: "hypression-14-source-01-5x4-use-02", presentation: "banner", captionView: "lightbox-only", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;
export const shootingsOfeliaIntro = { title: "Ofelia", paragraphs: ["Серия фотографий для спектакля Ofelia, 2023."] } as const satisfies SectionIntroData;


export const shootingsObladaetPortraitsGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  head: { credits: { lines: ["Фотограф Иван Крушинский"] } },
  items: [
    { entryId: "obladaet-02-source-01-4x5-use-02", loading: "lazy" },
    { entryId: "obladaet-02-source-02-4x5-use-02", loading: "lazy" },
    { entryId: "obladaet-02-source-03-4x5-use-02", loading: "lazy" },
    { entryId: "obladaet-02-source-04-4x5-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsEvashaMixedGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "evasha-08-source-01-99x140-use-02", loading: "lazy" },
    { entryId: "evasha-08-source-02-4x5-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsEvashaPortraitsGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "evasha-10-source-01-3x4-use-02", loading: "lazy" },
    { entryId: "evasha-10-source-02-2x3-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsHypressionCollageGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "hypression-15-source-01-1x1-use-02", loading: "lazy" },
    { entryId: "hypression-15-source-02-256x181-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsHypressionMixedMediaGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "hypression-16-source-01-479x671-use-02", loading: "lazy" },
    { entryId: "hypression-16-source-02-2x3-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsHypressionPortraitsGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "hypression-17-source-01-4x5-use-02", loading: "lazy" },
    { entryId: "hypression-17-source-02-121x175-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;


export const portfolioShootingsStrip = {
  "layout": "strip",
  "className": "portfolio-showcase__group",
  "captionView": "overlay",
  "infiniteReel": {
    "duration": "56s"
  },
  "items": [
    {
      "entryId": "obladaet-01-source-01-32x45-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-01-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-01-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-02-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-02-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-02-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-02-source-04-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-03-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-03-source-02-29x40-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-03-source-03-1129x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-04-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-04-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-04-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-04-source-04-125x172-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-04-source-05-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-05-source-01-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-06-source-01-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-06-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-06-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-07-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-07-source-02-121x125-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-07-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-08-source-01-99x140-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-08-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-09-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-09-source-02-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-10-source-01-3x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "evasha-10-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-01-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-04-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-05-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "igguana-11-source-06-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "esmi-12-source-01-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-14-source-01-5x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-15-source-01-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-15-source-02-256x181-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-16-source-01-479x671-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-16-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-17-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "hypression-17-source-02-121x175-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-02-3x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-03-1553x2135-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-04-1553x2173-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-05-174x239-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-06-174x239-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-07-521x716-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "ofelia-19-source-08-523x719-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "obladaet-portfolio-portfolio-extra-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-02-5x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-03-700x559-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-04-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-05-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-06-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-07-1216x1400-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-08-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-09-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-10-854x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "portfolio-portfolio-extra-11-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-01-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-07-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-14-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-08-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-15-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-09-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-16-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-03-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-18-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-05-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-06-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-19-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsObladaetCollageReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "lines": [
        "Фотограф Иван Крушинский"
      ]
    }
  },
  "items": [
    {
      "entryId": "obladaet-01-source-01-32x45-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "obladaet-01-source-02-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "obladaet-01-source-03-4x5-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsObladaetMixedMediaReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "lines": [
        "Фотограф Иван Крушинский"
      ]
    }
  },
  "items": [
    {
      "entryId": "obladaet-03-source-01-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "obladaet-03-source-02-29x40-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "obladaet-03-source-03-1129x1280-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsEvashaPortraitReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "items": [
    {
      "entryId": "evasha-06-source-01-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "evasha-06-source-02-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "evasha-06-source-03-4x5-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsEvashaCoverReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "items": [
    {
      "entryId": "evasha-07-source-01-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "evasha-07-source-02-121x125-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "evasha-07-source-03-4x5-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsIgguanaMasonryGroup = {
  "layout": "masonry",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "lines": [
        "Фотограф Иван Крушинский",
        "Стилист Мария Жукова"
      ]
    }
  },
  "items": [
    {
      "entryId": "igguana-11-source-01-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "igguana-11-source-02-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "igguana-11-source-03-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "igguana-11-source-04-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "igguana-11-source-05-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "igguana-11-source-06-4x5-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const shootingsOfeliaStrip = {
  "layout": "strip",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "title": "Фотографии для спектакля Ofelia, 2023."
    }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "ofelia-19-source-01-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-02-3x4-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-03-1553x2135-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-04-1553x2173-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-05-174x239-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-06-174x239-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-07-521x716-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "ofelia-19-source-08-523x719-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsObladaetPairGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  head: { credits: { lines: ["Фотограф Иван Крушинский"] } },
  items: [
    {
      entryId: "obladaet-04-source-01-4x5-use-02",
      loading: "lazy",
      surfaceLayout: "pair",
      surfaceEntries: [
        { entryId: "obladaet-04-source-01-4x5-use-02", loading: "lazy" },
        { entryId: "obladaet-04-source-02-4x5-use-02", loading: "lazy" },
      ],
    },
    { entryId: "obladaet-04-source-03-4x5-use-02", loading: "lazy" },
    { entryId: "obladaet-04-source-04-125x172-use-02", loading: "lazy" },
    { entryId: "obladaet-04-source-05-4x5-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const shootingsEvashaPairFigure = {
  entryId: "evasha-09-source-01-4x5-use-02",
  captionView: "lightbox-only",
  loading: "lazy",
  surfaceLayout: "pair",
  surfaceEntries: [
    { entryId: "evasha-09-source-01-4x5-use-02", loading: "lazy" },
    { entryId: "evasha-09-source-02-1x1-use-02", loading: "lazy" },
  ],
} as const satisfies MediaFigureData<MediaEntryId>;
