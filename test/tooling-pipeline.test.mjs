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
