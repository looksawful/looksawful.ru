import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageUrl = new URL("../package.json", import.meta.url);
const runnerUrl = new URL("../tools/ci/run-tests.mjs", import.meta.url);

test("site-copy tooling exposes generate, stale-check and deep coverage commands", async () => {
  const pkg = JSON.parse(await readFile(packageUrl, "utf8"));

  assert.equal(pkg.scripts["copy:export"], "node tools/editorial/export-site-copy.mjs");
  assert.equal(pkg.scripts["copy:check"], "node tools/editorial/export-site-copy.mjs --check");
  assert.equal(pkg.scripts["copy:coverage"], "node tools/editorial/check-site-copy-coverage.mjs");
});

test("cheap stale-export contract runs in fast tests without forcing rendered coverage", async () => {
  const runner = await readFile(runnerUrl, "utf8");

  assert.match(runner, /test\/site-copy-tooling-contract\.test\.mjs/);
  assert.doesNotMatch(runner, /copy:coverage/);
});
