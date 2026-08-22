import type { MediaAsset } from "../../../types/media.ts";

export const awfulCasesMediaAssets = [
  {
      id: "awful-cases-assets-recording-2026-08-15-121210-poster",
      type: "image",
      src: "/pets/awful-cases/assets/recording-2026-08-15-121210-poster.webp",
    },
  {
      id: "awful-cases-assets-recording-2026-08-15-121210",
      type: "video",
      src: "/pets/awful-cases/assets/recording-2026-08-15-121210.mp4",
      width: 1720,
      height: 880,
    },
  {
      id: "awful-cases-assets-screenshot-2026-08-14-174113",
      type: "image",
      src: "/pets/awful-cases/assets/screenshot-2026-08-14-174113.png",
      width: 2039,
      height: 1104,
    },
] as const satisfies readonly MediaAsset[];
