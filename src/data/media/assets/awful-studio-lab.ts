import type { MediaAsset } from "../../../types/media.ts";

/** Lab-only review asset. Production AWFUL STUDIO media lives in the production preview branch. */
export const awfulStudioLabMediaAssets = [
  {
    id: "awful-studio-lab-cover",
    type: "image",
    src: "/lab-assets/awful-studio-overview.webp",
  },
] as const satisfies readonly MediaAsset[];
