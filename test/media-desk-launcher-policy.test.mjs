import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const launcher = await readFile(
  new URL("../tools/run-content-desk.mjs", import.meta.url),
  "utf8",
);
const editorEntry = await readFile(
  new URL("../src/devtools/media-desk/editor-entry.ts", import.meta.url),
  "utf8",
);

test("ordinary Desk launch is read-only and has no mutable media startup", () => {
  assert.equal(packageJson.scripts.desk, "node tools/run-content-desk.mjs");
  assert.doesNotMatch(packageJson.scripts.desk, /media:ensure|media:sync|media:catalog:sync/);
  assert.doesNotMatch(launcher, /CONTENT_DESK_WRITE:\s*["']1["']/);
  assert.doesNotMatch(launcher, /VITE_CONTENT_DESK_WRITE:\s*["']1["']/);
});

test("ordinary Desk startup does not change tracked repository state", () => {
  const gitStatus = () => execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const before = gitStatus();

  execFileSync(process.execPath, ["tools/run-content-desk.mjs", "--help"], {
    cwd: repoRoot,
    env: { ...process.env, BROWSER: "none" },
    stdio: "pipe",
  });

  assert.equal(gitStatus(), before);
});

test("write Desk launch is explicit and uses the guarded launcher path", () => {
  assert.equal(packageJson.scripts["desk:write"], "node tools/run-content-desk.mjs --write");
  assert.match(launcher, /--write/);
  assert.match(launcher, /content-desk-policy\.mjs/);
});

test("Desk write policy fails closed outside the authorized local authoring checkout", async () => {
  assert.match(launcher, /content-desk-policy\.mjs/);
  const {
    assertContentDeskWriteAllowed,
    CONTENT_DESK_LOOPBACK_HOST,
  } = await import("../tools/content-desk-policy.mjs");

  assert.equal(CONTENT_DESK_LOOPBACK_HOST, "127.0.0.1");

  for (const branch of ["dev", "prod", "feature/test", "fix/test"]) {
    assert.throws(
      () => assertContentDeskWriteAllowed({ branch, ci: false, githubActions: false, args: [] }),
      /content\/text-cms/i,
      `must reject ${branch}`,
    );
  }

  assert.throws(
    () => assertContentDeskWriteAllowed({
      branch: "content/text-cms",
      ci: true,
      githubActions: false,
      args: [],
    }),
    /CI\/GitHub Actions/i,
  );
  assert.throws(
    () => assertContentDeskWriteAllowed({
      branch: "content/text-cms",
      ci: false,
      githubActions: true,
      args: [],
    }),
    /CI\/GitHub Actions/i,
  );
  for (const args of [["--host"], ["--host=0.0.0.0"], ["--host=localhost"]]) {
    assert.throws(
      () => assertContentDeskWriteAllowed({
        branch: "content/text-cms",
        ci: false,
        githubActions: false,
        args,
      }),
      /host/i,
    );
  }
  assert.doesNotThrow(() => assertContentDeskWriteAllowed({
    branch: "content/text-cms",
    ci: false,
    githubActions: false,
    args: [],
  }));
});

test("Desk exposes mode and checkout provenance in the operator UI", async () => {
  assert.match(editorEntry, /mode-status\.ts/);
  const modeStatus = await readFile(
    new URL("../src/devtools/media-desk/mode-status.ts", import.meta.url),
    "utf8",
  );
  assert.match(modeStatus, /VITE_CONTENT_DESK_MODE/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_BRANCH/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_HEAD/);
  assert.match(modeStatus, /READ ONLY|WRITE/);
});
