import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("agent verification workflow is finite, exact-SHA scoped, chat-triggerable, and read-only", async () => {
  const workflow = await read(".github/workflows/agent-verify.yml");

  assert.match(workflow, /^name: Agent Verify/m);
  assert.match(workflow, /workflow_dispatch:\s*\n\s*inputs:/);
  assert.match(workflow, /issue_comment:\s*\n\s*types:\s*\[created\]/);
  assert.match(workflow, /target_sha:\s*\n[\s\S]*?required:\s*true/);
  assert.match(workflow, /suite:\s*\n[\s\S]*?type:\s*choice/);

  for (const suite of ["fast", "browser-smoke", "responsive"]) {
    assert.match(workflow, new RegExp(`- ${suite.replace("-", "\\-")}`));
  }

  assert.match(workflow, /author_association/);
  assert.match(workflow, /OWNER/);
  assert.match(workflow, /COLLABORATOR/);
  assert.match(workflow, /\/verify/);
  assert.match(workflow, /\[0-9a-fA-F\]\{40\}/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /ref:\s*\$\{\{\s*steps\.request\.outputs\.target_sha\s*\}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /npm run toolchain:doctor -- --json/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /browser-launch-probe\.mjs/);

  const mediaFingerprint = workflow.indexOf("- name: Calculate canonical media fingerprint");
  const mediaRestore = workflow.indexOf("- name: Restore exact generated media cache");
  const mediaVerify = workflow.indexOf("- name: Verify restored generated media");
  const mediaRecover = workflow.indexOf("- name: Recover generated media on cache miss");
  const browserBuild = workflow.indexOf("- name: Build browser target");

  assert.ok(mediaFingerprint >= 0, "browser profiles must calculate the canonical generated-media fingerprint");
  assert.ok(mediaRestore > mediaFingerprint, "browser profiles must restore generated media after fingerprinting");
  assert.ok(mediaVerify > mediaRestore, "restored generated media must be verified before browser build");
  assert.ok(mediaRecover > mediaRestore, "cache miss must recover generated media instead of continuing with missing assets");
  assert.ok(browserBuild > mediaVerify, "browser build must run only after generated media provisioning");
  assert.match(workflow, /generated-media-v3-\$\{\{\s*runner\.os\s*\}\}-\$\{\{\s*steps\.media\.outputs\.fingerprint\s*\}\}/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);
  assert.match(workflow, /npm run media:sync/);
  assert.match(workflow, /git diff --exit-code/);

  assert.match(
    workflow,
    /- name: Build browser target\s*\n\s*if:\s*\$\{\{[\s\S]*?browser-smoke[\s\S]*?responsive[\s\S]*?\}\}\s*\n\s*run:\s*npm run build:vite/,
    "browser-smoke and responsive must both build dist before preview-based browser checks",
  );
  assert.match(
    workflow,
    /- name: Browser smoke\s*\n\s*if:\s*\$\{\{\s*steps\.request\.outputs\.suite == 'browser-smoke'\s*\}\}\s*\n\s*run:\s*npm run test:e2e:smoke/,
  );
  assert.doesNotMatch(workflow, /npm run test:e2e:full/);
  assert.match(workflow, /npm run test:ui:responsive/);

  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /permissions:[\s\S]*?contents:\s*write/);
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  assert.doesNotMatch(workflow, /run:\s*\$\{\{\s*inputs\./);
});
