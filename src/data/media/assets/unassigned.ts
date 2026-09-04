import type { MediaAsset } from "../../../types/media.ts";

export const unassignedMediaAssets = [
  {
      id: "portfolio-portfolio-extra-02-5x4",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-02-5x4.webp",
      width: 1400,
      height: 1120,
    },
  {
      id: "portfolio-portfolio-extra-03-700x559",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-03-700x559.webp",
      width: 1400,
      height: 1118,
    },
  {
      id: "portfolio-portfolio-extra-04-4x5",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-04-4x5.webp",
      width: 1120,
      height: 1400,
    },
  {
      id: "portfolio-portfolio-extra-05-4x5",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-05-4x5.webp",
      width: 1120,
      height: 1400,
    },
          {
      id: "portfolio-portfolio-extra-10-854x1280",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-10-854x1280.webp",
      width: 854,
      height: 1280,
    },
  {
      id: "portfolio-portfolio-extra-11-1x1",
      type: "image",
      src: "/media/projects/shootings/portfolio/source/portfolio-extra-11-1x1.webp",
      width: 600,
      height: 600,
    },
] as const satisfies readonly MediaAsset[];
