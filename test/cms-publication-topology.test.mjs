import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const topologyScript = fileURLToPath(new URL("../tools/cms-publication-topology.mjs", import.meta.url));
const authoringScript = fileURLToPath(new URL("../tools/cms-authoring-topology.mjs", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `cms-topology-${name}-`));
  git(root, "init", "-q");
  git(root, "config", "user.name", "Topology Test");
  git(root, "config", "user.email", "topology@example.test");
  writeFileSync(join(root, "content.txt"), "base\n");
  mkdirSync(join(root, "src", "content"), { recursive: true });
  writeFileSync(join(root, "src", "content", "navigation.json"), "{}\n");
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
  const result = spawnSync(process.execPath, [topologyScript, "--repo", root, "--prod", "prod", "--dev", "dev"], {
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

function inspectAuthoring(root, ...extraArgs) {
  assert.ok(existsSync(authoringScript), "cms authoring topology helper must exist");
  const result = spawnSync(
    process.execPath,
    [authoringScript, "--repo", root, "--dev", "dev", ...extraArgs],
    { encoding: "utf8" },
  );
  let payload = null;
  try {
    payload = JSON.parse(result.stdout || "null");
  } catch {
    assert.fail(`authoring helper must print JSON; stdout=${result.stdout}; stderr=${result.stderr}`);
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
    writeFileSync(join(root, "prod-only.txt"), "production hotfix\n");
    git(root, "add", "prod-only.txt");
    git(root, "commit", "-qm", "prod hotfix");
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

test("fresh content authoring branch reports integration-ready CMS-only state", () => {
  withFixture("authoring-ready", (root) => {
    git(root, "checkout", "-qb", "content/copy", "dev");
    writeFileSync(join(root, "src", "content", "navigation.json"), '{"label":"updated"}\n');
    git(root, "add", "src/content/navigation.json");
    git(root, "commit", "-qm", "content edit");

    const { result, payload } = inspectAuthoring(root, "--require-integration-ready");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.branch, "content/copy");
    assert.equal(payload.allowedAuthoringBranch, true);
    assert.equal(payload.stale, false);
    assert.equal(payload.dirty, false);
    assert.equal(payload.scope.safe, true);
    assert.equal(payload.integrationReady, true);
  });
});

test("prod and dev are never accepted as CMS authoring branches", () => {
  withFixture("authoring-forbidden", (root) => {
    for (const branch of ["prod", "dev"]) {
      git(root, "checkout", "-q", branch);
      const { result, payload } = inspectAuthoring(root, "--require-integration-ready");
      assert.notEqual(result.status, 0);
      assert.equal(payload.branch, branch);
      assert.equal(payload.allowedAuthoringBranch, false);
      assert.equal(payload.integrationReady, false);
    }
  });
});

test("authoring status detects when dev advanced after the branch base", () => {
  withFixture("authoring-stale", (root) => {
    git(root, "checkout", "-qb", "content/copy", "dev");
    writeFileSync(join(root, "src", "content", "navigation.json"), '{"label":"branch"}\n');
    git(root, "add", "src/content/navigation.json");
    git(root, "commit", "-qm", "content edit");

    git(root, "checkout", "-q", "dev");
    writeFileSync(join(root, "content.txt"), "dev advanced\n");
    git(root, "add", "content.txt");
    git(root, "commit", "-qm", "advance dev");
    git(root, "checkout", "-q", "content/copy");

    const { result, payload } = inspectAuthoring(root, "--require-integration-ready");
    assert.notEqual(result.status, 0);
    assert.equal(payload.stale, true);
    assert.equal(payload.integrationReady, false);
    assert.notEqual(payload.baseSha, payload.devSha);
  });
});

test("authoring integration classification rejects engineering paths", () => {
  withFixture("authoring-engineering", (root) => {
    git(root, "checkout", "-qb", "content/copy", "dev");
    mkdirSync(join(root, "tools"), { recursive: true });
    writeFileSync(join(root, "tools", "unexpected.mjs"), "export {};\n");
    git(root, "add", "tools/unexpected.mjs");
    git(root, "commit", "-qm", "engineering edit");

    const { result, payload } = inspectAuthoring(root, "--require-integration-ready");
    assert.notEqual(result.status, 0);
    assert.equal(payload.scope.safe, false);
    assert.deepEqual(payload.scope.blocked, [
      { path: "tools/unexpected.mjs", classification: "ENGINEERING" },
    ]);
    assert.equal(payload.integrationReady, false);
  });
});

test("authoring status reports dirty worktree without hiding it", () => {
  withFixture("authoring-dirty", (root) => {
    git(root, "checkout", "-qb", "content/copy", "dev");
    writeFileSync(join(root, "src", "content", "navigation.json"), '{"label":"unsaved"}\n');

    const { result, payload } = inspectAuthoring(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.dirty, true);
    assert.equal(payload.integrationReady, false);
  });
});
