import assert from "node:assert/strict";
import test from "node:test";

import physicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };
import logicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };
import noMergeSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };

test("physical-only manifest preserves the exact reviewed 63-path deletion set", () => {
  assert.equal(physicalSource.removedPhysicalPathCount, 63);
  assert.equal(physicalSource.removePhysicalPaths.length, 63);
  assert.equal(new Set(physicalSource.removePhysicalPaths).size, 63);
  assert.equal(physicalSource.removedBytes, 6_127_743);
});

test("reviewed physical-only deletions never include a protected no-merge source", () => {
  const noMergePaths = new Set(
    noMergeSource.flatMap((constraint) => [constraint.left, constraint.right]),
  );
  const overlap = physicalSource.removePhysicalPaths.filter((path) => noMergePaths.has(path));
  assert.deepEqual(overlap, []);
});

test("reviewed physical-only deletions never overlap logical asset removals", () => {
  const logicalRemovalPaths = new Set(
    logicalSource.components.flatMap((component) => component.removePhysicalPaths ?? []),
  );
  const overlap = physicalSource.removePhysicalPaths.filter((path) => logicalRemovalPaths.has(path));
  assert.deepEqual(overlap, []);
});
