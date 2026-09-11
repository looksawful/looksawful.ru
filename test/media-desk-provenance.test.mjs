import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const launcher = await readFile(
  new URL("../tools/run-content-desk.mjs", import.meta.url),
  "utf8",
);
const editorEntry = await readFile(
  new URL("../src/devtools/media-desk/editor-entry.ts", import.meta.url),
  "utf8",
);

test("ordinary Desk startup preserves tracked working-tree state", () => {
  const status = () => execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const before = status();

  execFileSync(process.execPath, ["tools/run-content-desk.mjs", "--help"], {
    cwd: repoRoot,
    env: { ...process.env, BROWSER: "none" },
    stdio: "pipe",
  });

  assert.equal(status(), before);
});

test("Desk operator UI exposes read/write mode and prod-based checkout provenance", async () => {
  assert.match(editorEntry, /mode-status\.ts/);
  assert.match(launcher, /VITE_CONTENT_DESK_MODE/);
  assert.match(launcher, /VITE_CONTENT_DESK_BRANCH/);
  assert.match(launcher, /VITE_CONTENT_DESK_HEAD/);
  assert.match(launcher, /VITE_CONTENT_DESK_PROD_BASE/);
  assert.match(launcher, /VITE_CONTENT_DESK_PROD_DIVERGENCE/);

  const modeStatus = await readFile(
    new URL("../src/devtools/media-desk/mode-status.ts", import.meta.url),
    "utf8",
  );
  assert.match(modeStatus, /READ ONLY/);
  assert.match(modeStatus, /WRITE/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_BRANCH/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_HEAD/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_PROD_BASE/);
  assert.match(modeStatus, /VITE_CONTENT_DESK_PROD_DIVERGENCE/);
});
