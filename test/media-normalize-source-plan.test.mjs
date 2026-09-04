import assert from "node:assert/strict";
import test from "node:test";

import { buildNormalizationSteps } from "../tools/media/normalize-media-source.mjs";

test("dry-run normalization never schedules a mutating command", () => {
  const steps = buildNormalizationSteps({ apply: false });
  assert.ok(steps.length >= 4);
  for (const step of steps) {
    assert.equal(step.args.includes("--apply"), false, step.label);
    assert.equal(step.args.includes("--write"), false, step.label);
  }
});

test("apply normalization materializes context before destructive dedupe", () => {
  const steps = buildNormalizationSteps({ apply: true });
  const labels = steps.map((step) => step.label);
  assert.deepEqual(labels.slice(0, 4), [
    "materialize-entry-context",
    "check-materialized-entry-context",
    "logical-dedupe",
    "deferred-physical-dedupe",
  ]);
  assert.equal(steps[0].args.includes("--write"), true);
  assert.equal(steps[2].args.includes("--apply"), true);
  assert.equal(steps[3].args.includes("--apply"), true);
});
