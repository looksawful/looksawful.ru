import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

const scripts = packageJson.scripts ?? {};

function requireScript(name) {
  const value = scripts[name];
  assert.equal(typeof value, "string", `missing npm script ${name}`);
  return value;
}

function countCommand(script, command) {
  return script.split(command).length - 1;
}

test("local dev/test/build use cheap media ensure while explicit sync stays available", () => {
  const mediaSync = requireScript("media:sync");
  const mediaEnsure = requireScript("media:ensure");
  const dev = requireScript("dev");
  const testScript = requireScript("test");
  const build = requireScript("build");

  assert.match(mediaSync, /media:video:build/);
  assert.match(mediaSync, /media:build/);
  assert.match(mediaSync, /media-dev-state\.mjs --write/);
  assert.equal(mediaEnsure, "node tools/media-dev-state.mjs --ensure");

  for (const [name, script] of Object.entries({ dev, test: testScript, build })) {
    assert.match(script, /npm run media:ensure/, `${name} must ensure generated media`);
    assert.doesNotMatch(script, /media:prepare|media:video:build|media:build/, `${name} must not force a full media sync`);
  }
});

test("verify performs every expensive core stage exactly once", () => {
  const verify = requireScript("verify");
  const verifyCore = requireScript("verify:core");
  const buildSite = requireScript("build:site");

  assert.equal(verify, "npm run media:sync && npm run verify:core");
  assert.match(verifyCore, /npm run typecheck/);
  assert.match(verifyCore, /npm run test:core/);
  assert.match(verifyCore, /npm run build:site/);
  assert.match(verifyCore, /npm run test:e2e:all/);
  assert.doesNotMatch(verifyCore, /npm test|npm run test(?:\s|$)|npm run build(?:\s|$)|build:core|test:e2e:navigation|test:e2e:mpa|test:e2e:projects|test:e2e:cv/);
  assert.equal(countCommand(verifyCore, "npm run typecheck"), 1);
  assert.doesNotMatch(buildSite, /typecheck|media:ensure|media:sync|media:prepare/);
  assert.match(buildSite, /npm run build:vite/);
  assert.match(buildSite, /npm run site:postbuild/);
});

test("standalone core/build/e2e debugging scripts remain available", () => {
  assert.equal(requireScript("build:vite"), "vite build");
  assert.match(requireScript("test:core"), /node --test/);
  assert.match(requireScript("test:core"), /check-data-integrity/);
  assert.equal(requireScript("test:e2e:all"), "node tools/e2e/run-all.mjs");

  for (const name of [
    "test:e2e",
    "test:e2e:navigation",
    "test:e2e:mpa",
    "test:e2e:projects",
    "test:e2e:cv",
    "media:prepare",
    "media:build",
    "media:video",
    "media:video:build",
    "site:postbuild",
  ]) {
    requireScript(name);
  }
});

test("combined browser smoke uses one shared runtime while individual suites stay directly runnable", async () => {
  const runtimePath = new URL("../tools/e2e/runtime.mjs", import.meta.url);
  const runAllPath = new URL("../tools/e2e/run-all.mjs", import.meta.url);
  const runtime = await readFile(runtimePath, "utf8");
  const runAll = await readFile(runAllPath, "utf8");

  assert.match(runtime, /export\s+async\s+function\s+withE2ERuntime/);
  assert.match(runtime, /vite\/bin\/vite\.js/);
  assert.match(runtime, /chromium\.launch/);
  assert.match(runtime, /--strictPort/);
  assert.match(runAll, /withE2ERuntime/);

  const suites = [
    ["smoke-site.mjs", "runSmokeSite"],
    ["smoke-site-navigation.mjs", "runSmokeNavigation"],
    ["smoke-mpa.mjs", "runSmokeMpa"],
    ["smoke-project-pages.mjs", "runSmokeProjectPages"],
    ["smoke-cv.mjs", "runSmokeCv"],
  ];

  for (const [fileName, exportName] of suites) {
    const source = await readFile(new URL(`../tools/${fileName}`, import.meta.url), "utf8");
    assert.match(source, new RegExp(`export\\s+async\\s+function\\s+${exportName}`), `${fileName} must export ${exportName}`);
    assert.match(source, /withE2ERuntime/, `${fileName} must use the shared runtime only for direct execution`);
    assert.match(source, /isDirectExecution/, `${fileName} must guard its standalone wrapper`);
    assert.doesNotMatch(source, /const\s+server\s*=\s*spawn\(/, `${fileName} must not own a preview server`);
  }
});

test("shared E2E runtime terminates preview processes and preserves signal termination", async () => {
  const runtime = await readFile(new URL("../tools/e2e/runtime.mjs", import.meta.url), "utf8");

  assert.match(runtime, /server\.once\(["']exit["']/);
  assert.match(runtime, /SIGTERM/);
  assert.match(runtime, /SIGKILL/);
  assert.match(runtime, /process\.kill\(process\.pid,\s*signal\)/);
  assert.doesNotMatch(runtime, /server\.killed/);
});

test("CV smoke has explicit authored and production modes with fail-closed validation", async () => {
  const source = await readFile(new URL("../tools/smoke-cv.mjs", import.meta.url), "utf8");

  assert.match(source, /mode\s*=\s*["']authored["']/);
  assert.match(source, /authored/);
  assert.match(source, /production/);
  assert.match(source, /unsupported CV smoke mode|invalid CV smoke mode/i);
  assert.match(source, /mode\s*===\s*["']production["'][\s\S]*hiddenCards\s*===\s*0/);
});

test("caption QA is an exported suite that reuses the shared browser runtime", async () => {
  const source = await readFile(new URL("../tools/capture-caption-qa.mjs", import.meta.url), "utf8");

  assert.match(source, /export\s+async\s+function\s+captureCaptionQa/);
  assert.match(source, /withE2ERuntime/);
  assert.match(source, /isDirectExecution/);
  assert.doesNotMatch(source, /const\s+server\s*=\s*spawn\(/);
  assert.match(source, /outputDir/);
});

test("production E2E runner tests sanitized output and captures QA in the same runtime", async () => {
  assert.equal(requireScript("test:e2e:production"), "node tools/e2e/run-production.mjs");
  const source = await readFile(new URL("../tools/e2e/run-production.mjs", import.meta.url), "utf8");

  assert.match(source, /withE2ERuntime/);
  assert.match(source, /runAllSmokeSuites/);
  assert.match(source, /cvMode:\s*["']production["']/);
  assert.match(source, /captureCaptionQa/);
});
