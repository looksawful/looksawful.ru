import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveNpmMediaSyncCommand } from "../tools/media-dev-state.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function block(workflow, name) {
  return workflow.match(new RegExp(`\\n      - name: ${name}\\b[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";
}

function assertGeneratedMediaCache(cache, label) {
  assert.match(cache, /public\/media\/generated\/responsive\b/, `${label} must cache responsive binaries`);
  assert.match(cache, /^[ \t]*public\/media\/generated\/video[ \t]*$/m, `${label} must cache the complete generated video directory recursively`);
  assert.match(cache, /^[ \t]*public\/media\/generated\/video-inventory\.json[ \t]*$/m, `${label} must cache the generated video inventory separately`);
  assert.doesNotMatch(cache, /public\/media\/generated\/video\/\*\./, `${label} must not use non-recursive video globs`);
  assert.match(cache, /\.cache\/media\/generated-cache\.json/, `${label} must cache canonical marker`);
  assert.doesNotMatch(cache, /responsive-manifest\.json/, `${label} must not cache tracked responsive metadata`);
  assert.doesNotMatch(cache, /responsive-generated\.ts/, `${label} must not cache tracked generated catalog`);
}

test("Fast CI and production consume only exact fingerprinted generated-media caches", async () => {
  for (const name of ["ci-fast.yml", "pages.yml"]) {
    const workflow = await read(`.github/workflows/${name}`);
    const restore = block(workflow, name === "ci-fast.yml" ? "Restore exact generated media cache" : "Restore exact generated media cache");
    assert.match(restore, /actions\/cache\/restore@v4/, `${name} exact cache restore`);
    assertGeneratedMediaCache(restore, name);
    assert.match(restore, /generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);
    assert.doesNotMatch(restore, /restore-keys:/, `${name} must never accept stale cache fallback`);
    assert.doesNotMatch(workflow, /generated-media-v2-/, "workflow must not expose the retired v2 cache namespace");
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
  assertGeneratedMediaCache(previous, "cms previous cache");
  assert.match(previous, /steps\.previous-media\.outputs\.fingerprint/);
  assert.match(previous, /generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.previous-media\.outputs\.fingerprint \}\}/);
  assert.doesNotMatch(previous, /restore-keys:/);
  assert.match(workflow, /Verify previous cache before incremental generation[\s\S]*?media-dev-state\.mjs --cache-verify/);

  assert.match(save, /actions\/cache\/save@v4/);
  assertGeneratedMediaCache(save, "cms final cache");
  assert.match(save, /steps\.media\.outputs\.fingerprint/);
  assert.match(save, /generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);
  assert.match(workflow, /Write canonical generated-media cache marker[\s\S]*?--cache-write/);
  assert.match(workflow, /Verify complete final generated media state[\s\S]*?--cache-verify/);
  assert.doesNotMatch(workflow, /generated-media-v2-/, "cms media must not expose the retired v2 cache namespace");
});

test("nightly rebuilds generated media once and heavy browser jobs consume that exact cache", async () => {
  const workflow = await read(".github/workflows/quality.yml");
  const prepare = workflow.match(/  prepare-media:[\s\S]*?(?=\n  [a-z][\w-]*:|$)/)?.[0] ?? "";
  const fullE2E = workflow.match(/  full-e2e:[\s\S]*?(?=\n  [a-z][\w-]*:|$)/)?.[0] ?? "";
  const lighthouse = workflow.match(/  lighthouse:[\s\S]*?(?=\n  [a-z][\w-]*:|$)/)?.[0] ?? "";

  assert.match(prepare, /npm run media:sync/);
  assert.match(prepare, /media-dev-state\.mjs --cache-verify/);
  assert.match(prepare, /git diff --exit-code/);
  assert.match(prepare, /actions\/cache\/save@v4/);
  assertGeneratedMediaCache(prepare, "nightly prepared cache");
  assert.match(prepare, /steps\.media\.outputs\.fingerprint/);

  for (const [label, job] of [["full e2e", fullE2E], ["lighthouse", lighthouse]]) {
    assert.match(job, /needs: \[resolve-target, prepare-media\]/, `${label} waits for prepared media`);
    assert.match(job, /actions\/cache\/restore@v4/, `${label} restores prepared media`);
    assertGeneratedMediaCache(job, label);
    assert.match(job, /needs\.prepare-media\.outputs\.fingerprint/, `${label} uses prepared fingerprint`);
    assert.match(job, /fail-on-cache-miss: true/, `${label} must fail instead of regenerating`);
    assert.match(job, /media-dev-state\.mjs --cache-verify/, `${label} verifies prepared cache`);
    assert.doesNotMatch(job, /npm run media:sync/, `${label} must not duplicate the nightly rebuild`);
    assert.doesNotMatch(job, /restore-keys:/, `${label} must never accept stale fallback`);
  }
  assert.match(lighthouse, /npm run build:site/);
});

test("media sync command never directly spawns an npm .cmd shim on Windows", () => {
  const npmExecPath = "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js";
  const execPath = "C:\\Program Files\\nodejs\\node.exe";
  assert.deepEqual(
    resolveNpmMediaSyncCommand({
      platform: "win32",
      env: { npm_execpath: npmExecPath },
      execPath,
    }),
    {
      command: execPath,
      args: [npmExecPath, "run", "media:sync"],
    },
  );

  assert.deepEqual(
    resolveNpmMediaSyncCommand({
      platform: "win32",
      env: { ComSpec: "C:\\Windows\\System32\\cmd.exe" },
      execPath,
    }),
    {
      command: "C:\\Windows\\System32\\cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd run media:sync"],
    },
  );
});

test("media sync command preserves the direct npm path on non-Windows platforms", () => {
  assert.deepEqual(
    resolveNpmMediaSyncCommand({ platform: "linux", env: {}, execPath: "/usr/bin/node" }),
    { command: "npm", args: ["run", "media:sync"] },
  );
});
