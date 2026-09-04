import assert from "node:assert/strict";
import test from "node:test";

import physicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };
import logicalSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };
import noMergeSource from "../tools/media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };
import {
  classifyReferencePath,
  validatePhysicalOnlyManifest,
} from "../tools/media/apply-physical-only-dedupe.mjs";

test("physical-only manifest is an exact unique 63-path deletion set", () => {
  assert.equal(physicalSource.removedPhysicalPathCount, 63);
  assert.equal(physicalSource.removePhysicalPaths.length, 63);
  assert.equal(new Set(physicalSource.removePhysicalPaths).size, 63);
  assert.equal(physicalSource.removedBytes, 6_127_743);
});

test("physical-only manifest never deletes a protected no-merge source", () => {
  const noMergePaths = new Set(
    noMergeSource.flatMap((constraint) => [constraint.left, constraint.right]),
  );
  const overlap = physicalSource.removePhysicalPaths.filter((path) => noMergePaths.has(path));
  assert.deepEqual(overlap, []);
});

test("physical-only deletions never overlap logical asset removals", () => {
  const logicalRemovalPaths = new Set(
    logicalSource.components.flatMap((component) => component.removePhysicalPaths ?? []),
  );
  const overlap = physicalSource.removePhysicalPaths.filter((path) => logicalRemovalPaths.has(path));
  assert.deepEqual(overlap, []);
});

test("derived media manifest is classified as generated evidence", () => {
  assert.equal(classifyReferencePath("public/media/media-manifest.json"), "GENERATED");
  assert.equal(classifyReferencePath("public/pets/awful-cases/awful-cases.js"), "RUNTIME_DIRECT");
});

test("manifest validator rejects duplicate, registered, protected and deferred paths", () => {
  const source = {
    removedPhysicalPathCount: 2,
    removedBytes: 10,
    removePhysicalPaths: ["public/a.webp", "public/a.webp"],
    deferredRuntimeRewrites: [],
    deferredQualityPromotions: [],
  };

  const blockers = validatePhysicalOnlyManifest(source, {
    registeredPaths: new Set(["public/a.webp"]),
    noMergePaths: new Set(["public/a.webp"]),
    deferredProtectedPaths: new Set(["public/a.webp"]),
  });

  assert.ok(blockers.some((message) => /duplicate/i.test(message)));
  assert.ok(blockers.some((message) => /registered/i.test(message)));
  assert.ok(blockers.some((message) => /no-merge/i.test(message)));
  assert.ok(blockers.some((message) => /deferred/i.test(message)));
});

test("manifest validator accepts a clean physical-only deletion set", () => {
  assert.deepEqual(
    validatePhysicalOnlyManifest(
      {
        removedPhysicalPathCount: 2,
        removedBytes: 10,
        removePhysicalPaths: ["public/a.webp", "public/b.webp"],
        deferredRuntimeRewrites: [],
        deferredQualityPromotions: [],
      },
      {
        registeredPaths: new Set(),
        noMergePaths: new Set(),
        deferredProtectedPaths: new Set(),
      },
    ),
    [],
  );
});
