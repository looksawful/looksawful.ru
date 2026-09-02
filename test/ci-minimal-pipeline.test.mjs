import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

const expectedWorkflows = [
  "ci-fast.yml",
  "cms-media.yml",
  "codeql.yml",
  "pages-cms-publish.yml",
  "pages.yml",
  "quality.yml",
];

test("Fast CI automatically validates engineering dev pushes and PRs while warm-cache path stays cheap", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[dev\]/);
  assert.match(workflow, /pull_request:\s*\n\s*branches:\s*\[dev, prod\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /workflow_call:/);

  for (const command of ["npm ci", "npm run typecheck", "npm run test:fast", "npm run build:site"]) {
    assert.ok(workflow.includes(command), command);
  }

  assert.match(workflow, /actions\/cache\/restore@v4/);
  assert.match(workflow, /generated-media-v3-\$\{\{ runner\.os \}\}-\$\{\{ steps\.media\.outputs\.fingerprint \}\}/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);
  assert.doesNotMatch(workflow, /restore-keys:/);

  assert.match(workflow, /Install recovery video tooling on cache miss[\s\S]*?if: steps\.media-cache\.outputs\.cache-hit != 'true'[\s\S]*?ffmpeg/);
  assert.match(workflow, /Recover generated media on cache miss[\s\S]*?if: steps\.media-cache\.outputs\.cache-hit != 'true'[\s\S]*?npm run media:sync/);

  for (const forbidden of [/playwright/i, /test:e2e:full/i, /lighthouse/i, /change-scope/i]) {
    assert.doesNotMatch(workflow, forbidden);
  }
  assert.doesNotMatch(workflow, /git\s+(?:commit|push)\b/);

  for (const editorial of [
    "src/content/editorial/cv.json",
    "src/content/editorial/home-project-cards.json",
  ]) {
    assert.ok(workflow.includes(editorial), `Fast CI must ignore proven copy-only path ${editorial}`);
  }
});

test("production validates exact prod tree, exact media cache, fast safety, compact sanity and deployed SHA", async () => {
  const workflow = await read(".github/workflows/pages.yml");

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[prod\]/);
  assert.match(workflow, /Checkout exact production SHA/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --fingerprint/);
  assert.match(workflow, /actions\/cache\/restore@v4/);
  assert.doesNotMatch(workflow, /restore-keys:/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /npm run build:site/);
  assert.match(workflow, /npm run cv:prod:prepare/);
  assert.match(workflow, /npm run test:e2e:production/);
  assert.match(workflow, /npm run cv:prod:verify/);
  assert.match(workflow, /deploy-version\.txt/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(workflow, /looksawful\.ru\/deploy-version\.txt/);
  assert.match(workflow, /looksawful\.ru\/cv\//);
  assert.match(workflow, /\/assets\/\[\^/);
  assert.doesNotMatch(workflow, /npm run media:sync/);
});

test("CMS media distinguishes references, image sources and video sources, saves cache, and validates once", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[dev\]/);
  assert.match(workflow, /public\/media\/catalog\/\*\*/);
  assert.match(workflow, /public\/media\/projects\/index\/\*\*/);
  assert.match(workflow, /has_image/);
  assert.match(workflow, /has_video/);
  assert.match(workflow, /has_source/);

  assert.match(workflow, /Install video tooling[\s\S]*?if: steps\.scope\.outputs\.has_video == 'true'[\s\S]*?ffmpeg/);
  assert.match(workflow, /Build image derivatives incrementally[\s\S]*?if: steps\.scope\.outputs\.rebuild != 'true' && steps\.scope\.outputs\.has_image == 'true'/);
  assert.match(workflow, /npm run test:media:contract/);
  assert.match(workflow, /npm run test:media:checks/);
  assert.match(workflow, /actions\/cache\/save@v4/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-write/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);

  assert.equal((workflow.match(/npm run typecheck/g) ?? []).length, 1);
  assert.equal((workflow.match(/npm run test:fast/g) ?? []).length, 1);
  assert.equal((workflow.match(/npm run build:site/g) ?? []).length, 1);
  assert.doesNotMatch(workflow, /createWorkflowDispatch|gh workflow run|workflow_id:\s*["']ci-fast\.yml["']/);
  assert.doesNotMatch(workflow, /playwright|test:e2e/i);

  assert.match(workflow, /allowed=\([\s\S]*?src\/data\/media\/catalog-records\.generated\.ts[\s\S]*?public\/media\/generated\/responsive-manifest\.json[\s\S]*?public\/media\/generated\/video-inventory\.json[\s\S]*?src\/data\/media\/responsive-generated\.ts[\s\S]*?src\/content\/media-catalog\/registered[\s\S]*?src\/content\/media-catalog\/uploads[\s\S]*?\)/);
  assert.doesNotMatch(workflow, /git add -A/);
});

test("scheduled quality remains automatic but expensive suites are outside ordinary push CI", async () => {
  const workflow = await read(".github/workflows/quality.yml");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /17 \*\/6 \* \* \*/);
  assert.match(workflow, /31 2 \* \* \*/);
  assert.match(workflow, /41 4 \* \* 2/);
  assert.match(workflow, /13 5 \* \* 3/);
  assert.match(workflow, /23 6 \* \* 4/);
  assert.match(workflow, /npm run test:e2e:full/);
  assert.match(workflow, /npm run audit:deps/);
  assert.match(workflow, /npm run lighthouse/);
  assert.match(workflow, /npm run check:external-links/);
  assert.match(workflow, /check-production\.mjs/);
  assert.doesNotMatch(workflow, /^\s*push:/m);
});

test("CodeQL remains automatic for PRs and weekly schedule and remains manually runnable", async () => {
  const workflow = await read(".github/workflows/codeql.yml");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /dev/);
  assert.match(workflow, /prod/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /security-events: write/);
  assert.doesNotMatch(workflow, /^\s*push:/m);
});

test("minimal workflow set contains no retired verification or migration runners", async () => {
  const names = (await readdir(new URL("../.github/workflows/", import.meta.url)))
    .filter((name) => name.endsWith(".yml"))
    .sort();

  assert.deepEqual(names, expectedWorkflows);
  assert.equal(names.some((name) => /migration|materialize|manual/i.test(name)), false);
});

test("ordinary dev and build scripts do not mutate media", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  assert.equal(scripts.dev, "vite");
  assert.equal(scripts.build, "npm run build:site");
  assert.doesNotMatch(scripts.dev, /media:/);
  assert.doesNotMatch(scripts.build, /media:/);
});
