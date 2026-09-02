import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function block(workflow, name) {
  return workflow.match(new RegExp(`\\n      - name: ${name}\\b[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";
}

function assertDerivativeOnlyCache(cache, label) {
  assert.match(cache, /public\/media\/generated\/responsive\b/, `${label} must cache responsive binaries`);
  assert.match(cache, /public\/media\/generated\/video\/\*\.web/, `${label} must cache generated video binaries`);
  assert.match(cache, /\.cache\/media\/generated-cache\.json/, `${label} must cache canonical marker`);
  assert.doesNotMatch(cache, /responsive-manifest\.json/, `${label} must not cache tracked responsive metadata`);
  assert.doesNotMatch(cache, /video-inventory\.json/, `${label} must not cache tracked video metadata`);
  assert.doesNotMatch(cache, /responsive-generated\.ts/, `${label} must not cache tracked generated catalog`);
}

test("Fast CI and production consume only exact fingerprinted generated-media caches", async () => {
  for (const name of ["ci-fast.yml", "pages.yml"]) {
    const workflow = await read(`.github/workflows/${name}`);
    const restore = block(workflow, name === "ci-fast.yml" ? "Restore exact generated media cache" : "Restore exact generated media cache");
    assert.match(restore, /actions\/cache\/restore@v4/, `${name} exact cache restore`);
    assertDerivativeOnlyCache(restore, name);
    assert.match(restore, /generated-media-v2-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);
    assert.doesNotMatch(restore, /restore-keys:/, `${name} must never accept stale cache fallback`);
    assert.match(workflow, /media-dev-state\.mjs --cache-verify/, `${name} must verify restored cache completeness`);
  }
});

test("Fast CI media generation exists only as explicit cache-miss recovery", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");
  const tooling = block(workflow, "Install recovery video tooling on cache miss");
  const recovery = block(workflow, "Recover generated media on cache miss");
  assert.match(tooling, /cache-hit != 'true'/);
  assert.match(tooling, /ffmpeg/);
  assert.match(recovery, /cache-hit != 'true'/);
  assert.match(recovery, /npm run media:sync/);
  assert.match(workflow, /actions\/cache\/save@v4/);
});

test("CMS media consumes an exact previous cache and saves one exact final cache", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");
  const previous = block(workflow, "Restore exact previous generated media cache");
  const save = block(workflow, "Save exact generated media cache");

  assert.match(previous, /actions\/cache\/restore@v4/);
  assertDerivativeOnlyCache(previous, "cms previous cache");
  assert.match(previous, /steps\.previous-media\.outputs\.fingerprint/);
  assert.doesNotMatch(previous, /restore-keys:/);
  assert.match(workflow, /Verify previous cache before incremental generation[\s\S]*?media-dev-state\.mjs --cache-verify/);

  assert.match(save, /actions\/cache\/save@v4/);
  assertDerivativeOnlyCache(save, "cms final cache");
  assert.match(save, /steps\.media\.outputs\.fingerprint/);
  assert.match(workflow, /Write canonical generated-media cache marker[\s\S]*?--cache-write/);
  assert.match(workflow, /Verify complete final generated media state[\s\S]*?--cache-verify/);
});

test("scheduled Lighthouse rebuilds deterministic media instead of trusting an unrelated cache", async () => {
  const workflow = await read(".github/workflows/quality.yml");
  const lighthouse = workflow.match(/  lighthouse:[\s\S]*?(?=\n  [a-z][\w-]*:|$)/)?.[0] ?? "";
  assert.match(lighthouse, /npm run media:sync/);
  assert.match(lighthouse, /git diff --exit-code/);
  assert.match(lighthouse, /npm run build:site/);
  assert.doesNotMatch(lighthouse, /restore-keys:/);
});
