import type { MediaAsset } from "../../../types/media.ts";

export const awfulCasesMediaAssets = [
  { id: "awful-cases-atlas", type: "image", src: "/media/interactive/awful-cases-atlas.png", width: 1620, height: 230 },
  { id: "awful-cases-assets-decor-1", type: "image", src: "/pets/awful-cases/assets/decor-1.png", width: 58, height: 51 },
  { id: "awful-cases-assets-decor-2", type: "image", src: "/pets/awful-cases/assets/decor-2.png", width: 58, height: 52 },
  { id: "awful-cases-assets-decor-3", type: "image", src: "/pets/awful-cases/assets/decor-3.png", width: 79, height: 53 },
  { id: "awful-cases-assets-fall1", type: "image", src: "/pets/awful-cases/assets/fall1.png", width: 121, height: 73 },
  { id: "awful-cases-assets-fall2", type: "image", src: "/pets/awful-cases/assets/fall2.png", width: 130, height: 59 },
  { id: "awful-cases-assets-flag", type: "image", src: "/pets/awful-cases/assets/flag.png", width: 52, height: 90 },
  { id: "awful-cases-assets-ground", type: "image", src: "/pets/awful-cases/assets/ground.png", width: 125, height: 46 },
  { id: "awful-cases-assets-pit", type: "image", src: "/pets/awful-cases/assets/pit.png", width: 114, height: 44 },
  { id: "awful-cases-assets-victory", type: "image", src: "/pets/awful-cases/assets/victory.png", width: 90, height: 95 },
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
