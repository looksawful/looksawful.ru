import type { MediaAsset } from "../../../types/media.ts";

export const movesAwfulMediaAssets = [
  {
      id: "moves-awful-01-poster-01-2044x1112",
      type: "image",
      src: "/media/projects/shared/moves-awful/01/poster/01-2044x1112.webp",
    },
  {
      id: "moves-awful-01-poster-02-2540x790",
      type: "image",
      src: "/media/projects/shared/moves-awful/01/poster/02-2540x790.webp",
    },
  {
      id: "moves-awful-01-poster-03-1914x1208",
      type: "image",
      src: "/media/projects/shared/moves-awful/01/poster/03-1914x1208.webp",
    },
  {
      id: "moves-awful-01-source-01-2044x1112",
      type: "video",
      src: "/media/projects/shared/moves-awful/01/source/01-2044x1112.mp4",
      width: 2044,
      height: 1112,
    },
  {
      id: "moves-awful-01-source-02-2540x790",
      type: "video",
      src: "/media/projects/shared/moves-awful/01/source/02-2540x790.mp4",
      width: 2540,
      height: 790,
    },
  {
      id: "moves-awful-01-source-03-1914x1208",
      type: "video",
      src: "/media/projects/shared/moves-awful/01/source/03-1914x1208.mp4",
      width: 1914,
      height: 1208,
    },
] as const satisfies readonly MediaAsset[];
