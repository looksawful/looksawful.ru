import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";

import type { JustifiedGalleryData } from "../../types/justified-gallery.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaFigureData } from "../../types/media-presentation.ts";
import type { MediaSliderData } from "../../types/media-slider.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";

import type { MediaEntryId } from "../media/index.ts";
import type { PageFlipData } from "../../types/page-flip.ts";

import type { LogoUsageId } from "../logos/index.ts";
import {
  getSensetiqueEditorialCredit,
  getSensetiqueEditorialNote,
  getSensetiqueEditorialSection,
  sensetiqueEditorialContent,
} from "./sensetique-editorial.ts";

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

  role: sensetiqueEditorialContent.intro.role,
  period: sensetiqueEditorialContent.intro.period,

  lead: sensetiqueEditorialContent.intro.lead,
} as const satisfies ProjectIntroData<LogoUsageId>;

export const sensetiqueStudioIntro = {
  title: getSensetiqueEditorialSection("studio").title,

  paragraphs: getSensetiqueEditorialSection("studio").paragraphs,
} as const satisfies SectionIntroData;

export const sensetiqueProductionIntro = {
  title: getSensetiqueEditorialSection("production").title,

  paragraphs: getSensetiqueEditorialSection("production").paragraphs,
} as const satisfies SectionIntroData;


