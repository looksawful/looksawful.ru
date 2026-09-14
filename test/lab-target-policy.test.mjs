import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../src/devtools/lab/target-policy.ts", import.meta.url);

async function loadPolicy() {
  return import(sourceUrl.href);
}

test("Lab target kinds are closed and preserve local, PR preview and production as distinct targets", async () => {
  const { LAB_TARGET_KINDS, getLabTargetPolicy } = await loadPolicy();

  assert.deepEqual(LAB_TARGET_KINDS, ["local", "pr-preview", "production"]);
  assert.equal(getLabTargetPolicy("local").kind, "local");
  assert.equal(getLabTargetPolicy("pr-preview").kind, "pr-preview");
  assert.equal(getLabTargetPolicy("production").kind, "production");
  assert.throws(() => getLabTargetPolicy("invented-target"), /unknown Lab target/i);
});

test("local Lab target permits same-origin inspection and ephemeral CSS scratch only", async () => {
  const { canUseLabCapability, getLabTargetPolicy } = await loadPolicy();
  const local = getLabTargetPolicy("local");

  assert.equal(local.readDom, true);
  assert.equal(local.targetMutation, "lab-ephemeral-only");
  assert.equal(local.cmsWrite, false);
  assert.equal(canUseLabCapability("local", "dom-inspector"), true);
  assert.equal(canUseLabCapability("local", "computed-styles"), true);
  assert.equal(canUseLabCapability("local", "copy-selector"), true);
  assert.equal(canUseLabCapability("local", "css-scratch"), true);
});

test("PR preview and production targets fail closed to DOM access and target mutation", async () => {
  const { canUseLabCapability, getLabTargetPolicy } = await loadPolicy();

  for (const kind of ["pr-preview", "production"]) {
    const policy = getLabTargetPolicy(kind);
    assert.equal(policy.readDom, false);
    assert.equal(policy.targetMutation, "none");
    assert.equal(policy.cmsWrite, false);

    for (const capability of ["dom-inspector", "computed-styles", "copy-selector", "css-scratch"]) {
      assert.equal(canUseLabCapability(kind, capability), false, `${kind} must block ${capability}`);
    }

    for (const capability of ["route-switch", "viewport-frame", "canvas-background", "canvas-grid"]) {
      assert.equal(canUseLabCapability(kind, capability), true, `${kind} should keep ${capability}`);
    }
  }
});

test("target capability policy contains no CMS or Media Desk mutation bridge", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.doesNotMatch(source, /CONTENT_DESK_WRITE|__media-desk\/api|method:\s*["'](?:POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /window\.parent|postMessage\s*\(/);
});
