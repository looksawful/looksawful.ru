import { projects, type ProjectCardData, type ProjectId } from "../../projects.ts";
import type { ImageMedia } from "../../../types/media.ts";

export const PROJECT_INDEX_MEDIA_ASSET_IDS = {
  jestei: "project-index-jestei-pool-cover",
  styx: "project-index-styx-jewel-cover",
  sensetique: "project-index-sensetique-cover",
  shootings: "project-index-shootings-cover",
} as const satisfies Record<ProjectId, string>;

export type ProjectIndexMediaAssetId =
  (typeof PROJECT_INDEX_MEDIA_ASSET_IDS)[ProjectId];

export type ProjectIndexMediaAsset = ImageMedia & {
  id: ProjectIndexMediaAssetId;
};

export function projectIndexMediaAssetFor(
  project: Pick<ProjectCardData, "id" | "cover">,
): ProjectIndexMediaAsset {
  return {
    id: PROJECT_INDEX_MEDIA_ASSET_IDS[project.id],
    type: "image",
    src: project.cover.src,
    width: project.cover.width,
    height: project.cover.height,
  };
}

export const projectIndexMediaAssets = projects.map(projectIndexMediaAssetFor);
