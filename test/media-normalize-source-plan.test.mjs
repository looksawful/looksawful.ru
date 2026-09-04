import assert from "node:assert/strict";
import test from "node:test";

import { buildNormalizationSteps } from "../tools/media/normalize-media-source.mjs";

test("dry-run normalization never schedules a mutating command", () => {
  const steps = buildNormalizationSteps({ apply: false });
  assert.deepEqual(steps.map((step) => step.label), [
    "check-materialized-entry-context",
    "logical-dedupe-dry-run",
    "deferred-physical-dedupe-dry-run",
    "check-pages-cms-compact",
  ]);
  for (const step of steps) {
    assert.equal(step.args.includes("--apply"), false, step.label);
    assert.equal(step.args.includes("--write"), false, step.label);
  }
});

test("apply normalization snapshots semantics before mutation and verifies after each destructive phase", () => {
  const steps = buildNormalizationSteps({ apply: true });
  assert.deepEqual(steps.map((step) => step.label), [
    "capture-live-semantics",
    "materialize-entry-context",
    "check-materialized-entry-context",
    "verify-semantics-after-materialize",
    "logical-dedupe-dry-run",
    "logical-dedupe-apply",
    "deferred-physical-dedupe-dry-run",
    "deferred-physical-dedupe-apply",
    "compact-pages-cms",
    "check-pages-cms-compact",
    "media-catalog-sync",
    "responsive-media-build",
    "media-dev-state-write",
    "verify-live-semantics-final",
    "dedupe-integrity",
    "typecheck",
    "media-tests",
    "fast-tests",
    "site-build",
  ]);
  assert.equal(steps[0].args.includes("--write"), true);
  assert.equal(steps[1].args.includes("--write"), true);
  assert.equal(steps[5].args.includes("--apply"), true);
  assert.equal(steps[7].args.includes("--apply"), true);
  assert.equal(steps[8].args.includes("--write"), true);

  assert.equal(
    steps.some((step) => step.command.endsWith("npm") || step.command.endsWith("npm.cmd")
      ? step.args.includes("media:sync")
      : false),
    false,
    "normalization must not rebuild unrelated video outputs",
  );
});
