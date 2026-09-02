import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const repoRoot = new URL("../", import.meta.url);
const topologyScript = new URL("../tools/cms-publication-topology.mjs", import.meta.url);

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `cms-topology-${name}-`));
  git(root, "init", "-q");
  git(root, "config", "user.name", "Topology Test");
  git(root, "config", "user.email", "topology@example.test");
  writeFileSync(join(root, "content.txt"), "base\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "base");
  git(root, "branch", "prod");
  git(root, "branch", "dev");
  return root;
}

function writeCommit(root, branch, value, message) {
  git(root, "checkout", "-q", branch);
  writeFileSync(join(root, "content.txt"), `${value}\n`);
  git(root, "add", "content.txt");
  git(root, "commit", "-qm", message);
}

function inspect(root) {
  assert.ok(existsSync(topologyScript), "cms publication topology helper must exist");
  const result = spawnSync(process.execPath, [topologyScript.pathname, "--repo", root, "--prod", "prod", "--dev", "dev"], {
    encoding: "utf8",
  });
  let payload = null;
  try {
    payload = JSON.parse(result.stdout || "null");
  } catch {
    assert.fail(`topology helper must print JSON; stdout=${result.stdout}; stderr=${result.stderr}`);
  }
  return { result, payload };
}

function withFixture(name, fn) {
  const root = fixture(name);
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("identical refs are a safe publication no-op", () => {
  withFixture("identical-ref", (root) => {
    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, true);
    assert.equal(payload.mode, "identical-ref");
  });
});

test("normal dev-to-prod merge commit with the same tree is a safe publication no-op", () => {
  withFixture("release-tree", (root) => {
    writeCommit(root, "dev", "release", "dev release");
    git(root, "checkout", "-q", "prod");
    git(root, "merge", "--no-ff", "-qm", "release dev", "dev");

    assert.notEqual(git(root, "rev-parse", "prod"), git(root, "rev-parse", "dev"));
    assert.equal(git(root, "rev-parse", "prod^{tree}"), git(root, "rev-parse", "dev^{tree}"));

    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, true);
    assert.equal(payload.mode, "identical-tree");
  });
});

test("linear dev changes after prod remain publishable", () => {
  withFixture("linear", (root) => {
    writeCommit(root, "dev", "cms edit", "cms edit");
    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "linear-descendant");
  });
});

test("dev may advance after a normal release merge when merging prod back would not change dev content", () => {
  withFixture("aligned-divergence", (root) => {
    writeCommit(root, "dev", "release", "release content");
    git(root, "checkout", "-q", "prod");
    git(root, "merge", "--no-ff", "-qm", "release dev", "dev");
    writeCommit(root, "dev", "cms edit after release", "cms edit");

    const ancestor = spawnSync("git", ["-C", root, "merge-base", "--is-ancestor", "prod", "dev"]);
    assert.equal(ancestor.status, 1, "fixture must reproduce non-linear release history");

    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "history-diverged-content-aligned");
  });
});

test("production-only content blocks CMS publication even when histories otherwise look like a normal release", () => {
  withFixture("prod-hotfix", (root) => {
    writeCommit(root, "dev", "release", "release content");
    git(root, "checkout", "-q", "prod");
    git(root, "merge", "--no-ff", "-qm", "release dev", "dev");
    writeCommit(root, "prod", "production hotfix", "prod hotfix");
    writeCommit(root, "dev", "cms edit after release", "cms edit");

    const { result, payload } = inspect(root);
    assert.notEqual(result.status, 0);
    assert.equal(payload.safe, false);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "prod-content-not-in-dev");
  });
});

test("conflicting prod and dev content blocks CMS publication", () => {
  withFixture("conflict", (root) => {
    writeCommit(root, "prod", "prod version", "prod change");
    writeCommit(root, "dev", "dev version", "dev change");

    const { result, payload } = inspect(root);
    assert.notEqual(result.status, 0);
    assert.equal(payload.safe, false);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "diverged-conflict");
  });
});

test("Pages CMS publication delegates topology decisions to the content-aware guard", () => {
  const workflow = readFileSync(new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url), "utf8");
  assert.match(workflow, /node tools\/cms-publication-topology\.mjs/);
  assert.doesNotMatch(workflow, /merge-base --is-ancestor origin\/prod origin\/dev/);
  assert.match(workflow, /steps\.topology\.outputs\.nothing_to_publish != 'true'/);
  assert.match(workflow, /node tools\/cms-publication-scope\.mjs/);
});
