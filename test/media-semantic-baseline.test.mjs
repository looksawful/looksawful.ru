import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSemanticBaseline,
  compareSemanticBaseline,
  readSemanticBaselineFixture,
} from "../tools/media/export-semantic-baseline.mjs";

test("current media semantics match the dedupe-safe golden baseline", async () => {
  const expected = await readSemanticBaselineFixture();
  const actual = buildSemanticBaseline(expected.trackedCatalogAssetIds);

  assert.deepEqual(compareSemanticBaseline(actual, expected), []);
});

test("semantic baseline export is deterministic", async () => {
  const expected = await readSemanticBaselineFixture();
  const first = buildSemanticBaseline(expected.trackedCatalogAssetIds);
  const second = buildSemanticBaseline(expected.trackedCatalogAssetIds);

  assert.deepEqual(second, first);
});
