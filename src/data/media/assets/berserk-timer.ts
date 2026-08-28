import type { MediaAsset } from "../../../types/media.ts";

export const berserkTimerMediaAssets = [
  {
    id: "berserk-timer-cover",
    type: "image",
    src: "/media/projects/berserk-timer/cover.webp",
    width: 1440,
    height: 900,
  },
] as const satisfies readonly MediaAsset[];
