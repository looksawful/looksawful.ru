import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const deviceModelMediaEntries = [
  {
    id: "device-iphone-17-v30-model-use-01",
    assetId: "device-iphone-17-v30-model",
    purpose: "supporting",
  },
  {
    id: "device-ipad-pro-11-m5-v6-model-use-01",
    assetId: "device-ipad-pro-11-m5-v6-model",
    purpose: "supporting",
  },
  {
    id: "device-ipad-pro-13-m5-v6-model-use-01",
    assetId: "device-ipad-pro-13-m5-v6-model",
    purpose: "supporting",
  },
  {
    id: "device-macbook-pro-14-m5-v1-model-use-01",
    assetId: "device-macbook-pro-14-m5-v1-model",
    purpose: "supporting",
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
