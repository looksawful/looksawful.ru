import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

/** Lab-only placement for the AWFUL STUDIO approval card. */
export const awfulStudioLabMediaEntries = [
  {
    id: "awful-studio-lab-cover-use-01",
    assetId: "awful-studio-lab-cover",
    alt: "AWFUL STUDIO",
    caption: {
      title: "AWFUL STUDIO",
    },
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
