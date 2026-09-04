import assert from "node:assert/strict";
import test from "node:test";

import { mediaEntries } from "../src/data/media/entries/index.ts";
import { resolveAssignedProjectIds } from "../src/data/media/project-assignments.ts";

test("project assignment is authoritative on the usage itself", () => {
  assert.deepEqual(
    resolveAssignedProjectIds({ assetId: "any-asset", projectIds: ["project-a"] }),
    ["project-a"],
  );
  assert.deepEqual(
    resolveAssignedProjectIds({ assetId: "any-asset", projectIds: [] }),
    [],
  );
});

test("missing usage projectIds never fall back through MediaAsset/catalog metadata", () => {
  assert.equal(
    resolveAssignedProjectIds({ assetId: "styx-03-source-01-4x5" }),
    undefined,
  );
});

test("dedupe transition preserves frozen multi-project membership", () => {
  const byId = new Map(mediaEntries.map((entry) => [entry.id, entry]));
  const expected = new Map([
    [
      "berry-03-source-06-2x3-use-01",
      ["shootings-berry-editorial", "berry-social-content-2020"],
    ],
    [
      "berry-05-source-01-1050x1400-use-01",
      ["shootings-berry-model-tests", "berry-social-content-2020"],
    ],
    [
      "berry-05-source-05-2000x2000-use-01",
      ["shootings-berry-lookbook", "berry-social-content-2020"],
    ],
    [
      "berry-05-source-07-2144x2144-use-01",
      ["shootings-berry-product", "berry-social-content-2020"],
    ],
    [
      "jestei-landings-moves-awful-source-01-use-jestei",
      ["jestei-landings", "moves-awful"],
    ],
    [
      "jestei-landings-moves-awful-source-02-use-jestei",
      ["jestei-landings", "moves-awful"],
    ],
    [
      "jestei-landings-moves-awful-source-03-use-jestei",
      ["jestei-landings", "moves-awful"],
    ],
  ]);

  for (const [entryId, expectedProjectIds] of expected) {
    const entry = byId.get(entryId);
    assert.ok(entry, `missing MediaEntry ${entryId}`);
    assert.deepEqual(
      new Set(entry.projectIds ?? []),
      new Set(expectedProjectIds),
      `project membership drifted for ${entryId}`,
    );
  }
});
