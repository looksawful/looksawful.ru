import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const berryMediaEntries = [
  {
    id: "berry-02-source-01-9x16-use-01",
    assetId: "berry-02-source-01-9x16",
    alt: "",
    caption: {
      title: "Сторис с услугами в инстаграме",
      index: 1,
    },
  },
  {
    id: "berry-02-source-02-9x16-use-01",
    assetId: "berry-02-source-02-9x16",
    alt: "",
    caption: {
      title: "Сторис с услугами в инстаграме",
      index: 2,
    },
  },
  {
    id: "berry-02-source-03-9x16-use-01",
    assetId: "berry-02-source-03-9x16",
    alt: "",
    caption: {
      title: "Сторис с услугами в инстаграме",
      index: 3,
    },
  },
  {
    id: "berry-02-source-04-9x16-use-01",
    assetId: "berry-02-source-04-9x16",
    alt: "",
    caption: {
      title: "Сторис с услугами в инстаграме",
      index: 4,
    },
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
