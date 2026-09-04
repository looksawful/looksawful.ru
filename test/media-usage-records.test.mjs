import assert from "node:assert/strict";
import test from "node:test";

import { mediaEntries } from "../src/data/media/entries/index.ts";
import {
  dedupeMediaUsageRecords,
  mediaUsageMetadataByEntryId,
  parseDedupeMediaUsageRecords,
} from "../src/data/media/usage-records.ts";

test("dedupe usage evidence contains exactly the 38 reviewed entry retargets", () => {
  assert.equal(dedupeMediaUsageRecords.length, 38);
  assert.equal(new Set(dedupeMediaUsageRecords.map((record) => record.entryId)).size, 38);
});

test("usage evidence carries both old and canonical asset identity", () => {
  for (const record of dedupeMediaUsageRecords) {
    assert.ok(record.fromAssetId.length > 0);
    assert.ok(record.toAssetId.length > 0);
    assert.notEqual(record.fromAssetId, record.toAssetId);
    assert.ok(Number.isInteger(record.evidenceComponentId));
  }
});

test("parser rejects duplicate entry ids", () => {
  assert.throws(
    () =>
      parseDedupeMediaUsageRecords([
        {
          entryId: "entry-a",
          evidenceComponentId: 1,
          fromAssetId: "asset-old",
          toAssetId: "asset-new",
        },
        {
          entryId: "entry-a",
          evidenceComponentId: 2,
          fromAssetId: "asset-old-2",
          toAssetId: "asset-new-2",
        },
      ]),
    /duplicate entryId/i,
  );
});

test("explicit empty contextual arrays survive parsing and indexing", () => {
  const [record] = parseDedupeMediaUsageRecords([
    {
      entryId: "entry-empty",
      evidenceComponentId: 1,
      fromAssetId: "asset-old",
      toAssetId: "asset-new",
      projectIds: [],
      tags: [],
      credits: [],
    },
  ]);

  assert.deepEqual(record.projectIds, []);
  assert.deepEqual(record.tags, []);
  assert.deepEqual(record.credits, []);

  const realEmptyOverride = [...mediaUsageMetadataByEntryId.values()].find(
    (metadata) => metadata.projectIds !== undefined && metadata.projectIds.length === 0,
  );
  assert.ok(realEmptyOverride, "reviewed migration data must retain explicit empty projectIds");
});

test("dedupe metadata preserves missing alt instead of materializing an empty override", () => {
  const entryId = "jestei-logo-source-34-logo-jestei-pool-3-use-01";
  const metadata = mediaUsageMetadataByEntryId.get(entryId);
  const entry = mediaEntries.find((candidate) => candidate.id === entryId);

  assert.ok(metadata, `missing dedupe usage metadata for ${entryId}`);
  assert.equal(
    Object.prototype.hasOwnProperty.call(metadata, "alt"),
    false,
    "reviewed usage evidence must not turn a missing alt into an explicit empty string",
  );
  assert.ok(entry, `missing MediaEntry ${entryId}`);
  assert.equal(Object.prototype.hasOwnProperty.call(entry, "alt"), false);
  assert.equal(entry.alt, undefined);
});
