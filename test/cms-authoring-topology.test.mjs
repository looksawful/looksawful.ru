import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const topologyScript = fileURLToPath(new URL("../tools/cms-authoring-topology.mjs", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `cms-authoring-${name}-`));
  git(root, "init", "-q");
  git(root, "config", "user.name", "Authoring Topology Test");
  git(root, "config", "user.email", "authoring-topology@example.test");
  writeFileSync(join(root, "seed.txt"), "base\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "base");
  git(root, "branch", "dev");
  git(root, "branch", "prod");
  git(root, "branch", "content/text-cms");
  return root;
}

function commit(root, branch, file, value) {
  git(root, "checkout", "-q", branch);
  writeFileSync(join(root, file), `${value}\n`);
  git(root, "add", file);
  git(root, "commit", "-qm", `${branch}: ${value}`);
}

function inspect(root, { ready = false, files = [], ci = false } = {}) {
  const args = [topologyScript, "--repo", root, "--dev", "dev"];
  if (ready) args.push("--ready");
  if (files.length) args.push("--files-json", JSON.stringify(files));
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: { ...process.env, CI: ci ? "true" : "0" },
  });
  let payload = null;
  try {
    payload = JSON.parse(result.stdout || "null");
  } catch {
    assert.fail(`authoring topology helper must print JSON; stdout=${result.stdout}; stderr=${result.stderr}`);
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

test("permanent content/text-cms checkout is recognized and provenance points to dev", () => {
  withFixture("allowed", (root) => {
    git(root, "checkout", "-q", "content/text-cms");
    const { result, payload } = inspect(root);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.authoringAllowed, true);
    assert.equal(payload.branch, "content/text-cms");
    assert.equal(payload.intendedIntegrationTarget, "dev");
    assert.match(payload.headSha, /^[0-9a-f]{40}$/);
    assert.match(payload.devSha, /^[0-9a-f]{40}$/);
    assert.equal(payload.dirty, false);
    assert.equal(payload.ahead, 0);
    assert.equal(payload.behind, 0);
    assert.equal(payload.diverged, false);
    assert.equal(payload.ready, false);
    assert.equal(payload.integrationAllowed, false);
    assert.equal(payload.integrationReason, "ready-required");
  });
});

test("CI never recognizes an editorial checkout as write-authorized", () => {
  withFixture("ci-blocked", (root) => {
    git(root, "checkout", "-q", "content/text-cms");
    const { result, payload } = inspect(root, { ci: true });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.branch, "content/text-cms");
    assert.equal(payload.authoringAllowed, false);
    assert.equal(payload.integrationAllowed, false);
    assert.equal(payload.integrationReason, "authoring-checkout-required");
  });
});

test("dev and prod checkouts are never recognized as editorial authoring checkouts", () => {
  withFixture("blocked-branches", (root) => {
    for (const branch of ["dev", "prod"]) {
      git(root, "checkout", "-q", branch);
      const { result, payload } = inspect(root);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(payload.authoringAllowed, false, branch);
      assert.equal(payload.branch, branch);
      assert.equal(payload.integrationAllowed, false, branch);
      assert.equal(payload.integrationReason, "authoring-checkout-required", branch);
    }
  });
});

test("divergence from fresh dev is reported without modifying either history", () => {
  withFixture("diverged", (root) => {
    commit(root, "dev", "dev.txt", "engineering moved");
    const devBefore = git(root, "rev-parse", "dev");
    commit(root, "content/text-cms", "content.txt", "editorial moved");
    const authoringBefore = git(root, "rev-parse", "content/text-cms");

    const { result, payload } = inspect(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.authoringAllowed, true);
    assert.equal(payload.ahead, 1);
    assert.equal(payload.behind, 1);
    assert.equal(payload.diverged, true);
    assert.equal(git(root, "rev-parse", "dev"), devBefore);
    assert.equal(git(root, "rev-parse", "content/text-cms"), authoringBefore);
  });
});

test("READY plus CMS-only diff permits an integration candidate, but engineering hitchhikers fail closed", () => {
  withFixture("ready-scope", (root) => {
    git(root, "checkout", "-q", "content/text-cms");

    const allowed = inspect(root, {
      ready: true,
      files: [
        "src/content/cases/styx.json",
        "src/content/media-catalog/uploads/example.json",
        "public/media/catalog/example.webp",
      ],
    });
    assert.equal(allowed.result.status, 0, allowed.result.stderr);
    assert.equal(allowed.payload.ready, true);
    assert.equal(allowed.payload.scope.safe, true);
    assert.equal(allowed.payload.integrationAllowed, true);
    assert.equal(allowed.payload.integrationReason, "ready-and-cms-only");

    const blocked = inspect(root, {
      ready: true,
      files: ["src/content/cases/styx.json", "src/components/site-nav.ts"],
    });
    assert.equal(blocked.result.status, 0, blocked.result.stderr);
    assert.equal(blocked.payload.scope.safe, false);
    assert.equal(blocked.payload.integrationAllowed, false);
    assert.equal(blocked.payload.integrationReason, "scope-blocked");
    assert.deepEqual(blocked.payload.scope.blocked, [
      { path: "src/components/site-nav.ts", classification: "ENGINEERING" },
    ]);
  });
});

test("dirty authoring checkout remains visible to the operator and cannot become an integration candidate", () => {
  withFixture("dirty", (root) => {
    git(root, "checkout", "-q", "content/text-cms");
    writeFileSync(join(root, "uncommitted.txt"), "draft\n");

    const { result, payload } = inspect(root, {
      ready: true,
      files: ["src/content/cases/styx.json"],
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(payload.dirty, true);
    assert.equal(payload.integrationAllowed, false);
    assert.equal(payload.integrationReason, "dirty-checkout");
  });
});
