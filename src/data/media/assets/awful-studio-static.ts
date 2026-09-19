import type { MediaAsset } from "../../../types/media.ts";

export const awfulStudioStaticMediaAssets = [
  { id: "awful-studio-scene-white", type: "image", src: "/media/projects/awful-studio/scene-white-studio.png", width: 960, height: 600 },
  { id: "awful-studio-scene-loft", type: "image", src: "/media/projects/awful-studio/scene-loft-daylight.png", width: 960, height: 600 },
  { id: "awful-studio-scene-neon", type: "image", src: "/media/projects/awful-studio/scene-dark-neon.png", width: 960, height: 600 },
  { id: "awful-studio-rig-front", type: "image", src: "/media/projects/awful-studio/studio-rig-front.png", width: 1024, height: 1024 },
  { id: "awful-studio-rig-three-quarter", type: "image", src: "/media/projects/awful-studio/studio-rig-three-quarter.png", width: 1024, height: 1024 },
  { id: "awful-studio-rig-fixture-detail", type: "image", src: "/media/projects/awful-studio/studio-rig-fixture-detail.png", width: 1024, height: 1024 },
  { id: "awful-studio-rig-magnum-detail", type: "image", src: "/media/projects/awful-studio/studio-rig-magnum-detail.png", width: 1024, height: 1024 },
] as const satisfies readonly MediaAsset[];
