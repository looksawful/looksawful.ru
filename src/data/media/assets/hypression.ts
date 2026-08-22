import type { MediaAsset } from "../../../types/media.ts";

export const hypressionMediaAssets = [
  {
      id: "hypression-14-source-01-5x4",
      type: "image",
      src: "/media/projects/shootings/14/source/01-5x4.webp",
      width: 1280,
      height: 1024,
    },
  {
      id: "hypression-15-source-01-1x1",
      type: "image",
      src: "/media/projects/shootings/15/source/01-1x1.webp",
      width: 1400,
      height: 1400,
    },
  {
      id: "hypression-15-source-02-256x181",
      type: "image",
      src: "/media/projects/shootings/15/source/02-256x181.webp",
      width: 1280,
      height: 905,
    },
  {
      id: "hypression-16-source-01-479x671",
      type: "image",
      src: "/media/projects/shootings/16/source/01-479x671.webp",
      width: 479,
      height: 671,
    },
  {
      id: "hypression-16-source-02-2x3",
      type: "image",
      src: "/media/projects/shootings/16/source/02-2x3.webp",
      width: 853,
      height: 1280,
    },
  {
      id: "hypression-17-source-01-4x5",
      type: "image",
      src: "/media/projects/shootings/17/source/01-4x5.webp",
      width: 1118,
      height: 1400,
    },
  {
      id: "hypression-17-source-02-121x175",
      type: "image",
      src: "/media/projects/shootings/17/source/02-121x175.webp",
      width: 968,
      height: 1400,
    },
] as const satisfies readonly MediaAsset[];
