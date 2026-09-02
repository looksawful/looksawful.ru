import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("Fast CI is the only automatic engineering verification and stays cheap", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");
  for (const command of ["npm ci", "npm run typecheck", "npm run test:fast", "npm run build:site"]) {
    assert.ok(workflow.includes(command), command);
  }
  for (const forbidden of [/playwright/i, /ffmpeg/i, /media:sync/i, /change-scope/i, /codeql/i, /lighthouse/i]) {
    assert.doesNotMatch(workflow, forbidden);
  }
  assert.match(workflow, /branches:\s*\[dev\]/);
  assert.match(workflow, /src\/content\/editorial\/\*\*/);
  assert.doesNotMatch(workflow, /^\s*pull_request:/m);
});

test("manual quality has no automatic trigger", async () => {
  const workflow = await read(".github/workflows/quality-manual.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*(?:push|pull_request|schedule):/m);
});

test("CodeQL is manual only", async () => {
  const workflow = await read(".github/workflows/codeql-manual.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*(?:push|pull_request|schedule):/m);
  assert.match(workflow, /security-events: write/);
});

test("production builds exact SHA without duplicating dev verification", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  assert.match(workflow, /Checkout exact production SHA/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /npm run build:site/);
  assert.match(workflow, /deploy-version\.txt/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  for (const forbidden of [/npm run typecheck/, /npm run test:fast/, /playwright/i, /ffmpeg/i, /media:sync/i, /codeql/i, /lighthouse/i]) {
    assert.doesNotMatch(workflow, forbidden);
  }
});

test("CMS media is explicit and dispatches Fast CI for final source-upload state", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");
  assert.match(workflow, /branches:\s*\[dev\]/);
  assert.match(workflow, /public\/media\/catalog\/\*\*/);
  assert.match(workflow, /public\/media\/projects\/index\/\*\*/);
  assert.match(workflow, /workflow_id: ["']ci-fast\.yml["']/);
  assert.match(workflow, /has_video/);
  assert.match(workflow, /has_image/);
  assert.match(workflow, /if: steps\.scope\.outputs\.has_video == 'true'/);
});

test("no quality workflow is scheduled and legacy automatic workflows are gone", async () => {
  const names = await readdir(new URL("../.github/workflows/", import.meta.url));
  const workflows = await Promise.all(names.map(async (name) => [name, await read(`.github/workflows/${name}`)]));
  for (const [name, content] of workflows) assert.doesNotMatch(content, /^\s*schedule:/m, name);
  for (const retired of [
    "verify-pr.yml", "verify-dev.yml", "verify-full.yml", "verify-cv-branch.yml",
    "dependency-audit.yml", "external-links.yml", "healthcheck.yml", "lighthouse.yml", "codeql.yml",
    "sync-cms-media-metadata.yml",
  ]) assert.equal(names.includes(retired), false, retired);
});

test("ordinary dev and build scripts do not mutate media", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  assert.equal(scripts.dev, "vite");
  assert.equal(scripts.build, "npm run build:site");
  assert.doesNotMatch(scripts.dev, /media:/);
  assert.doesNotMatch(scripts.build, /media:/);
  assert.equal(scripts["verify:fast"], "npm run typecheck && npm run test:fast && npm run build:site");
});
