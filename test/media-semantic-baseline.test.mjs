import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSemanticBaseline,
  compareSemanticBaseline,
  entrySemanticRecord,
  readSemanticBaselineFixture,
} from "../tools/media/export-semantic-baseline.mjs";

const MIGRATION_MODE = { normalizeDedupeAliases: true };

test("dedupe migration preserves the frozen pre-dedupe contextual semantics", async () => {
  const expected = await readSemanticBaselineFixture();
  assert.equal(expected.version, 3);

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

test("contextual semantic record protects all usage metadata but not retired physical src", () => {
  const entry = {
    id: "styx-example-use-01",
    assetId: "styx-05-source-14-4x5",
    title: "title",
    alt: "alt",
    description: "description",
    date: "2026-09-04",
    projectIds: [],
    workAreaIds: ["visual-design"],
    projectTypeIds: ["branding"],
    deliverableIds: ["photography"],
    tags: ["tag"],
    credits: ["credit"],
    creditId: "credit-id",
    posterAssetId: "styx-05-source-14-4x5",
    caption: { title: "caption", text: "text", meta: ["meta"] },
    purpose: "work",
  };
  const asset = {
    id: "styx-03-source-01-4x5",
    type: "image",
    src: "/canonical.webp",
  };

  const record = entrySemanticRecord(entry, asset, MIGRATION_MODE);

  assert.equal(record.assetId, "styx-03-source-01-4x5");
  assert.equal(record.posterAssetId, "styx-03-source-01-4x5");
  assert.equal(record.title, "title");
  assert.equal(record.alt, "alt");
  assert.equal(record.description, "description");
  assert.equal(record.date, "2026-09-04");
  assert.deepEqual(record.projectIds, []);
  assert.deepEqual(record.workAreaIds, ["visual-design"]);
  assert.deepEqual(record.projectTypeIds, ["branding"]);
  assert.deepEqual(record.deliverableIds, ["photography"]);
  assert.deepEqual(record.tags, ["tag"]);
  assert.deepEqual(record.credits, ["credit"]);
  assert.equal(record.creditId, "credit-id");
  assert.deepEqual(record.caption, {
    title: "caption",
    text: "text",
    meta: ["meta"],
  });
  assert.equal(record.purpose, "work");
  assert.equal(record.mediaType, "image");
  assert.equal(Object.hasOwn(record, "src"), false);
});
