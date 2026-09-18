import type { MediaAsset } from "../../../types/media.ts";

export const deviceModelMediaAssets = [
  {
    id: "device-iphone-17-v30-model",
    type: "model",
    src: "/media/models/devices/iphone-17-v30.meshopt.glb",
    mimeType: "model/gltf-binary",
    byteLength: 2068960,
  },
  {
    id: "device-ipad-pro-11-m5-v6-model",
    type: "model",
    src: "/media/models/devices/ipad-pro-11-m5-v6.meshopt.glb",
    mimeType: "model/gltf-binary",
    byteLength: 298116,
  },
  {
    id: "device-ipad-pro-13-m5-v6-model",
    type: "model",
    src: "/media/models/devices/ipad-pro-13-m5-v6.meshopt.glb",
    mimeType: "model/gltf-binary",
    byteLength: 295380,
  },
  {
    id: "device-macbook-pro-14-m5-v1-model",
    type: "model",
    src: "/media/models/devices/macbook-pro-14-m5-v1.meshopt.glb",
    mimeType: "model/gltf-binary",
    byteLength: 166308,
  },
] as const satisfies readonly MediaAsset[];
