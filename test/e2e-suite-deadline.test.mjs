import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as orchestration from "../tools/e2e/concurrency.mjs";
import { FULL_E2E_SUITE_TIMEOUT_MS } from "../tools/e2e/run-all.mjs";

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

test("the full browser runner keeps a finite named deadline for every top-level suite", async () => {
  assert.deepEqual(Object.keys(FULL_E2E_SUITE_TIMEOUT_MS), [
    "quick-smoke",
    "site-smoke",
    "navigation-smoke",
    "mpa-smoke",
    "project-pages-smoke",
    "cv-smoke",
  ]);

  for (const [name, timeoutMs] of Object.entries(FULL_E2E_SUITE_TIMEOUT_MS)) {
    assert.equal(Number.isInteger(timeoutMs), true, `${name} timeout must be an integer`);
    assert.ok(timeoutMs > 0 && timeoutMs <= 12 * 60_000, `${name} timeout must stay within the suite budget`);
  }

  const source = await readFile(new URL("../tools/e2e/run-all.mjs", import.meta.url), "utf8");
  assert.match(source, /await runSuiteWithDeadline\(\{[\s\S]*quick-smoke/);
  assert.match(source, /mapWithConcurrency\(suites, 2, \(suite\) => runSuiteWithDeadline\(suite\)\)/);
});
