import type { BeforeAfterData } from "../../types/before-after.ts";
import type { MediaFigureData, MockupData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import { getCase, getRole } from "../catalog/lookup.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";
import { getJesteiEditorialOverlay, getJesteiEditorialSection, jesteiEditorialContent } from "./jestei-editorial.ts";

const jesteiCase = getCase("jestei-pool");
const artDirectorRole = getRole("art-director");

const jesteiHomeEditorial = getJesteiEditorialSection("home");
const jesteiBrandEditorial = getJesteiEditorialSection("brand");
const jesteiInterfaceEditorial = getJesteiEditorialSection("interface");
const jesteiEditorialEditorial = getJesteiEditorialSection("editorial");
const jesteiEventEditorial = getJesteiEditorialSection("event");
const jesteiLandingsEditorial = getJesteiEditorialSection("landings");
const jesteiPromoEditorial = getJesteiEditorialSection("promo");
const jesteiLogoGeometryOverlay = getJesteiEditorialOverlay("logo-geometry");
const jesteiProductColorOverlay = getJesteiEditorialOverlay("product-color");
const jesteiLogoVariantsOverlay = getJesteiEditorialOverlay("logo-variants");
const jesteiDesignSystemOverlay = getJesteiEditorialOverlay("design-system");
const jesteiDisplayTypeOverlay = getJesteiEditorialOverlay("display-type");
const jesteiAudiencesOverlay = getJesteiEditorialOverlay("audiences");

export const jesteiIntro = {
  head: { type: "logo", logoUsageId: "jestei-case-head-logo", wrapper: "none" },
  title: { type: "logo", logoUsageId: "jestei-case-title-logo" },
  role: artDirectorRole.name,
  period: jesteiCase.date,
  lead: jesteiEditorialContent.lead,
} as const satisfies ProjectIntroData<LogoUsageId>;

export const jesteiFeaturedMedia = { entryId: "jestei-01-source-01-823x419-use-01", presentation: "banner", captionView: "summary", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;
export const jesteiHomeIntro = { title: jesteiHomeEditorial.title, paragraphs: jesteiHomeEditorial.paragraphs } as const satisfies SectionIntroData;
export const jesteiHomeMockup = { entryId: "jestei-02-source-01-16x10-use-01", device: "desktop", role: "wide", captionView: "summary", loading: "eager" } as const satisfies MockupData<MediaEntryId>;
export const jesteiBrandIntro = { title: jesteiBrandEditorial.title, bodyClassName: "brand-system__intro", paragraphs: jesteiBrandEditorial.paragraphs } as const satisfies SectionIntroData;
export const jesteiInterfaceIntro = { title: jesteiInterfaceEditorial.title, bodyClassName: "jestei-section-copy-list", paragraphs: jesteiInterfaceEditorial.paragraphs } as const satisfies SectionIntroData;
export const jesteiEditorialIntro = { title: jesteiEditorialEditorial.title, paragraphs: jesteiEditorialEditorial.paragraphs } as const satisfies SectionIntroData;
export const jesteiRedpolitikaMockup = { entryId: "jestei-redpolitika-preview-use-01", device: "desktop", role: "wide", captionView: "lightbox-only", loading: "lazy", mediaClassName: "fit-cover" } as const satisfies MockupData<MediaEntryId>;
export const jesteiEventIntro = { title: jesteiEventEditorial.title, bodyClassName: "jestei-section-copy-list", paragraphs: jesteiEventEditorial.paragraphs } as const satisfies SectionIntroData;

export const jesteiEventGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "jestei-event-group jestei-captioned-group",
  captionView: "summary",
  items: [
    {
      entryId: "jestei-landings-moves-awful-source-01-use-jestei",
      className: "jestei-captioned-media jestei-event-video-item",
      surfaceClassName: "jestei-event-video-surface",
      surface: { ratio: "2248 / 1265" },
      captionFields: ["index", "title"],
      surfaceDeck: {
        className: "jestei-event-video-deck",
        autoplay: "off",
        advanceOnEnded: true,
        slides: [
          {
            entryId: "jestei-landings-moves-awful-source-01-use-jestei",
            video: {
              autoplay: true,
              muted: true,
              playsInline: true,
              preload: "metadata",
            },
          },
          {
            entryId: "jestei-landings-moves-awful-source-02-use-jestei",
            video: { muted: true, playsInline: true, preload: "metadata" },
          },
          {
            entryId: "jestei-landings-moves-awful-source-03-use-jestei",
            video: { muted: true, playsInline: true, preload: "metadata" },
          },
        ],
      },
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[0],
      },
    },
    {
      entryId: "jestei-03-source-01-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[1],
      },
      loading: "lazy",
    },
    {
      entryId: "jestei-03-source-03-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[2],
      },
      loading: "lazy",
    },
    {
      entryId: "jestei-03-source-04-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[3],
      },
      loading: "lazy",
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiLandingsIntro = { title: jesteiLandingsEditorial.title, paragraphs: jesteiLandingsEditorial.paragraphs } as const satisfies SectionIntroData;
export const jesteiLandingsMockup = { entryId: "jestei-13-source-13-1280x588-use-01", device: "desktop", captionView: "summary", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } } as const satisfies MockupData<MediaEntryId>;
export const jesteiPromoIntro = { title: jesteiPromoEditorial.title, paragraphs: jesteiPromoEditorial.paragraphs } as const satisfies SectionIntroData;


export const jesteiInstagramPlayerStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "infiniteReel": {
    "duration": "30s"
  },
  "items": [
    {
      "entryId": "jestei-04-source-01-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-02-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-03-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-04-323x623-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-05-323x623-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-06-323x623-use-01",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const jesteiPromoSequence = {
  "layout": "sequence",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "leading": {
    "entryId": "jestei-05-source-01-701x452-use-01",
    "loading": "lazy"
  },
  "middle": [
    {
      "entryId": "jestei-05-source-02-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-03-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-04-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-05-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-06-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-07-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-08-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-09-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-10-1x1-use-01",
      "loading": "lazy"
    }
  ],
  "trailing": {
    "entryId": "jestei-05-source-11-3x2-use-01",
    "loading": "lazy"
  }
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiBrandSystemGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "brand-system",
  captionView: "summary",
  items: [
    {
      entryId: "jestei-system-logo-source-logo-anatomy-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiLogoGeometryOverlay.text,
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-color-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiProductColorOverlay.text,
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-type-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiLogoVariantsOverlay.text,
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-system-01-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiDesignSystemOverlay.text,
      },
    },
    {
      entryId: "jestei-system-type-source-logo-druk-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiDisplayTypeOverlay.text,
      },
    },
    {
      entryId: "jestei-10-source-17-101x50-use-01",
      loading: "lazy",
      className: "brand-system__item brand-system__item--light",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: jesteiAudiencesOverlay.text,
      },
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiInterfaceGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "jestei-interface-group jestei-captioned-group",
  captionView: "summary",
  columns: 3,
  items: [
    {
      entryId: "jestei-02-source-02-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiInterfaceIntro.paragraphs[0],
      },
    },
    {
      entryId: "jestei-02-source-03-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiInterfaceIntro.paragraphs[1],
      },
    },
    {
      entryId: "jestei-02-source-04-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiInterfaceIntro.paragraphs[2],
      },
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiSubscriptionBeforeAfter = {
  captionView: "summary",
  before: {
    entryId: "jestei-06-source-01-16x9-use-01",
    loading: "lazy",
    label: "До",
  },
  after: {
    entryId: "jestei-06-source-02-16x9-use-01",
    loading: "lazy",
    label: "После",
  },
  caption: {
    index: 23,
    title: "Новый дизайн тарифов.",
    text: "Полностью переделали сценарий покупки подписки, объяснили разницу между тарифами и разделили предложения для разных сегментов с помощью цветовых профилей.",
  },
  value: 50,
  min: 0,
  max: 100,
  step: 0.1,
  ariaLabel: "Сравнить изображение до и после",
} as const satisfies BeforeAfterData<MediaEntryId>;
