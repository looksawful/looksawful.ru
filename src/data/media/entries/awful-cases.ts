import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awfulCasesMediaEntries = [
  {
    id: "awful-cases-assets-recording-2026-08-15-121210-use-01",
    assetId: "awful-cases-assets-recording-2026-08-15-121210",
    projectIds: ["awful-cases"],
    posterAssetId: "awful-cases-assets-recording-2026-08-15-121210-poster",
    caption: {
        title: "как это работает",
        index: 2,
    }
},
  {
    id: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
    assetId: "awful-cases-assets-screenshot-2026-08-14-174113",
    projectIds: ["awful-cases"],
    alt: "",
    caption: {
        title: "Параметры.",
        index: 3,
    }
},
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
