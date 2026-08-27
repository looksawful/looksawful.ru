import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";

import type { MediaFigureData, MockupData } from "../../types/media-presentation.ts";

import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaSliderData } from "../../types/media-slider.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";

import { getCase, getRole } from "../catalog/lookup.ts";

import type { MediaEntryId } from "../media/index.ts";

import type { LogoUsageId } from "../logos/index.ts";

const styxCase = getCase("styx");
const designerRole = getRole("designer");

export const styxIntro = {
  head: {
    type: "logo",
    logoUsageId: "styx-case-head-logo",
    wrapper: "name",
  },

  title: {
    type: "logo",
    logoUsageId: "styx-case-title-logo",
  },

  role: designerRole.name,
  period: styxCase.date,

  lead: "Возглавил работу над визуальной системой московского бренда украшений, аксессуаров и одежды, вдохновлённого готической романтикой и лавкрафтовским ужасом.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const styxBrandIntro = {
  title: "Айдентика",

  paragraphs: [
    "С нуля собрал визуальную систему Styx: разработал логотип, фирменный стиль, упаковку, печатные материалы, оформление соцсетей, рекламные публикации и баннеры.",
  ],
} as const satisfies SectionIntroData;

export const styxLogoBanner = {
  entryId: "styx-logo-source-styx-logo-volume-use-01",

  presentation: "banner",

  captionView: "lightbox-only",

  loading: "lazy",
} as const satisfies MediaFigureData<MediaEntryId>;

export const styxProductionIntro = {
  title: "Продакшен",

  paragraphs: [
    "Продюсировал и снимал кампейны, лукбуки и каталоги Styx. Готовил материал для рекламы, каталогов и соцсетей, делал техническую, художественную и экспериментальную обработку фотографий и создавал сканографические анимации и арты.",
  ],
} as const satisfies SectionIntroData;

export const styxScanographyIntro = {
  title: "Сканографии",

  paragraphs: [
    "Для Styx придумал собственную технику сканографии. Сканировал один объект разными сканерами и вручную монтировал кадры, поэтому искажения и артефакты возникали при сканировании, а не имитировались цифровой обработкой.",
  ],
} as const satisfies SectionIntroData;

/**
 * Первый media-group, полностью управляемый TypeScript.
 *
 * В исходном HTML эти четыре figure одновременно задавали overlay
 * и summary-состояния. Старый normalizer выбирал overlay, поэтому
 * новое явное состояние группы — overlay.
 *
 * Полный caption при этом берётся из MediaEntry,
 * включая contextual indexes 09–12.
 */
