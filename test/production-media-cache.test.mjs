import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/pages.yml", "utf8");

function stepBlock(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = workflow.match(new RegExp(`      - name: ${escaped}\\n([\\s\\S]*?)(?=      - name: |\\n  deploy:|$)`));
  assert.ok(match, `missing workflow step: ${name}`);
  return match[0];
}

test("warm production path restores exact v3 cache and verifies it without regeneration", () => {
  const restore = stepBlock("Restore exact generated media cache");
  assert.match(restore, /actions\/cache\/restore@v6/);
  assert.match(restore, /key: generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);
  assert.doesNotMatch(restore, /restore-keys:/);

  assert.match(stepBlock("Verify exact generated media cache"), /node tools\/media-dev-state\.mjs --cache-verify/);
  for (const name of [
    "Install media tooling on exact cache miss",
    "Regenerate exact media cache on miss",
    "Write canonical generated-media cache marker on miss",
    "Require clean tracked tree after cache recovery",
    "Save exact generated media cache on miss",
  ]) {
    assert.match(stepBlock(name), /if: steps\.media-cache\.outputs\.cache-hit != 'true'/);
  }
});

test("production exact cache miss recovers deterministically and saves the exact v3 key", () => {
  const tooling = stepBlock("Install media tooling on exact cache miss");
  assert.match(tooling, /sudo apt-get install --yes ffmpeg/);

  const regenerate = stepBlock("Regenerate exact media cache on miss");
  assert.match(regenerate, /npm run media:sync/);

  const marker = stepBlock("Write canonical generated-media cache marker on miss");
  assert.match(marker, /node tools\/media-dev-state\.mjs --cache-write/);

  const verify = stepBlock("Verify exact generated media cache");
  assert.match(verify, /node tools\/media-dev-state\.mjs --cache-verify/);

  const mutation = stepBlock("Require clean tracked tree after cache recovery");
  assert.match(mutation, /git diff --exit-code --/);

  const save = stepBlock("Save exact generated media cache on miss");
  assert.match(save, /actions\/cache\/save@v6/);
  assert.match(save, /key: generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);

  const recoveryIndex = workflow.indexOf("- name: Regenerate exact media cache on miss");
  const markerIndex = workflow.indexOf("- name: Write canonical generated-media cache marker on miss");
  const verifyIndex = workflow.indexOf("- name: Verify exact generated media cache");
  const mutationIndex = workflow.indexOf("- name: Require clean tracked tree after cache recovery");
  const saveIndex = workflow.indexOf("- name: Save exact generated media cache on miss");
  const typecheckIndex = workflow.indexOf("- name: Typecheck");
  const fastIndex = workflow.indexOf("- name: Fast tests");
  const buildIndex = workflow.indexOf("- name: Build site");
  assert.ok(
    recoveryIndex >= 0 &&
      recoveryIndex < markerIndex &&
      markerIndex < verifyIndex &&
      verifyIndex < mutationIndex &&
      mutationIndex < saveIndex &&
      saveIndex < typecheckIndex &&
      typecheckIndex < fastIndex &&
      fastIndex < buildIndex,
  );
});

test("production media cache path has no stale fallback or verification/write bypass", () => {
  assert.doesNotMatch(workflow, /restore-keys:/);
  assert.doesNotMatch(workflow, /generated-media-v2-/);
  assert.doesNotMatch(workflow, /cache-verify[^\n]*(?:\|\|\s*true)|continue-on-error/);
  assert.doesNotMatch(workflow, /git\s+(?:commit|push)\b/);
  assert.doesNotMatch(workflow, /gh\s+workflow\s+run|createWorkflowDispatch/);
});
