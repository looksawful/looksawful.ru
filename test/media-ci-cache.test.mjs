import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageUrl = new URL("../package.json", import.meta.url);
const workflowUrls = [
  new URL("../.github/workflows/verify-pr.yml", import.meta.url),
  new URL("../.github/workflows/verify-dev.yml", import.meta.url),
  new URL("../.github/workflows/pages.yml", import.meta.url),
];

test("verify prepares generated media at most once while standalone test/build remain self-contained", async () => {
  const pkg = JSON.parse(await readFile(packageUrl, "utf8"));
  const scripts = pkg.scripts ?? {};

  assert.equal(
    scripts["media:prepare"],
    "npm run media:video:build && npm run media:build",
  );
  assert.match(scripts["test:core"], /node --test/);
  assert.doesNotMatch(scripts["test:core"], /media:(?:video:)?build|media:prepare/);
  assert.match(scripts["build:core"], /vite build/);
  assert.doesNotMatch(scripts["build:core"], /media:(?:video:)?build|media:prepare/);
  assert.equal(scripts.test, "npm run media:prepare && npm run test:core");
  assert.equal(scripts.build, "npm run media:prepare && npm run build:core");
  assert.match(scripts["verify:core"], /npm run test:core/);
  assert.match(scripts["verify:core"], /npm run build:core/);
  assert.doesNotMatch(scripts["verify:core"], /media:(?:video:)?build|media:prepare/);
  assert.equal(scripts.verify, "npm run media:prepare && npm run verify:core");
});

test("CI restores complete generated-media state by content hash and skips regeneration on exact cache hits", async () => {
  for (const workflowUrl of workflowUrls) {
    const workflow = await readFile(workflowUrl, "utf8");
    const label = workflowUrl.pathname.split("/").at(-1);

    assert.match(workflow, /uses: actions\/cache@v4/, `${label} must restore generated media cache`);
    assert.match(workflow, /id: media-cache/, `${label} must expose media cache hit state`);
    assert.match(workflow, /public\/media\/generated\/responsive/, `${label} must cache responsive derivatives`);
    assert.match(workflow, /public\/media\/generated\/video/, `${label} must cache video derivatives`);
    assert.match(workflow, /public\/media\/generated\/responsive-manifest\.json/, `${label} must cache responsive manifest`);
    assert.match(workflow, /public\/media\/generated\/video-inventory\.json/, `${label} must cache video inventory`);
    assert.match(workflow, /src\/data\/media\/responsive-generated\.ts/, `${label} must cache generated responsive catalog`);
    assert.match(workflow, /key: generated-media-v2-/, `${label} must invalidate incomplete v1 caches`);
    assert.match(workflow, /hashFiles\([\s\S]*public\/media\/[\s\S]*src\/data\/media\/assets[\s\S]*build-responsive-media\.mjs[\s\S]*build-video-media\.mjs[\s\S]*\)/, `${label} cache key must follow media sources and builders`);
    assert.match(workflow, /media-cache\.outputs\.cache-hit != 'true'[\s\S]*npm run media:prepare/, `${label} must prepare media only on cache miss`);
    assert.match(workflow, /run: npm run verify:core/, `${label} must not invoke the self-preparing verify command`);
  }
});

test("Lighthouse reuses generated media and builds core output without redundant preparation", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/lighthouse.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /uses: actions\/cache@v4/);
  assert.match(workflow, /id: media-cache/);
  assert.match(workflow, /public\/media\/generated\/responsive/);
  assert.match(workflow, /public\/media\/generated\/video/);
  assert.match(workflow, /public\/media\/generated\/responsive-manifest\.json/);
  assert.match(workflow, /public\/media\/generated\/video-inventory\.json/);
  assert.match(workflow, /src\/data\/media\/responsive-generated\.ts/);
  assert.match(workflow, /key: generated-media-v2-/);
  assert.match(
    workflow,
    /media-cache\.outputs\.cache-hit != 'true'[\s\S]*npm run media:prepare/,
  );
  assert.match(workflow, /run: npm run build:core/);
  assert.doesNotMatch(workflow, /run: npm run build\s*$/m);
});
