import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("write Desk launch is explicit and uses the guarded launcher path", () => {
  assert.equal(packageJson.scripts["desk:write"], "node tools/run-content-desk.mjs --write");
  assert.match(launcher, /--write/);
  assert.match(launcher, /content\/text-cms/);
  assert.match(launcher, /GITHUB_ACTIONS|CI/);
  assert.match(launcher, /127\.0\.0\.1|localhost/);
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
