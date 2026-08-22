import type { MediaAsset } from "../../../types/media.ts";

export const esmiMediaAssets = [
  {
      id: "esmi-12-source-01-1x1",
      type: "image",
      src: "/media/projects/shootings/12/source/01-1x1.webp",
      width: 950,
      height: 950,
    },
] as const satisfies readonly MediaAsset[];
