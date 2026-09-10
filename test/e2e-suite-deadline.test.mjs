import assert from "node:assert/strict";
import test from "node:test";

import * as orchestration from "../tools/e2e/concurrency.mjs";

test("a stalled suite is rejected with its own name instead of hanging the runner", async () => {
  const { runSuiteWithDeadline } = orchestration;
  assert.equal(typeof runSuiteWithDeadline, "function", "suite deadline helper must exist");

  const messages = [];
  const logger = {
    log: (message) => messages.push(message),
    error: (message) => messages.push(message),
  };

  await assert.rejects(
    runSuiteWithDeadline({
      name: "stalled-suite",
      timeoutMs: 5,
      logger,
      run: () => new Promise(() => {}),
    }),
    /stalled-suite.*timed out.*5 ms/i,
  );

  assert.match(messages[0] ?? "", /\[e2e-suite\] START stalled-suite/);
  assert.ok(messages.some((message) => /\[e2e-suite\] TIMEOUT stalled-suite/.test(message)));
});

test("a completed suite emits named start and pass boundaries", async () => {
  const { runSuiteWithDeadline } = orchestration;
  assert.equal(typeof runSuiteWithDeadline, "function", "suite deadline helper must exist");

  const messages = [];
  const result = await runSuiteWithDeadline({
    name: "healthy-suite",
    timeoutMs: 100,
    logger: {
      log: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
    run: async () => "ok",
  });

  assert.equal(result, "ok");
  assert.match(messages[0] ?? "", /\[e2e-suite\] START healthy-suite/);
  assert.ok(messages.some((message) => /\[e2e-suite\] PASS healthy-suite/.test(message)));
});
