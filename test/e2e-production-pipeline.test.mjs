import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { cvContent } from "../src/data/cv.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CV smoke exposes authored and production hidden-card contracts", async () => {
  const smokeCv = await import("../tools/smoke-cv.mjs");
  assert.equal(typeof smokeCv.getExpectedCvHiddenCards, "function");
  const authoredHidden = cvContent.experience.filter(({ visible }) => !visible).length;
  assert.equal(smokeCv.getExpectedCvHiddenCards("authored"), authoredHidden);
  assert.equal(smokeCv.getExpectedCvHiddenCards("production"), 0);
  assert.throws(() => smokeCv.getExpectedCvHiddenCards("invalid"), /invalid CV smoke mode/i);
});

test("CV runner accepts an explicit mode and direct execution stays authored", async () => {
  const source = await read("tools/smoke-cv.mjs");
  assert.match(source, /runSmokeCv\(\{\s*browser,\s*baseUrl,\s*mode\s*=\s*["']authored["']/s);
  assert.match(source, /getExpectedCvHiddenCards\(mode\)/);
  assert.match(source, /runSmokeCv\(\{\s*browser,\s*baseUrl,\s*mode:\s*["']authored["']/s);
});

test("caption QA stays optional and import-safe", async () => {
  const source = await read("tools/capture-caption-qa.mjs");
  assert.match(source, /export async function captureCaptionQa\(\{\s*browser,\s*baseUrl,/s);
  assert.match(source, /if \(isDirectExecution\(import\.meta\.url\)\)/);
  assert.match(source, /withE2ERuntime/);
  assert.doesNotMatch(source, /chromium\.launch/);
});

test("production E2E runner reuses one runtime for compact production smoke and media sanity only", async () => {
  const source = await read("tools/e2e/run-production.mjs");
  assert.match(source, /runQuickSmoke\(\{\s*browser,\s*baseUrl,\s*cvMode:\s*["']production["']/s);
  assert.match(source, /runMediaSanity\(\{\s*browser,\s*baseUrl\s*\}\)/s);
  assert.match(source, /withE2ERuntime/);
  assert.doesNotMatch(source, /captureCaptionQa|runAllSmokeSuites|runSmokeNavigation|runSmokeMpa/);
});

test("package scripts expose production E2E without changing standalone smoke commands", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts["test:e2e:production"], "node tools/e2e/run-production.mjs");
  assert.equal(pkg.scripts["test:e2e"], "node tools/smoke-site.mjs");
  assert.equal(pkg.scripts["test:e2e:cv"], "node tools/smoke-cv.mjs");
});
