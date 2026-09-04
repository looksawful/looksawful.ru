import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSemanticBaseline,
  compareSemanticBaseline,
  readSemanticBaselineFixture,
} from "../tools/media/export-semantic-baseline.mjs";

const MIGRATION_MODE = { normalizeDedupeAliases: true };

test("dedupe migration preserves the frozen pre-dedupe semantics", async () => {
  const expected = await readSemanticBaselineFixture();
  const actual = buildSemanticBaseline(
    expected.trackedCatalogAssetIds,
    MIGRATION_MODE,
  );

  assert.deepEqual(compareSemanticBaseline(actual, expected), []);
});

test("alias-aware semantic baseline export is deterministic", async () => {
  const expected = await readSemanticBaselineFixture();
  const first = buildSemanticBaseline(
    expected.trackedCatalogAssetIds,
    MIGRATION_MODE,
  );
  const second = buildSemanticBaseline(
    expected.trackedCatalogAssetIds,
    MIGRATION_MODE,
  );

  assert.deepEqual(second, first);
});
