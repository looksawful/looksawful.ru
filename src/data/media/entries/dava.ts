import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const davaMediaEntries = [
  {
    id: "dava-23-source-01-934x1400-use-01",
    assetId: "dava-23-source-01-934x1400",
    projectIds: ["shootings-dava"],
    alt: "",
    caption: {
      title: "Фото для обложки Dava — Дикая любовь",
    },
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
