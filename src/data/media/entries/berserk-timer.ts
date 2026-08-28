import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const berserkTimerMediaEntries = [
  {
    id: "berserk-timer-cover-use-01",
    assetId: "berserk-timer-cover",
    alt: "Berserk Timer",
    caption: {
      title: "Berserk Timer",
    },
    projectIds: ["berserk-timer"],
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
