import type { MediaAsset } from "../../../types/media.ts";
import { uploadedMediaAssets, type CmsMediaAssetId } from "../catalog.ts";
import {
  registeredMediaAssets,
  type RegisteredMediaAsset,
  type RegisteredMediaAssetId,
} from "./registered.ts";

export { registeredMediaAssets };
export type { RegisteredMediaAsset, RegisteredMediaAssetId };

export const mediaAssets = [
  ...registeredMediaAssets,
  ...uploadedMediaAssets,
] as const satisfies readonly MediaAsset[];

export type MediaAssetRecord = (typeof mediaAssets)[number];
export type MediaAssetId = RegisteredMediaAssetId | CmsMediaAssetId;
