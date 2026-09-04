import assert from "node:assert/strict";
import test from "node:test";

import { metadataBlockers } from "../tools/media/apply-dedupe-migration.mjs";

const component = {
  canonicalAssetId: "canonical",
  removeAssetIds: ["retired"],
  entryIds: ["entry-1"],
};

function catalogs(retiredAlt, canonicalAlt) {
  return new Map([
    ["retired", { alt: retiredAlt }],
    ["canonical", { alt: canonicalAlt }],
  ]);
}

test("missing usage alt carries legacy empty catalog alt semantics", () => {
  assert.deepEqual(
    metadataBlockers(
      component,
      catalogs("", "Canonical alt"),
      new Map(),
      new Map([["entry-1", { id: "entry-1" }]]),
    ),
    [],
  );
});

test("missing usage alt still blocks loss of meaningful legacy alt", () => {
  assert.deepEqual(
    metadataBlockers(
      component,
      catalogs("Meaningful retired alt", "Canonical alt"),
      new Map(),
      new Map([["entry-1", { id: "entry-1" }]]),
    ),
    ["retired.alt differs without usage carrier on entry-1"],
  );
});

test("explicit empty usage carrier remains valid", () => {
  assert.deepEqual(
    metadataBlockers(
      component,
      catalogs("", "Canonical alt"),
      new Map([["entry-1", { alt: "" }]]),
      new Map([["entry-1", { id: "entry-1" }]]),
    ),
    [],
  );
});
