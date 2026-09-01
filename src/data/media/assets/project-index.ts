import { homeCards, type HomeCardData, type HomeCardId } from "../../projects.ts";
import type { ImageMedia } from "../../../types/media.ts";

export const PROJECT_INDEX_MEDIA_ASSET_IDS = {
  jestei: "project-index-jestei-pool-cover",
  styx: "project-index-styx-jewel-cover",
  sensetique: "project-index-sensetique-cover",
  shootings: "project-index-shootings-cover",
} as const satisfies Record<HomeCardId, string>;

export type ProjectIndexMediaAssetId =
  (typeof PROJECT_INDEX_MEDIA_ASSET_IDS)[HomeCardId];

export type ProjectIndexMediaAsset = ImageMedia & {
  id: ProjectIndexMediaAssetId;
};

export function projectIndexMediaAssetFor(
  card: Pick<HomeCardData, "id" | "cover">,
): ProjectIndexMediaAsset {
  return {
    id: PROJECT_INDEX_MEDIA_ASSET_IDS[card.id],
    type: "image",
    src: card.cover.src,
    width: card.cover.width,
    height: card.cover.height,
  };
}

export const projectIndexMediaAssets = homeCards.map(projectIndexMediaAssetFor);
