import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("inventory CLI runs main and writes artifacts on the host platform", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-inventory-cli-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const script = path.resolve("tools/lab/design-system-inventory.mjs");
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[lab-inventory\]/);
  await access(path.join(root, "dist-lab", "lab", "system-inventory.json"));
});
