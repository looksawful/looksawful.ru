import assert from "node:assert/strict";
import test from "node:test";

import { mediaAssets } from "../src/data/media/assets/index.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";
import logicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };

const retiredAssetMappings = logicalSource.components.flatMap((component) =>
  component.removeAssetIds.map((fromAssetId) => ({
    componentId: component.id,
    fromAssetId,
    toAssetId: component.canonicalAssetId,
  })),
);
const retiredAssetIds = new Set(
  retiredAssetMappings.map(({ fromAssetId }) => fromAssetId),
);

test("reviewed dedupe manifest points only from retired ids to live canonical assets", () => {
  assert.equal(retiredAssetMappings.length, 24);
  assert.equal(retiredAssetIds.size, 24);

  const runtimeIds = new Set(mediaAssets.map(({ id }) => id));
  assert.equal(runtimeIds.size, mediaAssets.length, "runtime MediaAsset ids must be unique");

  for (const { componentId, fromAssetId, toAssetId } of retiredAssetMappings) {
    assert.equal(
      runtimeIds.has(fromAssetId),
      false,
      `component ${componentId}: retired asset remains: ${fromAssetId}`,
    );
    assert.equal(
      runtimeIds.has(toAssetId),
      true,
      `component ${componentId}: canonical asset missing: ${toAssetId}`,
    );
  }
});

test("no runtime MediaEntry points at an asset retired by the reviewed manifest", () => {
  const retiredEntryRefs = mediaEntries
    .filter(({ assetId }) => retiredAssetIds.has(assetId))
    .map(({ id, assetId }) => `${id}:${assetId}`);

  assert.deepEqual(retiredEntryRefs, []);
});
