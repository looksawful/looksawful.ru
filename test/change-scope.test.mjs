import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { classifyChangedFiles } from "../tools/ci/change-scope.mjs";

const changeScopeModuleUrl = new URL("../tools/ci/change-scope.mjs", import.meta.url).href;
const git = (cwd, args, options = {}) => execFileSync("git", args, { cwd, encoding: "utf8", ...options });

test("CV copy stays focused and never requests media transcoding", () => {
  const scope = classifyChangedFiles(["src/content/cv.json", "public/cv/index.html"]);
  assert.equal(scope.mediaChanged, false);
  assert.deepEqual(scope.suites, ["smoke", "cv"]);
});
test("navigation and standalone projects select their actual browser suites", () => {
  assert.deepEqual(classifyChangedFiles(["src/content/navigation.json"]).suites, ["smoke", "navigation"]);
  assert.deepEqual(classifyChangedFiles(["src/content/berry.json"]).suites, ["smoke", "project-pages"]);
});
test("media changes always validate real derivatives and browser media", () => {
  for (const file of ["public/media/catalog/new.webp", "src/content/projects.json", "src/data/media/assets/styx.ts", "tools/build-video-media.mjs", "package-lock.json"]) {
    const scope = classifyChangedFiles([file]);
    assert.equal(scope.mediaChanged, true, file);
    assert.ok(scope.suites.includes("media") || scope.suites.includes("full"), file);
  }
});
test("media tooling changes skip unrelated global and Media Desk browser smoke", () => {
  const scope = classifyChangedFiles([
    "docs/media-upload-policy.md",
    "test/media-tools/catalog-probe.test.mjs",
    "tools/sync-media-catalog.mjs",
  ]);

  assert.equal(scope.scope, "affected");
  assert.equal(scope.mediaChanged, true);
  assert.equal(scope.mediaDeskChanged, false);
  assert.deepEqual(scope.groups, ["ci", "media-tooling"]);
  assert.deepEqual(scope.suites, ["media"]);
});
test("rendered media data keeps global, media and Media Desk coverage", () => {
  const scope = classifyChangedFiles(["src/data/media/catalog.ts"]);
  assert.equal(scope.scope, "affected");
  assert.equal(scope.mediaChanged, true);
  assert.equal(scope.mediaDeskChanged, true);
  assert.deepEqual(scope.groups, ["media"]);
  assert.deepEqual(scope.suites, ["smoke", "media"]);
});
test("media desk changes stay focused and request the dedicated internal browser smoke", () => {
  for (const file of [
    "src/tools/media-desk/main.ts",
    "src/tools/media-desk/model.ts",
    "src/tools/media-desk/media-desk.css",
    "tools/media-desk/index.html",
    "tools/e2e/run-media-desk.mjs",
    "test/media-desk-model.test.mjs",
  ]) {
    const scope = classifyChangedFiles([file]);
    assert.equal(scope.scope, "affected", file);
    assert.equal(scope.mediaChanged, false, file);
    assert.equal(scope.mediaDeskChanged, true, file);
    assert.deepEqual(scope.groups, ["media-desk"], file);
    assert.deepEqual(scope.suites, ["smoke"], file);
  }

  const dependencyChange = classifyChangedFiles(["package.json"]);
  assert.equal(dependencyChange.scope, "full");
  assert.equal(dependencyChange.mediaDeskChanged, true);
});
test("global infrastructure and unknown paths fail closed to full regression", () => {
  for (const file of ["src/main.ts", "vite.config.ts", "src/styles/base.css", "src/components/media-lightbox.ts", "unclassified/new-module.ts"]) {
    assert.deepEqual(classifyChangedFiles([file]).suites, ["full"], file);
  }
});

test("empty diff stays cheap while explicit full mode still fails closed", () => {
  const empty = classifyChangedFiles([]);
  assert.equal(empty.scope, "affected");
  assert.equal(empty.mediaChanged, false);
  assert.equal(empty.mediaDeskChanged, false);
  assert.deepEqual(empty.groups, []);
  assert.deepEqual(empty.suites, ["smoke"]);

  const forced = classifyChangedFiles([], { full: true });
  assert.equal(forced.scope, "full");
  assert.equal(forced.mediaChanged, true);
  assert.equal(forced.mediaDeskChanged, true);
  assert.deepEqual(forced.suites, ["full"]);
});

test("docs and CV-specific styles do not select exhaustive media regression", () => {
  assert.deepEqual(classifyChangedFiles(["docs/tooling-pipeline.md"]).suites, ["smoke"]);
  assert.deepEqual(classifyChangedFiles(["public/cv/style.css"]).suites, ["smoke", "cv"]);
});
test("domain catalog migration guard stays in affected content scope", () => {
  const scope = classifyChangedFiles(["test/domain-catalog-identity.test.mjs"]);
  assert.equal(scope.scope, "affected");
  assert.equal(scope.mediaChanged, false);
  assert.deepEqual(scope.groups, ["content"]);
  assert.deepEqual(scope.suites, ["smoke", "mpa"]);
});

test("scopeFromGit retrieves an exact missing base commit in a shallow checkout", () => {
  const root = mkdtempSync(path.join(tmpdir(), "looksawful-change-scope-"));
  const remote = path.join(root, "remote.git");
  const seed = path.join(root, "seed");
  const shallow = path.join(root, "shallow");

  try {
    git(root, ["init", "--bare", remote]);
    mkdirSync(seed);
    git(seed, ["init", "-b", "main"]);
    git(seed, ["config", "user.email", "ci@example.test"]);
    git(seed, ["config", "user.name", "CI Test"]);

    mkdirSync(path.join(seed, "docs"));
    writeFileSync(path.join(seed, "docs", "base.md"), "base\n");
    git(seed, ["add", "."]);
    git(seed, ["commit", "-m", "base"]);
    const base = git(seed, ["rev-parse", "HEAD"]).trim();

    writeFileSync(path.join(seed, "docs", "head.md"), "head\n");
    git(seed, ["add", "."]);
    git(seed, ["commit", "-m", "head"]);
    const head = git(seed, ["rev-parse", "HEAD"]).trim();
    git(seed, ["remote", "add", "origin", remote]);
    git(seed, ["push", "-u", "origin", "main"]);

    git(root, ["clone", "--depth=1", "--branch", "main", `file://${remote}`, shallow]);
    assert.equal(git(shallow, ["rev-parse", "HEAD"]).trim(), head, "fixture must have a valid shallow HEAD");
    assert.throws(
      () => git(shallow, ["cat-file", "-e", `${base}^{commit}`]),
      /Command failed/,
      "fixture must prove the base commit is absent before scope calculation",
    );

    const script = `
      import { scopeFromGit } from ${JSON.stringify(changeScopeModuleUrl)};
      const scope = scopeFromGit({ base: ${JSON.stringify(base)}, head: "HEAD" });
      console.log(JSON.stringify(scope));
    `;
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: shallow,
      encoding: "utf8",
    });
    const scope = JSON.parse(output.trim().split("\n").at(-1));
    assert.deepEqual(scope.groups, ["ci"]);
    assert.deepEqual(scope.suites, ["smoke"]);
    assert.equal(scope.scope, "affected");
    assert.doesNotThrow(() => git(shallow, ["cat-file", "-e", `${base}^{commit}`]));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
