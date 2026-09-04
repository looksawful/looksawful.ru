import assert from "node:assert/strict";
import test from "node:test";

import { metadataBlockers } from "../tools/media/apply-dedupe-migration.mjs";

function catalogItem(title) {
  return {
    title,
    alt: "",
    description: "",
    date: "",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    reusable: true,
    archived: false,
  };
}

test("dedupe blocks when one affected entry lacks a differing metadata carrier", () => {
  const component = {
    canonicalAssetId: "canonical",
    removeAssetIds: ["retired"],
    entryIds: ["entry-a", "entry-b"],
  };
  const catalogById = new Map([
    ["canonical", catalogItem("canonical title")],
    ["retired", catalogItem("retired title")],
  ]);
  const usageByEntryId = new Map([
    ["entry-a", { entryId: "entry-a", title: "retired title" }],
    ["entry-b", { entryId: "entry-b" }],
  ]);
  const entryById = new Map([
    ["entry-a", { id: "entry-a" }],
    ["entry-b", { id: "entry-b" }],
  ]);

  const blockers = metadataBlockers(
    component,
    catalogById,
    usageByEntryId,
    entryById,
  );

  assert.ok(
    blockers.includes(
      "retired.title differs without usage carrier on entry-b",
    ),
  );
});

test("dedupe accepts a differing metadata carrier from the raw entry", () => {
  const component = {
    canonicalAssetId: "canonical",
    removeAssetIds: ["retired"],
    entryIds: ["entry-a"],
  };
  const catalogById = new Map([
    ["canonical", catalogItem("canonical title")],
    ["retired", catalogItem("retired title")],
  ]);
  const usageByEntryId = new Map();
  const entryById = new Map([
    ["entry-a", { id: "entry-a", title: "retired title" }],
  ]);

  assert.deepEqual(
    metadataBlockers(component, catalogById, usageByEntryId, entryById),
    [],
  );
});
