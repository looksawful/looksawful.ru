import type { MediaAsset } from "../../../types/media.ts";

export const usefulMediaAssets = [
  {
    id: "useful-awful-cases-cover-poster",
    type: "image",
    src: "/media/projects/useful/awful-cases-cover.webp",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-awful-cases-cover",
    type: "video",
    src: "/media/projects/useful/awful-cases-cover.mp4",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-moves-awful-cover-poster",
    type: "image",
    src: "/media/projects/useful/moves-awful-cover.webp",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-moves-awful-cover",
    type: "video",
    src: "/media/projects/useful/moves-awful-cover.mp4",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-berserk-timer-cover",
    type: "image",
    src: "/media/projects/useful/berserk-timer-cover.webp",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-awful-studio-cover",
    type: "image",
    src: "/media/projects/useful/awful-studio-cover.webp",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-awful-mockups-cover",
    type: "image",
    src: "/media/projects/useful/awful-mockups-cover.webp",
    width: 1080,
    height: 1350,
  },
  {
    id: "useful-awful-3d-mockups-cover",
    type: "image",
    src: "/media/projects/useful/awful-3d-mockups-cover.webp",
    width: 1080,
    height: 1350,
  },
] as const satisfies readonly MediaAsset[];
