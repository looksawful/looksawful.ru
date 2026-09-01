import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const step = (workflow, name) => workflow.match(new RegExp(`      - name: ${name}\\n[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";

for (const name of ["verify-dev.yml", "verify-pr.yml"]) {
  test(`${name}: read-only verification retains cheap checks, build and affected browser validation`, async () => {
    const workflow = await read(`.github/workflows/${name}`);
    assert.match(workflow, /contents: read/);
    assert.doesNotMatch(workflow, /contents: write|git commit|git push|continue-on-error/);
    for (const command of ["typecheck", "test:fast", "build:site", "test:e2e:affected"]) assert.ok(workflow.includes(`npm run ${command}`), command);
    assert.match(workflow, /change-scope\.mjs/);
    assert.match(workflow, /media:catalog:check/);
    assert.match(workflow, /media:sync/);
    assert.match(workflow, /media-scope\.outputs\.needs_sync == 'true'/);
    assert.match(workflow, /test:media:checks/);
    assert.match(workflow, /git diff --exit-code/);
    assert.match(step(workflow, "Check CMS media catalog"), /needs_sync == 'true'/);
    assert.match(step(workflow, "Check unchanged catalog structure"), /needs_sync != 'true'/);
    assert.match(step(workflow, "Check unchanged catalog structure"), /--check-stored/);
    assert.ok(workflow.indexOf("Ensure media tooling") < workflow.indexOf("Check CMS media catalog"));
    assert.ok(workflow.indexOf("npm run typecheck") < workflow.indexOf("Ensure media tooling"));
    assert.ok(workflow.indexOf("npm run test:fast") < workflow.indexOf("playwright install"));
    assert.doesNotMatch(workflow, /test:e2e:all|test:e2e:full/);
  });
}

test("production deploy depends on validated exact artifact and checks published SHA/assets/CV", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /needs: build/);
  for (const command of ["npm ci", "npm run typecheck", "npm run test:fast", "npm run build:site", "npm run test:e2e:production", "prepare-cv-production.mjs", "dist/deploy-version.txt", "dist/.nojekyll", "actions/upload-pages-artifact", "actions/deploy-pages", "github-pages/production"]) assert.ok(workflow.includes(command), command);
  assert.doesNotMatch(step(workflow, "Final production browser verification"), /if:/);
  assert.match(workflow, /https:\/\/www\.looksawful\.ru\/deploy-version\.txt/);
  assert.match(workflow, /https:\/\/www\.looksawful\.ru\/cv\//);
  assert.match(workflow, /Cache-Control: no-cache/);
  assert.match(workflow, /commit=\$\{GITHUB_SHA\}/);
  assert.match(workflow, /assets_ok/);
  assert.match(workflow, /curl[^\n]*asset_path/);
  assert.match(workflow, /grep -Fq '<main class="resume">'/);
  assert.doesNotMatch(workflow, /find test|! -name|continue-on-error|cv_copy_only/);
});

test("full regression remains scheduled and manual with deterministic media and all original suites", async () => {
  const workflow = await read(".github/workflows/verify-full.yml");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /change-scope\.mjs --full/);
  assert.match(workflow, /npm run test:core/);
  assert.match(workflow, /npm run test:e2e:full/);
  assert.match(workflow, /media:sync/);
  const runner = await read("tools/e2e/run-all.mjs");
  for (const suite of ["runSmokeSite", "runSmokeNavigation", "runSmokeMpa", "runSmokeProjectPages", "runSmokeCv"]) assert.ok(runner.includes(suite));
  assert.match(runner, /mapWithConcurrency/);
});

test("CMS mutation is explicit, narrowly scoped, race-safe and verifies its resulting SHA", async () => {
  const workflow = await read(".github/workflows/sync-cms-media-metadata.yml");
  assert.match(workflow, /branches: \[dev\]/);
  assert.match(workflow, /paths:/);
  assert.match(workflow, /Refusing to persist generated metadata/);
  assert.match(workflow, /git push origin HEAD:dev/);
  assert.match(workflow, /git rev-parse origin\/dev/);
  assert.match(workflow, /createWorkflowDispatch/);
  assert.doesNotMatch(workflow, /--force/);
  // Pages CMS always sends payload to action workflows. Removing the input breaks buttons.
  assert.match(await read(".github/workflows/verify-pr.yml"), /inputs:\s*\n\s+payload:/);
});

test("CV branch stays focused; integrated shootings workflow is retired without deleting its tests", async () => {
  const cv = await read(".github/workflows/verify-cv-branch.yml");
  assert.match(cv, /npm run test:cv/);
  assert.match(cv, /npm run test:e2e:cv\n/);
  assert.match(cv, /npm run test:e2e:cv:production/);
  assert.match(cv, /CV_SMOKE_CAPTURE_DIR/);
  assert.doesNotMatch(cv, /test:e2e:all|test:e2e:full/);
  await assert.rejects(read(".github/workflows/verify-shootings-data-integration.yml"), /ENOENT/);
  assert.match(await read("test/shootings-data-isolation.test.mjs"), /all 80 imported Behance/);
});

test("independent security and scheduled checks remain enabled", async () => {
  for (const name of ["healthcheck", "dependency-audit", "external-links", "lighthouse", "codeql"]) {
    const workflow = await read(`.github/workflows/${name}.yml`);
    assert.match(workflow, /schedule:/);
    if (name !== "codeql") assert.match(workflow, /workflow_dispatch:/);
  }
  const codeql = await read(".github/workflows/codeql.yml");
  assert.match(codeql, /push:/);
  assert.match(codeql, /pull_request:/);
  assert.match(codeql, /security-events: write/);
  const links = await read(".github/workflows/external-links.yml");
  assert.doesNotMatch(links, /ffmpeg|media:sync|playwright/i);
});
