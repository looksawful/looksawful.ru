import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("caption QA targets the real Jestei case route with the required mobile matrix", async () => {
  const source = await read("tools/capture-caption-qa.mjs");

  assert.match(source, /\/work\/jestei-pool\//);
  for (const width of [320, 360, 390, 430]) {
    assert.match(source, new RegExp(`width:\\s*${width}\\b`));
  }

  assert.match(source, /sequence/);
  assert.match(source, /summary-control/);
  assert.match(source, /data-middle-overflow=["']reel["']/);
  assert.match(source, /route.*viewport|viewport.*route/i);
});

test("caption QA remains standalone and out of production E2E", async () => {
  const production = await read("tools/e2e/run-production.mjs");
  const qa = await read("tools/capture-caption-qa.mjs");

  assert.match(qa, /export\s+async\s+function\s+captureCaptionQa/);
  assert.match(qa, /withE2ERuntime/);
  assert.doesNotMatch(production, /captureCaptionQa/);
});
