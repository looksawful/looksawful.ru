import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function stepIndex(workflow, name) {
  const index = workflow.indexOf(`- name: ${name}`);
  assert.notEqual(index, -1, `missing workflow step: ${name}`);
  return index;
}

function stepBlock(workflow, name) {
  const marker = `      - name: ${name}`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step: ${name}`);
  const next = workflow.indexOf("\n      - name: ", start + marker.length);
  return workflow.slice(start, next === -1 ? workflow.length : next);
}

function assertOrdered(workflow, names) {
  let previous = -1;
  for (const name of names) {
    const current = stepIndex(workflow, name);
    assert.ok(current > previous, `${name} is out of order`);
    previous = current;
  }
}

function assertDerivativeOnlyCache(workflow) {
  const block = stepBlock(workflow, "Restore generated media");
  assert.match(block, /uses: actions\/cache@v4/);
  assert.match(block, /public\/media\/generated\/responsive\b/);
  assert.match(block, /public\/media\/generated\/video\b/);
  assert.doesNotMatch(block, /responsive-manifest\.json/);
  assert.doesNotMatch(block, /video-inventory\.json/);
  assert.doesNotMatch(block, /responsive-generated\.ts/);
  assert.match(block, /key: generated-media-v3-/);
  assert.match(block, /restore-keys:/);
}

function assertAlwaysSyncsMedia(workflow) {
  const block = stepBlock(workflow, "Sync generated media");
  assert.match(block, /run: npm run media:sync/);
  assert.doesNotMatch(block, /if:/);
}

test("PR verification fails cheaply, always validates restored media, and installs Chromium last", async () => {
  const workflow = await read(".github/workflows/verify-pr.yml");

  assert.doesNotMatch(workflow, /name: Analytics contract/);
  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assertOrdered(workflow, [
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Core tests",
    "Build site",
    "Install browser for smoke tests",
    "Browser smoke",
  ]);
  assert.match(stepBlock(workflow, "Typecheck"), /npm run typecheck/);
  assert.match(stepBlock(workflow, "Core tests"), /npm run test:core/);
  assert.match(stepBlock(workflow, "Build site"), /npm run build:site/);
  assert.match(stepBlock(workflow, "Browser smoke"), /npm run test:e2e:all/);
  assert.doesNotMatch(workflow, /npm run verify(?::core)?/);
});

test("dev verification keeps correctness coverage without caption QA or unused dist artifacts", async () => {
  const workflow = await read(".github/workflows/verify-dev.yml");

  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assertOrdered(workflow, [
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Core tests",
    "Build site",
    "Install browser for smoke tests",
    "Browser smoke",
  ]);
  assert.doesNotMatch(workflow, /capture-caption-qa\.mjs/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact/);
  assert.doesNotMatch(workflow, /npm run verify(?::core)?/);
});

test("production tests the sanitized final dist before uploading the Pages artifact", async () => {
  const workflow = await read(".github/workflows/pages.yml");

  assert.match(workflow, /statuses: write/);
  assert.match(workflow, /github-pages\/production/);
  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assertOrdered(workflow, [
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Core tests",
    "Build site",
    "Prepare production CV",
    "Install browser for smoke tests",
    "Final production browser verification",
    "Upload caption QA",
    "Stamp deployment",
    "Upload Pages artifact",
  ]);
  assert.match(stepBlock(workflow, "Final production browser verification"), /npm run test:e2e:production/);
  assert.doesNotMatch(workflow, /npm run verify(?::core)?/);
  assert.match(workflow, /delays=\(0 5 5 10 10 15 15 20 20 30 30 45 60\)/);
  assert.doesNotMatch(workflow, /seq 1 60|sleep 10\s*$/m);
  assert.match(workflow, /Cache-Control: no-cache/);
  assert.match(workflow, /attempt=/);
});

test("Lighthouse is scheduled/manual only and validates deterministic media before browser setup", async () => {
  const workflow = await read(".github/workflows/lighthouse.yml");

  assert.doesNotMatch(workflow, /push:\s*\n\s*branches:\s*\n\s*- dev/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assertOrdered(workflow, [
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Build site",
    "Install Chromium",
    "Run Lighthouse CI",
  ]);
});

test("external-link audit builds HTML/CMS content without media transcoding or browser setup", async () => {
  const workflow = await read(".github/workflows/external-links.yml");

  assert.doesNotMatch(workflow, /ffmpeg|ffprobe|media:sync|media:prepare|playwright|chromium/i);
  assertOrdered(workflow, ["Install", "Build HTML", "Apply CV content", "Check external links"]);
  assert.match(stepBlock(workflow, "Build HTML"), /npm run build:vite/);
  assert.match(stepBlock(workflow, "Apply CV content"), /npm run cv:content:apply/);
  assert.match(stepBlock(workflow, "Check external links"), /npm run check:external-links/);
});

test("specialized CV branch keeps screenshots and adds production CV smoke without a second full verify", async () => {
  const workflow = await read(".github/workflows/verify-cv-branch.yml");

  assert.match(workflow, /CV_SMOKE_CAPTURE_DIR: artifacts\/cv-smoke/);
  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assertOrdered(workflow, [
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Core tests",
    "Build site",
    "Install browser for smoke tests",
    "Authored browser smoke",
    "Prepare production CV",
    "Production CV smoke",
    "Upload CV visual QA",
  ]);
  assert.match(stepBlock(workflow, "Authored browser smoke"), /npm run test:e2e:all/);
  assert.match(stepBlock(workflow, "Production CV smoke"), /npm run test:e2e:cv:production/);
  assert.doesNotMatch(workflow, /npm run verify(?::core)?/);
});

test("shootings integration keeps its intentional early isolation guard and then uses optimized stages", async () => {
  const workflow = await read(".github/workflows/verify-shootings-data-integration.yml");

  assertOrdered(workflow, [
    "Verify presentation isolation first",
    "Install",
    "Typecheck",
    "Restore generated media",
    "Ensure media tooling",
    "Sync generated media",
    "Core tests",
    "Build site",
    "Install browser for smoke tests",
    "Browser smoke",
  ]);
  assert.match(stepBlock(workflow, "Verify presentation isolation first"), /shootings-data-isolation\.test\.mjs/);
  assertDerivativeOnlyCache(workflow);
  assertAlwaysSyncsMedia(workflow);
  assert.doesNotMatch(workflow, /npm run verify(?::core)?/);
});

test("duplicate architecture workflow is removed once its contracts remain in normal node tests", async () => {
  await assert.rejects(
    () => read(".github/workflows/verify-site-architecture.yml"),
    /ENOENT/,
  );
});

test("package exposes a focused production CV smoke helper for the specialized branch", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts["test:e2e:cv:production"], "node tools/e2e/run-cv-production.mjs");
});
