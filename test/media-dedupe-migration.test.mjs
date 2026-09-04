import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import aliasSource from "../src/data/media/asset-aliases.json" with { type: "json" };
import noMergeSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };
import physicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };
import {
  mediaAssets,
  mediaEntries,
} from "../src/data/media/index.ts";
import { registeredMediaAssets } from "../src/data/media/assets/registered.ts";
import {
  canonicalMediaAssetId,
  retiredMediaAssetIds,
} from "../src/data/media/asset-aliases.ts";
import { dedupeMediaUsageRecords } from "../src/data/media/usage-records.ts";

const CONTEXT_KEYS = [
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
];

const assetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
const entryById = new Map(mediaEntries.map((entry) => [entry.id, entry]));
const registeredByPhysicalPath = new Map(
  registeredMediaAssets.map((asset) => [
    asset.src.startsWith("/") ? `public${asset.src}` : asset.src,
    asset,
  ]),
);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test("retired logical MediaAssets resolve to one surviving canonical runtime asset", () => {
  assert.equal(aliasSource.length, 24);
  assert.equal(retiredMediaAssetIds.size, aliasSource.length);

  for (const record of aliasSource) {
    assert.equal(
      canonicalMediaAssetId(record.fromAssetId),
      record.toAssetId,
      `component ${record.componentId} alias mismatch`,
    );
    assert.equal(
      assetById.has(record.fromAssetId),
      false,
      `retired runtime asset survived: ${record.fromAssetId}`,
    );
    assert.equal(
      assetById.has(record.toAssetId),
      true,
      `canonical runtime asset missing: ${record.toAssetId}`,
    );
  }
});

test("every reviewed entry retarget keeps its contextual metadata", () => {
  assert.equal(dedupeMediaUsageRecords.length, 38);

  for (const record of dedupeMediaUsageRecords) {
    const entry = entryById.get(record.entryId);
    assert.ok(entry, `missing MediaEntry ${record.entryId}`);
    assert.equal(
      entry.assetId,
      record.toAssetId,
      `MediaEntry ${record.entryId} was not retargeted to canonical asset`,
    );

    for (const key of CONTEXT_KEYS) {
      if (!(key in record)) continue;
      assert.deepEqual(
        entry[key],
        record[key],
        `MediaEntry ${record.entryId} lost contextual ${key}`,
      );
    }
  }

  for (const entry of mediaEntries) {
    assert.equal(
      retiredMediaAssetIds.has(entry.assetId),
      false,
      `runtime MediaEntry still references retired asset ${entry.assetId}`,
    );
  }
});

test("applied physical duplicate list is absent and deferred sources survive", async () => {
  assert.equal(physicalSource.removedPhysicalPathCount, 63);
  assert.equal(physicalSource.removePhysicalPaths.length, 63);

  for (const path of physicalSource.removePhysicalPaths) {
    assert.equal(await exists(path), false, `removed duplicate still exists: ${path}`);
  }

  for (const item of physicalSource.deferredRuntimeRewrites ?? []) {
    assert.equal(await exists(item.path), true, `deferred runtime source missing: ${item.path}`);
  }

  for (const item of physicalSource.deferredQualityPromotions ?? []) {
    assert.equal(
      await exists(item.bestSourcePath),
      true,
      `deferred quality source missing: ${item.bestSourcePath}`,
    );
  }
});

test("VARIANT and DIFFERENT decisions remain physically and logically distinct", async () => {
  const removed = new Set(physicalSource.removePhysicalPaths);

  for (const constraint of noMergeSource) {
    assert.equal(removed.has(constraint.left), false, `${constraint.source} left side was deleted`);
    assert.equal(removed.has(constraint.right), false, `${constraint.source} right side was deleted`);
    assert.equal(await exists(constraint.left), true, `${constraint.source} left side is missing`);
    assert.equal(await exists(constraint.right), true, `${constraint.source} right side is missing`);

    const leftAsset = registeredByPhysicalPath.get(constraint.left);
    const rightAsset = registeredByPhysicalPath.get(constraint.right);
    if (!leftAsset || !rightAsset) continue;

    assert.notEqual(
      canonicalMediaAssetId(leftAsset.id),
      canonicalMediaAssetId(rightAsset.id),
      `${constraint.source} no-merge pair collapsed to one logical asset`,
    );
  }
});
