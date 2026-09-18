import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { logo3dCatalog } from "../src/lab/data/logo-3d-catalog.mjs";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const manifestUrl = new URL("../tools/logo-3d/logo-3d-manifest.json", import.meta.url);

async function loadManifest() {
  return JSON.parse(await readFile(manifestUrl, "utf8"));
}

test("manifest covers every catalog target exactly once", async () => {
  const manifest = await loadManifest();
  const ids = manifest.targets.map((target) => target.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate manifest ids");
  assert.deepEqual(new Set(ids), new Set(logo3dCatalog.map((entry) => entry.id)));
});

test("all vector-backed manifest sources exist", async () => {
  const manifest = await loadManifest();
  for (const target of manifest.targets.filter((item) => item.sourceType === "vector-svg")) {
    assert.ok(target.source, `${target.id} missing source path`);
    await access(path.join(repoRoot, target.source));
  }
});