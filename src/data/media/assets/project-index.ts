import type { MediaAsset } from "../../../types/media.ts";

export const projectIndexMediaAssets = [
  {
    id: "project-index-jestei-pool-cover",
    type: "image",
    src: "/media/projects/index/jestei-pool-cover.webp",
    width: 1580,
    height: 1360,
  },
  {
    id: "project-index-styx-jewel-cover",
    type: "image",
    src: "/media/projects/index/styx-jewel-cover.webp",
    width: 1580,
    height: 1360,
  },
  {
    id: "project-index-sensetique-cover",
    type: "image",
    src: "/media/projects/index/sensetique-cover.webp",
    width: 1580,
    height: 1360,
  },
  {
    id: "project-index-shootings-cover",
    type: "image",
    src: "/media/projects/index/shootings-cover.webp",
    width: 1580,
    height: 1360,
  },
] as const satisfies readonly MediaAsset[];
