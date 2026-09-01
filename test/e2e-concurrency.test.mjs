import assert from "node:assert/strict";
import test from "node:test";
import { mapWithConcurrency } from "../tools/e2e/concurrency.mjs";

test("bounded execution preserves results and never exceeds two workers", async () => {
  let active = 0;
  let maximum = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    maximum = Math.max(maximum, ++active);
    await new Promise((resolve) => setImmediate(resolve));
    active--;
    return value * 2;
  });
  assert.equal(maximum, 2);
  assert.deepEqual(result, [2, 4, 6, 8]);
});
test("failed worker drains active contexts before rejecting and stops new work", async () => {
  const started = [];
  let drained = false;
  await assert.rejects(mapWithConcurrency([1, 2, 3], 2, async (value) => {
    started.push(value);
    if (value === 1) throw new Error("browser failure");
    await new Promise((resolve) => setImmediate(resolve));
    drained = true;
  }), /browser failure/);
  assert.deepEqual(started, [1, 2]);
  assert.equal(drained, true);
});
test("invalid concurrency is rejected", async () => {
  await assert.rejects(mapWithConcurrency([], 0, () => {}), /concurrency/);
});
