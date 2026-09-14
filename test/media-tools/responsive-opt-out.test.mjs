import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildResponsiveVariants } from "../../tools/build-responsive-media.mjs";

test("responsive media build skips assets explicitly opted out", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "responsive-opt-out-"));
  const source = path.join(root, "public", "lab-assets", "broken.webp");
  await mkdir(path.dirname(source), { recursive: true });
  await writeFile(source, "not a real webp");

  try {
    const result = await buildResponsiveVariants({
      repoRoot: root,
      mediaAssets: [{ id: "lab-broken", type: "image", src: "/lab-assets/broken.webp", responsive: false }],
      manifestPath: path.join(root, "responsive-manifest.json"),
      catalogPath: path.join(root, "responsive-generated.ts"),
    });
    assert.equal(result.sourceCount, 0);
    assert.deepEqual(result.manifest.assets, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
