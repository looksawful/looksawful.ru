import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { computeMediaFingerprint } from "../../tools/media-dev-state.mjs";

const CONFIG_FILES = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/sync-media-catalog.mjs",
  "src/data/media/responsive-policy.ts",
  "src/data/media/assets/index.ts",
  "src/data/media/assets/registered.ts",
  "src/data/media/catalog.ts",
  "src/data/media/catalog-records.generated.ts",
  "package-lock.json",
];

async function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
  return filePath;
}

test("sync-media-catalog bytes invalidate the default canonical media fingerprint", async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "media-fingerprint-sync-"));
  try {
    await write(repoRoot, "public/media/source/image.jpg", "image-source");
    for (const configPath of CONFIG_FILES) {
      await write(repoRoot, configPath, `fixture:${configPath}\n`);
    }

    const assets = [{ id: "image", type: "image", src: "/media/source/image.jpg" }];
    const toolPath = path.join(repoRoot, "tools/sync-media-catalog.mjs");
    const beforeStat = await stat(toolPath);
    const beforeContents = await readFile(toolPath, "utf8");
    const beforeFingerprint = await computeMediaFingerprint({ repoRoot, assets });

    const first = beforeContents[0];
    const replacement = first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase();
    await writeFile(toolPath, `${replacement}${beforeContents.slice(1)}`, "utf8");
    await utimes(toolPath, beforeStat.atime, beforeStat.mtime);

    const afterFingerprint = await computeMediaFingerprint({ repoRoot, assets });
    assert.notEqual(afterFingerprint, beforeFingerprint);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