export const styxScanographyGroup = {
  layout: "grid",

  className: "project__section wrapper",

  captionView: "overlay",

  items: [
    {
      entryId: "styx-02-source-01-9x16-use-02",

      mediaClassName: "fit-cover position-center",

      video: {
        autoplay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "metadata",
      },
    },

    {
      entryId: "styx-02-source-02-9x16-use-02",

      video: {
        autoplay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "metadata",
      },
    },

    {
      entryId: "styx-02-source-03-1x1-use-02",

      loading: "lazy",
    },

    {
      entryId: "styx-02-source-04-1x1-use-02",

      loading: "lazy",
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const styxPrintLinksGroup = {
  layout: "grid",

  className: "project__section wrapper",

  captionView: "overlay",

  columns: 3,

  items: [
    { entryId: "styx-06-source-03-1x1-use-01", loading: "lazy" },
    { entryId: "styx-06-source-04-69x80-use-01", loading: "lazy" },
    { entryId: "styx-06-source-05-1x1-use-01", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const styxScanographyCampaignGroup = {
  layout: "grid",

  className: "project__section wrapper",

  captionView: "overlay",

  items: [
    { entryId: "styx-07-source-01-4x5-use-03", loading: "lazy" },
    { entryId: "styx-07-source-02-4x5-use-03", loading: "lazy" },
    { entryId: "styx-07-source-03-4x5-use-02", loading: "lazy" },
    { entryId: "styx-07-source-04-4x5-use-02", loading: "lazy" },
    { entryId: "styx-07-source-05-4x5-use-03", loading: "lazy" },
    { entryId: "styx-07-source-06-591x640-use-03", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const styxCatalogMockup = {
  entryId: "styx-04-source-01-16x9-use-01",

  device: "desktop",

  theme: "dark",

  captionView: "summary",

  loading: "lazy",
} as const satisfies MockupData<MediaEntryId>;

export const styxShootingsIntro = {
  title: "Съёмки",

  paragraphs: [
    "Продюсировал и снимал для Styx лукбуки, кампейны и коллаборации. Из отснятого материала собирал каталожные, рекламные и экспериментальные визуалы бренда.",
  ],
} as const satisfies SectionIntroData;

export const styxLookbookIntro = {
  title: "Лукбук",

  paragraphs: ["Снял лукбук Styx Jewel 2025 года."],
} as const satisfies SectionIntroData;


export const portfolioScanographyStrip = {
  "layout": "strip",
  "className": "portfolio-showcase__group",
  "captionView": "overlay",
  "items": [
    {
      "entryId": "styx-02-source-01-9x16-use-01",
      "className": "portfolio-showcase__item",
      "video": {
        "autoplay": true,
        "loop": true,
        "muted": true,
        "playsInline": true,
        "preload": "metadata"
      }
    },
    {
      "entryId": "styx-02-source-02-9x16-use-01",
      "className": "portfolio-showcase__item",
      "video": {
        "autoplay": true,
        "loop": true,
        "muted": true,
        "playsInline": true,
        "preload": "metadata"
      }
    },
    {
      "entryId": "styx-02-source-03-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-02-source-04-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-10-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-11-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-12-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-13-13x14-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-05-source-17-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-07-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-07-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-07-source-05-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-07-source-06-591x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-01-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-03-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-04-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-05-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-06-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-07-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-08-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "styx-08-source-09-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const styxBrandLookbookReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "title": "Лукбук Styx Jewels, 2023."
    }
  },
  "items": [
    {
      "entryId": "styx-03-source-01-4x5-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-03-source-02-4x5-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-03-source-03-4x5-use-01",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const styxLookbookMasonryGroup = {
  "layout": "masonry",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "columns": 4,
  "items": [
    {
      "entryId": "styx-05-source-01-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-02-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-03-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-04-4x5-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-05-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-06-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-07-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-08-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-09-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-10-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-11-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-12-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-13-13x14-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-14-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-15-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-16-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-17-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-18-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-19-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-20-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-21-4x5-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-22-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-23-2x3-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "styx-05-source-24-4x5-use-01",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const styxScanographyStrip = {
  "layout": "strip",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "title": "Сканография, 2021."
    }
  },
  "height": "clamp(12rem, 30cqi, 19rem)",
  "items": [
    {
      "entryId": "styx-08-source-01-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-02-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-03-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-04-1x1-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-05-1x1-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-06-1x1-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-07-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-08-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "styx-08-source-09-4x5-use-03",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const styxLookbook2025Reel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "head": {
    "credits": {
      "title": "Лукбук Styx Jewels, 2025."
    }
  },
  "items": [
    {
      "entryId": "styx-09-source-01-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-09-source-02-3x4-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "styx-09-source-03-1x1-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;

export const styxProductionMediaGroup = {
  layout: "grid",
  className: "project__section wrapper",
  captionView: "overlay",
  items: [
    { entryId: "styx-01-source-01-1x1-use-01", loading: "lazy" },
    { entryId: "styx-01-source-02-1x1-use-01", loading: "lazy" },
    { entryId: "styx-01-source-03-4x5-use-01", loading: "lazy" },
    {
      entryId: "styx-01-source-04-9x16-use-01",
      loading: "lazy",
      surfaceClassName: "media__surface--center-crop",
      surface: { ratio: "4 / 5", fit: "cover", position: "50% 50%" },
      video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "metadata" },
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const styxGiftCertificateSlider = {
  captionView: "summary",
  slides: [
    { entryId: "styx-06-source-01-1920x913-use-01", captionView: "summary", loading: "lazy" },
    { entryId: "styx-06-source-02-1920x917-use-01", captionView: "summary", loading: "lazy" },
  ],
} as const satisfies MediaSliderData<MediaEntryId>;

export const styxSocialInstructionMockupDeck = {
  variant: "standard",
  captionView: "full",
  device: "mobile",
  theme: "dark",
  style: "--surface-bg: #121212",
  controls: true,
  slides: [
    { entryId: "styx-10-source-01-9x16-use-01", loading: "lazy", mediaClassName: "fit-contain", captionView: "lightbox-only" },
    { entryId: "styx-10-source-02-9x16-use-01", loading: "lazy", mediaClassName: "fit-contain", captionView: "lightbox-only" },
    { entryId: "styx-10-source-03-9x16-use-01", loading: "lazy", mediaClassName: "fit-contain", captionView: "lightbox-only" },
    { entryId: "styx-10-source-04-9x16-use-01", loading: "lazy", mediaClassName: "fit-contain", captionView: "lightbox-only" },
  ],
} as const satisfies MockupDeckData<MediaEntryId>;

export const styxProductionMockupDeck = {
  variant: "standard",
  device: "desktop",
  role: "wide",
  interval: 5000,
  captionView: "full",
  captions: "empty",
  slides: [
    {
      entryId: "styx-screenshot-2026-08-19-135302-use-01",
      loading: "eager",
      mediaClassName: "fit-contain",
    },
    {
      entryId: "styx-screenshot-2026-08-19-150208-use-01",
      loading: "eager",
      mediaClassName: "fit-contain",
    },
    {
      kind: "canvas-gallery",
      gallery: {
        profile: "production",
        variant: "masonry",
        ariaLabel: "Styx production masonry gallery",
        sources: [
        { entryId: "styx-07-source-01-4x5-use-01" },
        { entryId: "styx-07-source-02-4x5-use-01" },
        { entryId: "styx-07-source-03-4x5-use-01" },
        { entryId: "styx-07-source-04-4x5-use-01" },
        { entryId: "styx-07-source-05-4x5-use-01" },
        { entryId: "styx-07-source-06-591x640-use-01" },
        { entryId: "styx-08-source-01-4x5-use-01" },
        { entryId: "styx-08-source-02-4x5-use-01" },
        { entryId: "styx-08-source-03-4x5-use-01" },
        { entryId: "styx-08-source-04-1x1-use-01" },
        { entryId: "styx-08-source-05-1x1-use-01" },
        { entryId: "styx-08-source-06-1x1-use-01" },
        { entryId: "styx-08-source-07-4x5-use-01" },
        { entryId: "styx-08-source-08-4x5-use-01" },
        { entryId: "styx-08-source-09-4x5-use-01" },
        { entryId: "styx-09-source-01-1x1-use-01" },
        { entryId: "styx-09-source-02-3x4-use-01" },
        { entryId: "styx-09-source-03-1x1-use-01" },
        ],
      },
    },
  ],
} as const satisfies MockupDeckData<MediaEntryId>;
