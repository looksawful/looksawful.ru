import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const topologyScript = fileURLToPath(new URL("../tools/cms-publication-topology.mjs", import.meta.url));

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
  git(root, "branch", "source");
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
  const result = spawnSync(process.execPath, [topologyScript, "--repo", root, "--prod", "prod", "--source", "source"], {
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

test("identical prod and authoring source are a safe publication no-op", () => {
  withFixture("identical-ref", (root) => {
    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, true);
    assert.equal(payload.mode, "identical-ref");
  });
});

test("different commits with identical trees are a safe publication no-op", () => {
  withFixture("identical-tree", (root) => {
    git(root, "checkout", "-q", "source");
    git(root, "commit", "--allow-empty", "-qm", "metadata-only source commit");

    assert.notEqual(git(root, "rev-parse", "prod"), git(root, "rev-parse", "source"));
    assert.equal(git(root, "rev-parse", "prod^{tree}"), git(root, "rev-parse", "source^{tree}"));

    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, true);
    assert.equal(payload.mode, "identical-tree");
  });
});

test("temporary source descended from current prod is publishable", () => {
  withFixture("linear", (root) => {
    writeCommit(root, "source", "cms edit", "cms edit");
    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.safe, true);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "linear-descendant");
  });
});

test("authoring source becomes stale when prod advances after branch creation", () => {
  withFixture("stale-source", (root) => {
    writeCommit(root, "prod", "prod advanced", "prod advanced");

    const { result, payload } = inspect(root);
    assert.notEqual(result.status, 0);
    assert.equal(payload.safe, false);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "source-stale");
  });
});

test("diverged authoring source fails closed", () => {
  withFixture("diverged", (root) => {
    writeCommit(root, "prod", "prod version", "prod change");
    writeCommit(root, "source", "source version", "source change");

    const { result, payload } = inspect(root);
    assert.notEqual(result.status, 0);
    assert.equal(payload.safe, false);
    assert.equal(payload.nothingToPublish, false);
    assert.equal(payload.mode, "source-diverged");
  });
});

test("Pages CMS publication delegates prod/source topology before scope authorization", () => {
  const workflow = readFileSync(new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url), "utf8");
  assert.match(workflow, /node tools\/cms-publication-topology\.mjs/);
  assert.match(workflow, /--prod origin\/prod/);
  assert.match(workflow, /--source origin\/cms-source/);
  assert.doesNotMatch(workflow, /origin\/dev|--dev\b/);
  assert.match(workflow, /steps\.topology\.outputs\.nothing_to_publish != 'true'/);
  assert.match(workflow, /node tools\/cms-publication-scope\.mjs/);
});
