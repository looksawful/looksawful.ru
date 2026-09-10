import type { MediaAsset } from "../../../types/media.ts";

export const heroMediaAssets = [
  {
    id: "hero-portrait",
    type: "image",
    src: "/media/hero/hero-portrait.webp",
    width: 1122,
    height: 739,
  },
] as const satisfies readonly MediaAsset[];
