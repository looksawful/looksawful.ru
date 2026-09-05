import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = () =>
  readFile(new URL("../.github/workflows/production-health.yml", import.meta.url), "utf8");

test("Production health runs cheaply on a small recurring schedule against prod", async () => {
  const source = await workflow();

  assert.match(source, /name: Production Health/);
  assert.match(source, /schedule:/);
  assert.match(source, /cron: ['"]17 \*\/6 \* \* \*['"]/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /permissions:\s*\n\s*contents: read/);
  assert.match(source, /timeout-minutes: 5/);
  assert.match(source, /uses: actions\/checkout@v7/);
  assert.match(source, /ref: prod/);
  assert.match(source, /EXPECTED_PROD_SHA/);
});

test("Production health identifies each actionable surface without expensive QA", async () => {
  const source = await workflow();

  assert.match(source, /name: Check production contract/);
  assert.match(source, /node tools\/check-production[.]mjs/);
  assert.match(source, /name: Check CV route/);
  assert.match(source, /https:\/\/www[.]looksawful[.]ru\/cv\//);
  assert.match(source, /name: Check representative project route/);
  assert.match(source, /https:\/\/www[.]looksawful[.]ru\/work\/jestei-pool\//);
  assert.match(source, /name: Check homepage built assets/);
  assert.match(source, /\/assets\//);
  assert.doesNotMatch(source, /npm ci|playwright|lighthouse|media:sync/i);
});
