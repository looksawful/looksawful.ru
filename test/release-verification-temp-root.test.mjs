import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const runner = path.join(repoRoot, "tools/release/run-verification.mjs");

test("release verification routes child temp files through explicit temp root", () => {
  const root = mkdtempSync(path.join(tmpdir(), "release-temp-root-"));
  const explicitTemp = path.join(root, "roomy-temp");
  try {
    const result = spawnSync(process.execPath, [
      runner,
      "--temp-root", explicitTemp,
      "--",
      process.execPath,
      "-e",
      "console.log(require('node:os').tmpdir())",
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(path.resolve(result.stdout.trim()), path.resolve(explicitTemp));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
