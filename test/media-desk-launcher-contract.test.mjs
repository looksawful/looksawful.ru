import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const launcher = await readFile(
  new URL("../tools/run-content-desk.mjs", import.meta.url),
  "utf8",
);

test("default Media Desk launch is read-only, side-effect-free and loopback-only", () => {
  const deskScript = packageJson.scripts?.desk;

  assert.equal(
    deskScript,
    "node tools/run-content-desk.mjs",
    "npm run desk must not run mutable media synchronization before opening the UI",
  );
  assert.doesNotMatch(
    launcher,
    /CONTENT_DESK_WRITE|VITE_CONTENT_DESK_WRITE/,
    "default launcher must not enable Media Desk mutation endpoints or write UI",
  );
  assert.match(
    launcher,
    /["']--host["']\s*,\s*["']127\.0\.0\.1["']/,
    "default launcher must bind Vite explicitly to loopback",
  );
});