export const sensetiqueBuro247Group = {
  layout: "editorial",

  captionView: "overlay",

  head: {
    credits: { lines: getSensetiqueEditorialCredit("buro247").lines! },

    note: { kind: "editorial", text: getSensetiqueEditorialNote("buro247").text },
  },

  items: [
    { entryId: "sensetique-04-source-12-544x763-use-02", loading: "lazy", role: "wide", start: 1, span: 8 },
    { entryId: "sensetique-04-source-13-4x5-use-02", loading: "lazy", start: 9, span: 4 },
    { entryId: "sensetique-05-source-03-375x538-use-02", loading: "lazy", start: 1, span: 4 },
    { entryId: "sensetique-11-source-22-937x1171-use-02", loading: "lazy", start: 5, span: 4 },
    { entryId: "sensetique-11-source-26-129x160-use-02", loading: "lazy", start: 9, span: 4 },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const sensetiqueOlovoBookletGroup = {
  layout: "grid",

  captionView: "overlay",

  columns: 2,
  mobileColumns: 1,

  head: {
    credits: { title: getSensetiqueEditorialCredit("olovo-booklet").title! },
  },

  items: [
    { entryId: "sensetique-14-source-01-3508x2481-use-02", loading: "lazy" },
    { entryId: "sensetique-14-source-02-3508x2481-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const sensetiqueTatianaNikishinaEditorialGroup = {
  layout: "grid",

  captionView: "overlay",

  columns: 4,

  head: {
    credits: { lines: getSensetiqueEditorialCredit("tatiana-nikishina").lines! },
  },

  items: [
    { entryId: "sensetique-04-source-16-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-09-source-33-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-09-source-36-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-11-source-02-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-13-source-39-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-13-source-42-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-13-source-45-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-13-source-48-4x5-use-03", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const sensetiqueKatyaKnyazevaEditorialGroup = {
  layout: "grid",

  captionView: "overlay",

  columns: 4,
  mobileColumns: 2,

  head: {
    credits: { lines: getSensetiqueEditorialCredit("katya-knyazeva").lines! },
  },

  items: [
    { entryId: "sensetique-04-source-10-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-09-source-11-857x1200-use-03", loading: "lazy" },
    { entryId: "sensetique-09-source-18-4x5-use-03", loading: "lazy" },
    { entryId: "sensetique-09-source-19-2x3-use-03", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const sensetiqueYuriIvanovEditorialGroup = {
  layout: "grid",

  captionView: "overlay",

  head: {
    credits: { lines: getSensetiqueEditorialCredit("yuri-ivanov").lines! },
  },

  items: [
    { entryId: "sensetique-04-source-17-247x320-use-02", loading: "lazy" },
    { entryId: "sensetique-09-source-47-247x320-use-02", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;


export const portfolioSensetiqueStrip = {
  "layout": "strip",
  "className": "portfolio-showcase__group",
  "captionView": "overlay",
  "infiniteReel": {
    "duration": "68s"
  },
  "items": [
    {
      "entryId": "sensetique-04-source-07-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-08-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-69-320x213-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-70-929x800-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-14-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-65-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-66-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-68-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-50-5x7-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-51-5x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-05-233x350-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-37-17x11-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-05-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-88-128x175-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-89-103x140-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-90-117x160-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-92-47x70-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-93-128x175-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-46-175x128-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-56-16x9-use-01",
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
      "entryId": "sensetique-13-source-38-1023x1400-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-02-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-38-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-40-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-28-16x9-use-01",
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
      "entryId": "sensetique-04-source-03-3x2-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-08-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-58-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-59-854x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-98-187x280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-99-187x280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-100-187x280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-104-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-105-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-106-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-04-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-09-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-27-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-16-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-12-544x763-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-13-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-05-source-03-375x538-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-22-937x1171-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-26-129x160-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-101-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-102-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-103-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-107-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-108-1x1-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-14-source-01-3508x2481-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-14-source-02-3508x2481-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-22-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-23-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-29-197x256-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-35-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-37-1023x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-41-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-45-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-47-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-50-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-55-853x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-64-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-11-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-13-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-74-187x280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-76-187x280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-78-933x1400-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-80-1280x911-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-82-160x113-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-83-40x71-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-84-640x491-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-85-1280x911-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-87-256x181-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-01-source-08-3x2-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-05-source-01-3x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-12-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-03-7x8-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-04-1159x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-05-969x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-95-640x457-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-96-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-15-953x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-34-985x1280-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-97-16x9-use-01",
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
      "entryId": "sensetique-04-source-16-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-33-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-36-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-02-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-39-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-42-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-45-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-48-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-52-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-53-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-54-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-55-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-13-source-56-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-10-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-11-857x1200-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-18-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-19-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-15-3x4-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-71-263x320-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-72-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-73-640x427-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-09-183x256-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-10-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-12-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-08-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-09-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-10-223x320-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-11-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-12-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-13-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-12-source-14-427x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-04-source-17-247x320-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-47-247x320-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-03-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-04-2x3-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-09-source-05-3x2-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-14-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-16-457x640-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    },
    {
      "entryId": "sensetique-11-source-17-4x5-use-01",
      "loading": "lazy",
      "className": "portfolio-showcase__item"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueStudioInfiniteStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "height": "clamp(10rem, 20cqi, 15rem)",
  "infiniteReel": {
    "duration": "34s"
  },
  "items": [
    {
      "entryId": "sensetique-13-source-01-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-02-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-03-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-06-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-07-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-08-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-09-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-10-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-11-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-12-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-13-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-10-source-11-1x1-use-01",
      "loading": "lazy"
    }
  ],
  "element": "div"
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueHarshLightStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "height": "clamp(12rem, 30cqi, 20rem)",
  "head": {
    "credits": { title: getSensetiqueEditorialCredit("harsh-light").title!, lines: getSensetiqueEditorialCredit("harsh-light").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-04-source-14-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-65-853x1280-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-66-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-68-4x5-use-03",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueRaputoEditorialStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("raputo-editorial").lines! }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "sensetique-13-source-50-5x7-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-51-5x4-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-05-233x350-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueYoungPioneerSequence = {
  "layout": "sequence",
  "captionView": "overlay",
  "columns": 3,
  "ratio": "4 / 5",
  "head": {
    "credits": { title: getSensetiqueEditorialCredit("young-pioneer-sequence").title!, lines: getSensetiqueEditorialCredit("young-pioneer-sequence").lines! }
  },
  "leading": {
    "entryId": "sensetique-09-source-37-17x11-use-02",
    "loading": "lazy",
    "surface": {
      "fit": "contain"
    }
  },
  "middle": [
    {
      "entryId": "sensetique-05-source-02-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-88-128x175-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-89-103x140-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-90-117x160-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-92-47x70-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-93-128x175-use-03",
      "loading": "lazy"
    }
  ],
  "trailing": {
    "entryId": "sensetique-09-source-46-175x128-use-02",
    "loading": "lazy",
    "surface": {
      "fit": "contain"
    }
  }
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueKrasotaDressStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("krasota-dress").lines! }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "sensetique-13-source-38-1023x1400-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-04-source-02-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-02-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-38-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-40-2x3-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueOlovoCampaignStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("olovo-campaign").lines! }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "sensetique-04-source-03-3x2-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-08-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-58-853x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-59-854x1280-use-02",
      "loading": "lazy"
    }
  ],
  "element": "div"
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueOlovoLookbook2016Reel = {
  "layout": "grid",
  "mode": "compact-reel",
  "captionView": "overlay",
  "columns": 3,
  "compactItemSize": "min(68cqi, 17rem)",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("olovo-lookbook-2016").lines! },
    "note": { kind: "editorial", text: getSensetiqueEditorialNote("olovo-lookbook-2016").text }
  },
  "items": [
    {
      "entryId": "sensetique-11-source-98-187x280-use-02",
      "loading": "lazy",
      "surfaceClassName": "surface-muted"
    },
    {
      "entryId": "sensetique-11-source-99-187x280-use-02",
      "loading": "lazy",
      "surfaceClassName": "surface-muted"
    },
    {
      "entryId": "sensetique-11-source-100-187x280-use-02",
      "loading": "lazy",
      "surfaceClassName": "surface-muted"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueOlovoLookbook2018Reel = {
  "layout": "grid",
  "mode": "compact-reel",
  "captionView": "overlay",
  "columns": 3,
  "compactItemSize": "min(68cqi, 17rem)",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("olovo-lookbook-2018").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-11-source-104-853x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-105-853x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-106-853x1280-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueInnaHonourReel = {
  "layout": "grid",
  "mode": "compact-reel",
  "captionView": "overlay",
  "columns": 4,
  "compactItemSize": "min(68cqi, 17rem)",
  "head": {
    "className": "split split-always",
    "style": "--split-min: 12rem; --split-gap: clamp(1rem, 6cqi, 6rem)",
    "credits": { lines: getSensetiqueEditorialCredit("inna-honour").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-04-source-04-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-04-source-09-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-27-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-16-853x1280-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueOlovoArchitectureStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "head": {
    "credits": { title: getSensetiqueEditorialCredit("olovo-architecture").title!, lines: getSensetiqueEditorialCredit("olovo-architecture").lines! }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "sensetique-11-source-101-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-102-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-103-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-107-1x1-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-108-1x1-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueChapurinBentoGroup = {
  "layout": "editorial",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("chapurin").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-09-source-22-457x640-use-03",
      "loading": "lazy",
      "start": 1,
      "span": 4
    },
    {
      "entryId": "sensetique-09-source-23-457x640-use-03",
      "loading": "lazy",
      "start": 5,
      "span": 4
    },
    {
      "entryId": "sensetique-11-source-29-197x256-use-03",
      "loading": "lazy",
      "start": 9,
      "span": 4
    },
    {
      "entryId": "sensetique-11-source-35-4x5-use-03",
      "loading": "lazy",
      "start": 1,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-37-1023x1280-use-03",
      "loading": "lazy",
      "start": 4,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-41-4x5-use-03",
      "loading": "lazy",
      "start": 7,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-45-853x1280-use-03",
      "loading": "lazy",
      "start": 10,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-47-853x1280-use-03",
      "loading": "lazy",
      "start": 1,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-50-853x1280-use-03",
      "loading": "lazy",
      "start": 4,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-55-853x1280-use-03",
      "loading": "lazy",
      "start": 7,
      "span": 3
    },
    {
      "entryId": "sensetique-11-source-64-457x640-use-03",
      "loading": "lazy",
      "start": 10,
      "span": 3
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueYoungPioneerStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "height": "clamp(12rem, 30cqi, 20rem)",
  "head": {
    "credits": { title: getSensetiqueEditorialCredit("young-pioneer-strip").title!, lines: getSensetiqueEditorialCredit("young-pioneer-strip").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-04-source-11-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-13-2x3-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-74-187x280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-76-187x280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-78-933x1400-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-80-1280x911-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-82-160x113-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-83-40x71-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-84-640x491-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-85-1280x911-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-87-256x181-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueDaniilKorotechenkovSequence = {
  "layout": "sequence",
  "captionView": "overlay",
  "ratio": "4 / 5",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("daniil-korotechenkov").lines! }
  },
  "leading": {
    "entryId": "sensetique-01-source-08-3x2-use-02",
    "loading": "lazy",
    "surface": {
      "fit": "contain"
    }
  },
  "middle": [
    {
      "entryId": "sensetique-05-source-01-3x4-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-12-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-03-7x8-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-04-1159x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-05-969x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-95-640x457-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-96-457x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-15-953x1280-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-34-985x1280-use-02",
      "loading": "lazy"
    }
  ],
  "trailing": {
    "entryId": "sensetique-11-source-97-16x9-use-02",
    "surface": {
      "fit": "contain"
    },
    "video": {
      "autoplay": true,
      "loop": true,
      "muted": true,
      "playsInline": true,
      "preload": "metadata",
      "mimeType": "video/mp4"
    }
  }
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueTatianaNikishinaSupplementalReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("tatiana-nikishina-supplemental").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-13-source-52-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-53-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-54-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-55-4x5-use-03",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-13-source-56-4x5-use-03",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueWoodMetalPanicStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "height": "clamp(12rem, 30cqi, 20rem)",
  "head": {
    "credits": { title: getSensetiqueEditorialCredit("wood-metal-panic").title!, lines: getSensetiqueEditorialCredit("wood-metal-panic").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-04-source-15-3x4-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-71-263x320-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-72-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-73-640x427-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-09-183x256-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-10-457x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-12-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-08-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-09-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-10-223x320-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-11-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-12-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-13-427x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-12-source-14-427x640-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueIvanKrushinskyEditorialStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("ivan-krushinsky").lines! }
  },
  "height": "clamp(12rem, 30cqi, 20rem)",
  "items": [
    {
      "entryId": "sensetique-09-source-03-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-04-2x3-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-09-source-05-3x2-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const sensetiqueEditorialProductionReel = {
  "layout": "grid",
  "mode": "overflow-reel",
  "captionView": "overlay",
  "head": {
    "credits": { lines: getSensetiqueEditorialCredit("editorial-production").lines! }
  },
  "items": [
    {
      "entryId": "sensetique-11-source-14-4x5-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-16-457x640-use-02",
      "loading": "lazy"
    },
    {
      "entryId": "sensetique-11-source-17-4x5-use-02",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;

export const sensetiqueStudioJustifiedGallery = {
  captionView: "overlay",
  rows: [
    {
      kind: "landscape",
      items: [
        { entryId: "sensetique-01-source-06-3x2-use-01", loading: "lazy", surface: { ratio: "3 / 2" } },
        { entryId: "sensetique-11-source-21-640x427-use-01", loading: "lazy", surface: { ratio: "640 / 427" } },
      ],
    },
    {
      kind: "portrait",
      items: [
        { entryId: "sensetique-04-source-05-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
        { entryId: "sensetique-02-source-03-4x5-use-01", loading: "lazy", surface: { ratio: "4 / 5" } },
        { entryId: "sensetique-01-source-03-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
        { entryId: "sensetique-10-source-02-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
      ],
    },
    {
      kind: "landscape",
      items: [
        { entryId: "sensetique-11-source-24-640x427-use-01", loading: "lazy", surface: { ratio: "640 / 427" } },
        { entryId: "sensetique-11-source-27-640x427-use-01", loading: "lazy", surface: { ratio: "640 / 427" } },
      ],
    },
    {
      kind: "mixed",
      items: [
        { entryId: "sensetique-11-source-23-427x640-use-01", loading: "lazy", surface: { ratio: "427 / 640" } },
        { entryId: "sensetique-07-source-03-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
        { entryId: "sensetique-09-source-17-9x16-use-01", loading: "lazy", surface: { ratio: "9 / 16" } },
      ],
    },
    {
      kind: "mixed",
      items: [
        { entryId: "sensetique-09-source-15-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
        { entryId: "sensetique-01-source-04-3x4-use-01", loading: "lazy", surface: { ratio: "3 / 4" } },
      ],
    },
    {
      kind: "portrait",
      items: [
        { entryId: "sensetique-04-source-07-2x3-use-02", loading: "lazy", surface: { ratio: "2 / 3" } },
        { entryId: "sensetique-04-source-08-2x3-use-03", loading: "lazy", surface: { ratio: "2 / 3" } },
      ],
    },
  ],
} as const satisfies JustifiedGalleryData<MediaEntryId>;

export const sensetiqueHarshLightSlider = {
  captionView: "full",
  slides: [
    {
      entryId: "sensetique-11-source-69-320x213-use-03",
      captionView: "lightbox-only",
      loading: "lazy",
    },
    {
      entryId: "sensetique-11-source-70-929x800-use-02",
      captionView: "lightbox-only",
      loading: "lazy",
    },
  ],
} as const satisfies MediaSliderData<MediaEntryId>;

export const sensetiqueKrasotaDressVideo = {
  entryId: "sensetique-09-source-56-16x9-use-02",
  captionView: "summary",
  loading: "lazy",
  surface: { ratio: "16 / 9" },
  video: {
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: "metadata",
    mimeType: "video/mp4",
  },
} as const satisfies MediaFigureData<MediaEntryId>;

export const sensetiqueOlovoBackstageVideo = {
  entryId: "sensetique-11-source-28-16x9-use-02",
  captionView: "summary",
  loading: "lazy",
  surface: { ratio: "16 / 9" },
  video: {
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: "metadata",
    mimeType: "video/mp4",
  },
} as const satisfies MediaFigureData<MediaEntryId>;

export const sensetiqueDigitalFearPageFlip = {
  credits: { title: getSensetiqueEditorialCredit("digital-fear").title!, lines: getSensetiqueEditorialCredit("digital-fear").lines! },
  lightbox: false,
  pages: [
    { entryId: "sensetique-11-source-06-911x1280-use-01", index: 111, density: "soft", loading: "lazy" },
    { entryId: "sensetique-11-source-07-85x128-use-01", index: 112, density: "soft", loading: "lazy" },
    { entryId: "sensetique-11-source-08-431x640-use-01", index: 113, density: "soft", loading: "lazy" },
    { entryId: "sensetique-11-source-11-913x1280-use-01", index: 114, density: "soft", loading: "lazy" },
    { entryId: "sensetique-09-source-34-256x195-use-01", index: 115, density: "soft", loading: "lazy" },
    { entryId: "sensetique-09-source-35-256x195-use-01", index: 116, density: "soft", loading: "lazy" },
  ],
} as const satisfies PageFlipData<MediaEntryId>;

export const sensetiqueStudioMockupDeck = {
  variant: "standard",
  device: "desktop",
  captionView: "full",
  slides: [
    {
      entryId: "sensetique-01-source-01-35x18-use-01",
      loading: "lazy",
      mediaDimensions: false,
      captionView: "lightbox-only",
      caption: {
        index: 1,
        title: "Главная страница сайта студии.",
        text: "В 2018 году мы закончили строительство трёх съёмочных пространств в здании завода на улице Дмитрия Ульянова, 42.",
      },
    },
    {
      kind: "canvas-gallery",
      className: "sensetique-slider-canvas-slide",
      ariaHidden: true,
      captionView: "lightbox-only",
      caption: {
        title: "Фотографии и визуалы проекта Sensetique.",
      },
      gallery: {
        profile: "production",
        variant: "masonry",
        ariaLabel: "Production masonry gallery",
        className: "sensetique-production-moves-masonry",
        sources: [
        { entryId: "sensetique-09-source-22-457x640-use-01", sourceIndex: 98 },
        { entryId: "sensetique-09-source-23-457x640-use-01", sourceIndex: 99 },
        { entryId: "sensetique-11-source-29-197x256-use-01", sourceIndex: 100 },
        { entryId: "sensetique-11-source-35-4x5-use-01", sourceIndex: 101 },
        { entryId: "sensetique-11-source-37-1023x1280-use-01", sourceIndex: 102 },
        { entryId: "sensetique-11-source-41-4x5-use-01", sourceIndex: 103 },
        { entryId: "sensetique-11-source-45-853x1280-use-01", sourceIndex: 104 },
        { entryId: "sensetique-11-source-47-853x1280-use-01", sourceIndex: 105 },
        { entryId: "sensetique-11-source-50-853x1280-use-01", sourceIndex: 106 },
        { entryId: "sensetique-11-source-55-853x1280-use-01", sourceIndex: 107 },
        { entryId: "sensetique-11-source-56-5x4-use-01", sourceIndex: 108, mediaCredits: "Фотограф Андрей Рапуто,стилист Мария Жукова,продюсер Иван Крушинский" },
        { entryId: "sensetique-11-source-58-1280x799-use-01", sourceIndex: 109 },
        { entryId: "sensetique-11-source-60-1280x799-use-01", sourceIndex: 110 },
        { entryId: "sensetique-11-source-64-457x640-use-01", sourceIndex: 111 },
        { entryId: "sensetique-04-source-14-4x5-use-01", sourceIndex: 114 },
        { entryId: "sensetique-11-source-65-853x1280-use-01", sourceIndex: 115 },
        { entryId: "sensetique-11-source-66-4x5-use-01", sourceIndex: 116 },
        { entryId: "sensetique-11-source-68-4x5-use-01", sourceIndex: 117 },
        { entryId: "sensetique-11-source-81-40x71-use-01", sourceIndex: 125, mediaCredits: "Фотограф Никита Игнатов, стилист Мария Жукова, Kaltblut Magazine." },
        { entryId: "sensetique-11-source-83-40x71-use-01", sourceIndex: 127 },
        { entryId: "sensetique-09-source-13-2x3-use-01", sourceIndex: 119 },
        { entryId: "sensetique-05-source-02-4x5-use-01", sourceIndex: 132 },
        { entryId: "sensetique-11-source-88-128x175-use-01", sourceIndex: 133 },
        { entryId: "sensetique-11-source-89-103x140-use-01", sourceIndex: 134 },
        { entryId: "sensetique-11-source-90-117x160-use-01", sourceIndex: 135 },
        { entryId: "sensetique-11-source-92-47x70-use-01", sourceIndex: 136 },
        { entryId: "sensetique-11-source-93-128x175-use-01", sourceIndex: 137 },
        { entryId: "sensetique-04-source-08-2x3-use-01", sourceIndex: 146, mediaCredits: "стилист Мария Жукова, фотограф Андрей Рапуто." },
        { entryId: "sensetique-04-source-16-4x5-use-01", sourceIndex: 160 },
        { entryId: "sensetique-09-source-33-4x5-use-01", sourceIndex: 161 },
        { entryId: "sensetique-09-source-36-4x5-use-01", sourceIndex: 162 },
        { entryId: "sensetique-11-source-02-4x5-use-01", sourceIndex: 163 },
        { entryId: "sensetique-13-source-39-4x5-use-01", sourceIndex: 164 },
        { entryId: "sensetique-13-source-42-4x5-use-01", sourceIndex: 165 },
        { entryId: "sensetique-13-source-45-4x5-use-01", sourceIndex: 166 },
        { entryId: "sensetique-13-source-48-4x5-use-01", sourceIndex: 167 },
        { entryId: "sensetique-12-source-07-3x4-use-01", sourceIndex: 168, mediaTitle: "Бейкстейдж из студии", mediaCredits: "Фотограф Татьяна Никишина стилист Мария Жукова продюсер Иван Крушинский" },
        { entryId: "sensetique-13-source-52-4x5-use-01", sourceIndex: 169 },
        { entryId: "sensetique-13-source-53-4x5-use-01", sourceIndex: 170 },
        { entryId: "sensetique-13-source-54-4x5-use-01", sourceIndex: 171 },
        { entryId: "sensetique-13-source-55-4x5-use-01", sourceIndex: 172 },
        { entryId: "sensetique-13-source-56-4x5-use-01", sourceIndex: 173 },
        { entryId: "sensetique-04-source-10-4x5-use-01", sourceIndex: 174 },
        { entryId: "sensetique-09-source-11-857x1200-use-01", sourceIndex: 175 },
        { entryId: "sensetique-09-source-18-4x5-use-01", sourceIndex: 176 },
        { entryId: "sensetique-09-source-19-2x3-use-01", sourceIndex: 177 },
        { entryId: "sensetique-13-source-60-3x4-use-01", sourceIndex: 203, mediaTitle: "Стилизация команды Sensetique.", mediaCredits: "Стилист Мария Жукова" },
        { entryId: "sensetique-13-source-61-914x1280-use-01", sourceIndex: 204, mediaTitle: "Стилизация команды Sensetique.", mediaCredits: "Стилист Мария Жукова" },
        { entryId: "sensetique-13-source-62-852x1280-use-01", sourceIndex: 205, mediaTitle: "Стилизация команды Sensetique.", mediaCredits: "Стилист Мария Жукова" },
        ],
      },
    },
    {
      entryId: "sensetique-11-source-69-320x213-use-03",
      loading: "lazy",
      mediaDimensions: false,
      captionView: "lightbox-only",
      caption: {
        index: 29,
        title: "HARSH LIGHT, 2018.",
        meta: [
          "Фотограф Андрей Рапуто, Стилист Мария Жукова, Продюсер Иван Крушинский.",
        ],
      },
    },
  ],
} as const satisfies MockupDeckData<MediaEntryId>;
