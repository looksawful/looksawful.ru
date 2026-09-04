import assert from "node:assert/strict";
import test from "node:test";

import { resolveMediaUsageMetadata } from "../src/data/media/usage.ts";

const catalog = Object.freeze({
  title: "Catalog title",
  alt: "Catalog alt",
  description: "Catalog description",
  date: "2026",
  projectIds: Object.freeze(["catalog-project"]),
  workAreaIds: Object.freeze(["catalog-work"]),
  projectTypeIds: Object.freeze(["catalog-type"]),
  deliverableIds: Object.freeze(["catalog-deliverable"]),
  tags: Object.freeze(["catalog-tag"]),
  credits: Object.freeze(["catalog-credit"]),
  reusable: true,
  archived: false,
});

test("explicit empty usage values do not fall back to catalog metadata", () => {
  const result = resolveMediaUsageMetadata(
    { alt: "", projectIds: [], tags: [] },
    catalog,
  );

  assert.equal(result.alt, "");
  assert.deepEqual(result.projectIds, []);
  assert.deepEqual(result.tags, []);
  assert.equal(result.title, "Catalog title");
});

test("undefined usage values fall back field-by-field", () => {
  const result = resolveMediaUsageMetadata(
    { title: "Entry title", credits: ["entry-credit"] },
    catalog,
  );

  assert.equal(result.title, "Entry title");
  assert.equal(result.alt, "Catalog alt");
  assert.deepEqual(result.credits, ["entry-credit"]);
  assert.deepEqual(result.deliverableIds, ["catalog-deliverable"]);
});

test("resolver does not mutate the entry or catalog inputs", () => {
  const entry = Object.freeze({ title: "Entry title", projectIds: Object.freeze([]) });
  const beforeCatalog = JSON.stringify(catalog);
  const beforeEntry = JSON.stringify(entry);

  resolveMediaUsageMetadata(entry, catalog);

  assert.equal(JSON.stringify(entry), beforeEntry);
  assert.equal(JSON.stringify(catalog), beforeCatalog);
});
