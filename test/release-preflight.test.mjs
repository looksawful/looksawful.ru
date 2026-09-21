import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const preflightPath = path.join(repoRoot, "tools/release/preflight.mjs");
const tempBase = process.env.LOOKSAWFUL_TEST_TMPDIR || tmpdir();

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function createRepo() {
  mkdirSync(tempBase, { recursive: true });
  const cwd = mkdtempSync(path.join(tempBase, "looksawful-release-preflight-"));
  git(cwd, "init", "-q");
  git(cwd, "config", "user.email", "release-preflight@example.invalid");
  git(cwd, "config", "user.name", "Release Preflight Test");
  mkdirSync(path.join(cwd, "src"), { recursive: true });
  writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 1;\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "base");
  return cwd;
}
test("release preflight rejects Lab-only files from a production candidate", () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    mkdirSync(path.join(cwd, "src/lab"), { recursive: true });
    writeFileSync(path.join(cwd, "src/lab/compact.stories.js"), "export default {};\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "candidate");
    const candidate = git(cwd, "rev-parse", "HEAD");

    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", base,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", candidate,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /LAB_ONLY_PATH/);
    assert.match(`${result.stdout}\n${result.stderr}`, /src\/lab\/compact\.stories\.js/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("release preflight reports approved product files missing from candidate", () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    git(cwd, "switch", "-qc", "approved");
    mkdirSync(path.join(cwd, "src/styles"), { recursive: true });
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    writeFileSync(path.join(cwd, "src/styles/project-shell.css"), ".cta { inline-size: 100%; }\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "approved dev implementation");
    const approved = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-q", "--detach", base);
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "incomplete prod backport");
    const candidate = git(cwd, "rev-parse", "HEAD");
    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", base,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /MISSING_APPROVED_FILE/);
    assert.match(`${result.stdout}\n${result.stderr}`, /src\/styles\/project-shell\.css/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("release preflight rejects candidate files outside the derived allowlist", () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    git(cwd, "switch", "-qc", "approved");
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "approved dev implementation");
    const approved = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-q", "--detach", base);
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    writeFileSync(path.join(cwd, "notes.txt"), "unrelated release hitchhiker\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "candidate with unrelated file");
    const candidate = git(cwd, "rev-parse", "HEAD");
    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", base,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /UNAPPROVED_CANDIDATE_FILE/);
    assert.match(`${result.stdout}\n${result.stderr}`, /notes\.txt/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("release preflight accepts an explicitly declared extra product file", () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, "rev-parse", "HEAD");
    git(cwd, "switch", "-qc", "approved");
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "approved dev implementation");
    const approved = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-q", "--detach", base);
    writeFileSync(path.join(cwd, "src/index.ts"), "export const value = 2;\n");
    writeFileSync(path.join(cwd, "notes.txt"), "approved release note\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "candidate with declared extra");
    const candidate = git(cwd, "rev-parse", "HEAD");
    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", base,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
      "--allow", "notes.txt",
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /RELEASE_PREFLIGHT_OK/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("release preflight rejects a touched file that drops clean prod-only changes", () => {
  const cwd = createRepo();
  try {
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 1;",
      "export const stable = true;",
      "",
    ].join("\n"));
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "shared ancestor");
    const base = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-qc", "approved");
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 2;",
      "export const stable = true;",
      "",
    ].join("\n"));
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "approved dev implementation");
    const approved = git(cwd, "rev-parse", "HEAD");
    git(cwd, "switch", "-qc", "prod", base);
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 1;",
      "export const stable = true;",
      "export const prodOnly = true;",
      "",
    ].join("\n"));
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "independent prod change");
    const prod = git(cwd, "rev-parse", "HEAD");

    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 2;",
      "export const stable = true;",
      "",
    ].join("\n"));
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "candidate drops prod-only line");
    const candidate = git(cwd, "rev-parse", "HEAD");

    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", prod,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
    ], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /PROD_ONLY_CHANGE_DROPPED/);
    assert.match(`${result.stdout}\n${result.stderr}`, /src\/index\.ts/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("release preflight rejects a Lab-only file renamed into a product path", () => {
  const cwd = createRepo();
  try {
    mkdirSync(path.join(cwd, "src/lab"), { recursive: true });
    writeFileSync(path.join(cwd, "src/lab/story.js"), "export const story = true;\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "lab story base");
    const base = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-qc", "approved");
    git(cwd, "mv", "src/lab/story.js", "src/story.js");
    git(cwd, "commit", "-qm", "rename lab story into product path");
    const approved = git(cwd, "rev-parse", "HEAD");
    const candidate = approved;

    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", base,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /LAB_ONLY_PATH/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});


test("release preflight ignores unrelated merge conflicts outside approved product files", () => {
  const cwd = createRepo();
  try {
    mkdirSync(path.join(cwd, "docs"), { recursive: true });
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 1;",
      "export const prodOnly = false;",
      "",
    ].join("\n"));
    writeFileSync(path.join(cwd, "docs/context.md"), "shared\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "shared ancestor");
    const base = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-qc", "approved");
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 2;",
      "export const prodOnly = false;",
      "",
    ].join("\n"));
    writeFileSync(path.join(cwd, "docs/context.md"), "approved docs\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "approved product plus unrelated docs");
    const approved = git(cwd, "rev-parse", "HEAD");

    git(cwd, "switch", "-qc", "prod", base);
    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 1;",
      "export const prodOnly = true;",
      "",
    ].join("\n"));
    writeFileSync(path.join(cwd, "docs/context.md"), "prod docs\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "prod product plus conflicting docs");
    const prod = git(cwd, "rev-parse", "HEAD");

    writeFileSync(path.join(cwd, "src/index.ts"), [
      "export const value = 2;",
      "export const prodOnly = true;",
      "",
    ].join("\n"));
    git(cwd, "add", "src/index.ts");
    git(cwd, "commit", "-qm", "candidate preserves prod-only product change");
    const candidate = git(cwd, "rev-parse", "HEAD");

    const result = spawnSync(process.execPath, [
      preflightPath,
      "--repo", cwd,
      "--prod-base", prod,
      "--candidate", candidate,
      "--approved-base", base,
      "--approved-head", approved,
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /RELEASE_PREFLIGHT_OK/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
