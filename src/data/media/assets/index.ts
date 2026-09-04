import type { MediaAsset } from "../../../types/media.ts";
import { uploadedMediaAssets, type CmsMediaAssetId } from "../catalog.ts";
import {
  canonicalRegisteredMediaAssets,
  registeredMediaAssets,
  type RegisteredMediaAsset,
  type RegisteredMediaAssetId,
} from "./registered.ts";

export { canonicalRegisteredMediaAssets, registeredMediaAssets };
export type { RegisteredMediaAsset, RegisteredMediaAssetId };

export const mediaAssets = [
  ...canonicalRegisteredMediaAssets,
  ...uploadedMediaAssets,
] as const satisfies readonly MediaAsset[];

export type MediaAssetRecord = (typeof mediaAssets)[number];
export type MediaAssetId = RegisteredMediaAssetId | CmsMediaAssetId;
