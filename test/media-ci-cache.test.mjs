import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrls = [
  new URL("../.github/workflows/verify-pr.yml", import.meta.url),
  new URL("../.github/workflows/verify-dev.yml", import.meta.url),
  new URL("../.github/workflows/pages.yml", import.meta.url),
];

function cacheBlock(workflow) {
  return workflow.match(/\n      - name: Restore generated media\b[\s\S]*?(?=\n      - name: )/)?.[0] ?? "";
}

function syncBlock(workflow) {
  return workflow.match(/\n      - name: Sync generated media\b[\s\S]*?(?=\n      - name: )/)?.[0] ?? "";
}

test("CI caches only reproducible media derivatives and always validates them with deterministic builders", async () => {
  for (const workflowUrl of workflowUrls) {
    const workflow = await readFile(workflowUrl, "utf8");
    const label = workflowUrl.pathname.split("/").at(-1);
    const cache = cacheBlock(workflow);
    const sync = syncBlock(workflow);

    assert.match(cache, /uses: actions\/cache@v4/, `${label} must restore generated media cache`);
    assert.match(cache, /public\/media\/generated\/responsive\b/, `${label} must cache responsive derivatives`);
    assert.match(cache, /public\/media\/generated\/video\b/, `${label} must cache video derivatives`);
    assert.doesNotMatch(cache, /responsive-manifest\.json/, `${label} must not cache tracked responsive metadata`);
    assert.doesNotMatch(cache, /video-inventory\.json/, `${label} must not cache tracked video metadata`);
    assert.doesNotMatch(cache, /responsive-generated\.ts/, `${label} must not cache tracked generated catalog`);
    assert.match(cache, /key: generated-media-v3-/, `${label} must invalidate the old metadata-owning cache generation`);
    assert.match(cache, /restore-keys:/, `${label} must allow prior derivative caches to seed changed media commits`);

    assert.match(sync, /run: npm run media:sync/, `${label} must run deterministic builders after cache restore`);
    assert.doesNotMatch(sync, /if:/, `${label} media correctness must not depend on a cache-hit condition`);
    assert.doesNotMatch(workflow, /media-cache\.outputs\.cache-hit/, `${label} must never treat cache hit as correctness proof`);
  }
});

test("Lighthouse uses the same derivative-only cache and deterministic media validation", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/lighthouse.yml", import.meta.url),
    "utf8",
  );
  const cache = cacheBlock(workflow);
  const sync = syncBlock(workflow);

  assert.match(cache, /uses: actions\/cache@v4/);
  assert.match(cache, /public\/media\/generated\/responsive\b/);
  assert.match(cache, /public\/media\/generated\/video\b/);
  assert.doesNotMatch(cache, /responsive-manifest\.json|video-inventory\.json|responsive-generated\.ts/);
  assert.match(cache, /key: generated-media-v3-/);
  assert.match(sync, /run: npm run media:sync/);
  assert.doesNotMatch(sync, /if:/);
  assert.doesNotMatch(workflow, /media-cache\.outputs\.cache-hit/);
  assert.match(workflow, /run: npm run build:site/);
});
