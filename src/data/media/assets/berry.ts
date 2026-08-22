import type { MediaAsset } from "../../../types/media.ts";

export const berryMediaAssets = [
  {
    id: "berry-02-source-01-9x16",
    type: "image",
    src: "/media/projects/berry/02/source/01-9x16.webp",
    width: 788,
    height: 1400,
  },
  {
    id: "berry-02-source-02-9x16",
    type: "image",
    src: "/media/projects/berry/02/source/02-9x16.webp",
    width: 788,
    height: 1400,
  },
  {
    id: "berry-02-source-03-9x16",
    type: "image",
    src: "/media/projects/berry/02/source/03-9x16.webp",
    width: 788,
    height: 1400,
  },
  {
    id: "berry-02-source-04-9x16",
    type: "image",
    src: "/media/projects/berry/02/source/04-9x16.webp",
    width: 788,
    height: 1400,
  },
] as const satisfies readonly MediaAsset[];
