import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const step = (workflow, name) => workflow.match(new RegExp(`      - name: ${name}\\n[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";

const workflows = [
  "ci-fast",
  "cms-media",
  "codeql",
  "pages-cms-publish",
  "pages",
  "quality",
];

test("media contracts retain complete data-integrity coverage", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  assert.match(scripts["test:media:contract"], /check-data-integrity/);
  assert.match(scripts["test:media:checks"], /check-data-integrity/);
});

test("Fast CI is read-only, automatic for dev and PRs, and checks exact generated media before build", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /push:\s*\n\s*branches:\s*\[dev\]/);
  assert.match(workflow, /pull_request:\s*\n\s*branches:\s*\[dev, prod\]/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --fingerprint/);
  assert.match(workflow, /actions\/cache\/restore@v4/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /npm run build:site/);
  assert.doesNotMatch(workflow, /contents: write|git commit|git push|continue-on-error/);
  assert.doesNotMatch(workflow, /test:e2e:full|lighthouse/i);
});

test("production deploy builds exact prod SHA, validates fast safety, compact browser sanity and published SHA/assets/CV", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /needs: build/);
  for (const command of [
    "npm ci",
    "npm run typecheck",
    "npm run test:fast",
    "npm run build:site",
    "npm run cv:prod:prepare",
    "npm run test:e2e:production",
    "npm run cv:prod:verify",
    "dist/deploy-version.txt",
    "dist/.nojekyll",
    "actions/upload-pages-artifact",
    "actions/deploy-pages",
    "github-pages/production",
  ]) assert.ok(workflow.includes(command), command);
  assert.match(workflow, /actions\/cache\/restore@v4/);
  assert.doesNotMatch(workflow, /restore-keys:/);
  assert.match(workflow, /media-dev-state\.mjs --cache-verify/);
  assert.match(step(workflow, "Regenerate exact media cache on miss"), /if: steps\.media-cache\.outputs\.cache-hit != 'true'[\s\S]*npm run media:sync/);
  assert.match(step(workflow, "Require clean tracked tree after cache recovery"), /if: steps\.media-cache\.outputs\.cache-hit != 'true'[\s\S]*git diff --exit-code/);
  assert.match(workflow, /https:\/\/www\.looksawful\.ru\/deploy-version\.txt/);
  assert.match(workflow, /https:\/\/www\.looksawful\.ru\/cv\//);
  assert.match(workflow, /Cache-Control: no-cache/);
  assert.match(workflow, /commit=\$\{GITHUB_SHA\}/);
  assert.doesNotMatch(workflow, /test:e2e:full/);
});

test("full regression remains scheduled and manual outside push CI", async () => {
  const workflow = await read(".github/workflows/quality.yml");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /npm run test:core/);
  assert.match(workflow, /npm run test:e2e:full/);
  assert.match(workflow, /npm run media:sync/);
  assert.doesNotMatch(workflow, /^\s*push:/m);

  const runner = await read("tools/e2e/run-all.mjs");
  for (const suite of ["runSmokeSite", "runSmokeNavigation", "runSmokeMpa", "runSmokeProjectPages", "runSmokeCv"]) {
    assert.ok(runner.includes(suite), suite);
  }
  assert.match(runner, /mapWithConcurrency/);
});

test("CMS media mutation is explicit, allowlisted, race-safe and does one final Fast validation", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");
  assert.match(workflow, /branches: \[dev\]/);
  assert.match(workflow, /paths:/);
  assert.match(workflow, /CMS media attempted unexpected tracked mutation/);
  assert.match(workflow, /git push origin HEAD:dev/);
  assert.match(workflow, /git rev-parse origin\/dev/);
  assert.match(workflow, /SOURCE_SHA/);
  assert.doesNotMatch(workflow, /createWorkflowDispatch|gh workflow run|git\s+(?:push|update-ref)\b[^\n]*--force(?:-with-lease)?/);
  assert.equal((workflow.match(/npm run typecheck/g) ?? []).length, 1);
  assert.equal((workflow.match(/npm run test:fast/g) ?? []).length, 1);
  assert.equal((workflow.match(/npm run build:site/g) ?? []).length, 1);
  assert.doesNotMatch(workflow, /git add -A/);
});

test("scheduled quality and CodeQL remain automatic", async () => {
  const quality = await read(".github/workflows/quality.yml");
  for (const marker of ["17 */6 * * *", "31 2 * * *", "41 4 * * 2", "13 5 * * 3", "23 6 * * 4"]) {
    assert.ok(quality.includes(marker), marker);
  }
  assert.match(quality, /workflow_dispatch:/);

  const codeql = await read(".github/workflows/codeql.yml");
  assert.match(codeql, /pull_request:/);
  assert.match(codeql, /schedule:/);
  assert.match(codeql, /workflow_dispatch:/);
  assert.match(codeql, /security-events: write/);
  assert.doesNotMatch(codeql, /^\s*push:/m);
});

test("dependency automation targets dev and official actions stay on current majors", async () => {
  const dependabot = await read(".github/dependabot.yml");
  const targetBranches = [...dependabot.matchAll(/target-branch:\s*([^\s]+)/g)].map((match) => match[1]);
  assert.deepEqual(targetBranches, ["dev", "dev"]);

  for (const name of workflows) {
    const workflow = await read(`.github/workflows/${name}.yml`);
    assert.doesNotMatch(workflow, /actions\/checkout@v[1-6](?:\D|$)/, `${name}: stale checkout major`);
    assert.doesNotMatch(workflow, /actions\/setup-node@v[1-6](?:\D|$)/, `${name}: stale setup-node major`);
    assert.doesNotMatch(workflow, /actions\/upload-artifact@v[1-6](?:\D|$)/, `${name}: stale upload-artifact major`);
  }

  assert.match(await read(".github/workflows/pages.yml"), /actions\/deploy-pages@v5/);
});
