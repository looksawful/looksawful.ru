import type { MediaAsset } from "../../../types/media.ts";

export const igguanaMediaAssets = [
  {
      id: "igguana-11-source-01-1x1",
      type: "image",
      src: "/media/projects/shootings/11/source/01-1x1.webp",
      width: 568,
      height: 562,
    },
  {
      id: "igguana-11-source-02-4x5",
      type: "image",
      src: "/media/projects/shootings/11/source/02-4x5.webp",
      width: 1121,
      height: 1400,
    },
  {
      id: "igguana-11-source-03-4x5",
      type: "image",
      src: "/media/projects/shootings/11/source/03-4x5.webp",
      width: 1114,
      height: 1400,
    },
  {
      id: "igguana-11-source-04-4x5",
      type: "image",
      src: "/media/projects/shootings/11/source/04-4x5.webp",
      width: 1114,
      height: 1400,
    },
  {
      id: "igguana-11-source-05-2x3",
      type: "image",
      src: "/media/projects/shootings/11/source/05-2x3.webp",
      width: 935,
      height: 1400,
    },
  {
      id: "igguana-11-source-06-4x5",
      type: "image",
      src: "/media/projects/shootings/11/source/06-4x5.webp",
      width: 1120,
      height: 1400,
    },
] as const satisfies readonly MediaAsset[];
