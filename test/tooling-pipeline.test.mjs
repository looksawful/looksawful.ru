import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const scripts = packageJson.scripts ?? {};

function requireScript(name) {
  const value = scripts[name];
  assert.equal(typeof value, "string", `missing npm script ${name}`);
  return value;
}

function countCommand(script, command) {
  return script.split(command).length - 1;
}

test("local dev and ordinary build stay non-mutating while explicit media preparation remains available", () => {
  const mediaSync = requireScript("media:sync");
  const mediaEnsure = requireScript("media:ensure");
  assert.equal(requireScript("dev"), "vite");
  assert.equal(requireScript("build"), "npm run build:site");
  assert.equal(requireScript("test"), "npm run test:fast");

  assert.match(mediaSync, /media:catalog:sync/);
  assert.match(mediaSync, /media:video:build/);
  assert.match(mediaSync, /media:build/);
  assert.match(mediaSync, /media-dev-state\.mjs --write/);
  assert.match(mediaEnsure, /media:catalog:sync/);
  assert.match(mediaEnsure, /media-dev-state\.mjs --ensure/);

  assert.doesNotMatch(requireScript("dev"), /media:/);
  assert.doesNotMatch(requireScript("build"), /media:/);
  assert.doesNotMatch(requireScript("build:site"), /media:sync|media:ensure|media:prepare/);
});

test("explicit full verification performs expensive core stages exactly once", () => {
  const verify = requireScript("verify:full");
  const verifyCore = requireScript("verify:core");
  const buildSite = requireScript("build:site");

  assert.equal(verify, "npm run media:sync && npm run verify:core");
  assert.match(verifyCore, /npm run typecheck/);
  assert.match(verifyCore, /npm run test:core/);
  assert.match(verifyCore, /npm run build:site/);
  assert.match(verifyCore, /npm run test:e2e:full/);
  assert.equal(countCommand(verifyCore, "npm run typecheck"), 1);
  assert.match(buildSite, /npm run cms:check/);
  assert.match(buildSite, /npm run build:vite/);
  assert.match(buildSite, /npm run site:postbuild/);
});

test("standalone core, media and browser debugging scripts remain available", () => {
  assert.equal(requireScript("build:vite"), "vite build");
  assert.match(requireScript("test:core"), /node --test/);
  assert.match(requireScript("test:core"), /check-data-integrity/);
  assert.equal(requireScript("test:e2e:full"), "node tools/e2e/run-all.mjs");

  for (const name of [
    "test:e2e",
    "test:e2e:navigation",
    "test:e2e:mpa",
    "test:e2e:projects",
    "test:e2e:cv",
    "test:e2e:smoke",
    "test:e2e:affected",
    "test:e2e:production",
    "media:prepare",
    "media:build",
    "media:video",
    "media:video:build",
    "site:postbuild",
  ]) requireScript(name);
});

test("combined browser regression uses one shared runtime while individual suites remain directly runnable", async () => {
  const runtime = await readFile(new URL("../tools/e2e/runtime.mjs", import.meta.url), "utf8");
  const runAll = await readFile(new URL("../tools/e2e/run-all.mjs", import.meta.url), "utf8");
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
    assert.match(source, new RegExp(`export\\s+async\\s+function\\s+${exportName}`));
    assert.match(source, /withE2ERuntime/);
    assert.match(source, /isDirectExecution/);
    assert.doesNotMatch(source, /const\s+server\s*=\s*spawn\(/);
  }
});

test("full browser regression validates the production CV artifact produced by build:site", async () => {
  const runAll = await readFile(new URL("../tools/e2e/run-all.mjs", import.meta.url), "utf8");
  assert.match(
    runAll,
    /isDirectExecution[\s\S]*runAllSmokeSuites\(\{\s*browser,\s*baseUrl,\s*cvMode:\s*["']production["']\s*\}\)/,
  );
});

test("shared E2E runtime terminates preview processes and preserves signal termination", async () => {
  const runtime = await readFile(new URL("../tools/e2e/runtime.mjs", import.meta.url), "utf8");
  assert.match(runtime, /server\.once\(["']exit["']/);
  assert.match(runtime, /SIGTERM/);
  assert.match(runtime, /SIGKILL/);
  assert.match(runtime, /process\.kill\(process\.pid,\s*signal\)/);
  assert.doesNotMatch(runtime, /server\.killed/);
});

test("CV smoke retains authored and production fail-closed modes", async () => {
  const source = await readFile(new URL("../tools/smoke-cv.mjs", import.meta.url), "utf8");
  assert.match(source, /mode\s*=\s*["']authored["']/);
  assert.match(source, /production/);
  assert.match(source, /unsupported CV smoke mode|invalid CV smoke mode/i);
  assert.match(source, /mode\s*===\s*["']production["'][\s\S]*hiddenCards\s*===\s*0/);
});

test("caption QA remains an optional standalone suite rather than production deploy work", async () => {
  const source = await readFile(new URL("../tools/capture-caption-qa.mjs", import.meta.url), "utf8");
  assert.match(source, /export\s+async\s+function\s+captureCaptionQa/);
  assert.match(source, /withE2ERuntime/);
  assert.match(source, /isDirectExecution/);
});

test("production E2E is compact: production quick smoke plus media sanity in one runtime", async () => {
  assert.equal(requireScript("test:e2e:production"), "node tools/e2e/run-production.mjs");
  const source = await readFile(new URL("../tools/e2e/run-production.mjs", import.meta.url), "utf8");
  assert.match(source, /withE2ERuntime/);
  assert.match(source, /runQuickSmoke/);
  assert.match(source, /runMediaSanity/);
  assert.match(source, /cvMode:\s*["']production["']/);
  assert.doesNotMatch(source, /captureCaptionQa|runAllSmokeSuites|runSmokeNavigation|runSmokeMpa/);
});
