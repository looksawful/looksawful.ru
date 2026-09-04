import assert from "node:assert/strict";
import test from "node:test";

import {
  filterCatalogRegisteredFilenames,
} from "../tools/media/apply-dedupe-migration.mjs";

test("logical dedupe removes retired catalog imports while preserving survivors", () => {
  const removeIds = new Set(["retired-b", "retired-a"]);
  const current = [
    "survivor-z.json",
    "retired-a.json",
    "survivor-a.json",
    "retired-b.json",
  ];

  assert.deepEqual(
    filterCatalogRegisteredFilenames(current, removeIds),
    ["survivor-a.json", "survivor-z.json"],
  );
});
