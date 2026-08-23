import type { ProjectIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";

import type { MediaEntryId } from "../media/index.ts";

import type { LogoUsageId } from "../logos/index.ts";

export const sandsIntro = {
  head: {
    type: "text",
    text: "S&S",
  },

  title: {
    type: "text",
    text: "S&S",
  },

  role: "СММ",
  period: "2018–2019",

  summary:
    "Бренд стильных боди и нижнего белья с акцентом на выразительный силуэт, женственность и современную подачу.",
} as const satisfies ProjectIntroData<LogoUsageId>;


export const sandsLookbookStrip = {
  "layout": "strip",
  "className": "feature-layout__rail",
  "captionView": "overlay",
  "head": {
    "credits": {
      "title": "Фотография для первого лукбука бренда."
    }
  },
  "height": "clamp(9rem, 18cqi, 14rem)",
  "infiniteReel": {
    "duration": "38s"
  },
  "items": [
    {
      "entryId": "sands-01-source-02-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-01-source-03-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-01-source-04-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-02-source-01-920x1289-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-02-source-02-2x3-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-02-source-03-2x3-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-04-source-01-2x3-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-04-source-02-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-04-source-03-920x1289-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-04-source-04-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "sands-04-source-05-2x3-use-01",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;

export const sandsFeatureMockupDeck = {
  variant: "mobile-device",
  captionView: "full",
  className: "feature-layout__mockup",
  interval: 4080,
  controls: false,
  slides: [
    {
      entryId: "sands-01-source-01-4x5-use-01",
      loading: "lazy",
      captionView: "full",
      mediaTitle: "Фотография для первого лукбука бренда.",
    },
    {
      entryId: "sands-05-source-16-1080x1920-use-01",
      loading: "lazy",
      captionView: "full",
    },
  ],
} as const satisfies MockupDeckData<MediaEntryId>;
