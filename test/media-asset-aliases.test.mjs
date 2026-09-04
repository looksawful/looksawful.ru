import assert from "node:assert/strict";
import test from "node:test";

import {
  retiredMediaAssetAliasRecords,
  retiredMediaAssetIds,
} from "../src/data/media/asset-aliases.ts";
import { mediaAssets } from "../src/data/media/assets/index.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";

test("reviewed dedupe aliases resolve to canonical runtime assets", () => {
  assert.equal(retiredMediaAssetAliasRecords.length, 24);
  assert.equal(retiredMediaAssetIds.size, 24);

  const runtimeIds = new Set(mediaAssets.map(({ id }) => id));
  assert.equal(runtimeIds.size, mediaAssets.length, "runtime MediaAsset ids must be unique");

  for (const { fromAssetId, toAssetId } of retiredMediaAssetAliasRecords) {
    assert.equal(runtimeIds.has(fromAssetId), false, `retired asset remains: ${fromAssetId}`);
    assert.equal(runtimeIds.has(toAssetId), true, `canonical asset missing: ${toAssetId}`);
  }
});

test("no runtime MediaEntry points at a retired duplicate asset", () => {
  const retiredEntryRefs = mediaEntries
    .filter(({ assetId }) => retiredMediaAssetIds.has(assetId))
    .map(({ id, assetId }) => `${id}:${assetId}`);

  assert.deepEqual(retiredEntryRefs, []);
});
