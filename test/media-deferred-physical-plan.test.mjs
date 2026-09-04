import assert from "node:assert/strict";
import test from "node:test";

import physicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };
import { registeredMediaAssets } from "../src/data/media/assets/registered.ts";

function physicalPath(asset) {
  return asset.src.startsWith("/") ? `public${asset.src}` : asset.src;
}

const assetById = new Map(registeredMediaAssets.map((asset) => [asset.id, asset]));
const assetByPhysicalPath = new Map(
  registeredMediaAssets.map((asset) => [physicalPath(asset), asset]),
);

test("deferred physical cleanup has one runtime rewrite and two quality promotions", () => {
  assert.equal(physicalSource.deferredRuntimeRewrites.length, 1);
  assert.equal(physicalSource.deferredQualityPromotions.length, 2);
});

test("quality promotion sources are not independent registered MediaAssets", () => {
  for (const promotion of physicalSource.deferredQualityPromotions) {
    const canonical = assetById.get(promotion.canonicalAssetId);
    assert.ok(canonical, `missing canonical asset ${promotion.canonicalAssetId}`);
    assert.equal(
      assetByPhysicalPath.has(promotion.bestSourcePath),
      false,
      `quality source is a registered asset and cannot be removed as a physical-only duplicate: ${promotion.bestSourcePath}`,
    );
    assert.notEqual(physicalPath(canonical), promotion.bestSourcePath);
  }
});
