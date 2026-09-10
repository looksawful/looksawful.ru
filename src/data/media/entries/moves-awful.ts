import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const movesAwfulMediaEntries = [
  {
    id: "moves-awful-jestei-landing-animation-01-use-01",
    assetId: "jestei-landings-moves-awful-source-01-2044x1112",
    projectIds: ["jestei-landings", "moves-awful"],
    posterAssetId: "jestei-landings-moves-awful-poster-01-2044x1112",
    caption: {
      title: "Анимированная секция лендинга для клубных диджеев",
    },
  },
  {
    id: "moves-awful-jestei-landing-animation-02-use-01",
    assetId: "jestei-landings-moves-awful-source-02-2540x790",
    projectIds: ["jestei-landings", "moves-awful"],
    posterAssetId: "jestei-landings-moves-awful-poster-02-2540x790",
    caption: {
      title: "Анимированная секция лендинга для клубных диджеев",
    },
  },
  {
    id: "moves-awful-jestei-landing-animation-03-use-01",
    assetId: "jestei-landings-moves-awful-source-03-1914x1208",
    projectIds: ["jestei-landings", "moves-awful"],
    posterAssetId: "jestei-landings-moves-awful-poster-03-1914x1208",
    caption: {
      title: "Анимированная секция лендинга для клубных диджеев",
    },
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
