import assert from "node:assert/strict";
import test from "node:test";

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
