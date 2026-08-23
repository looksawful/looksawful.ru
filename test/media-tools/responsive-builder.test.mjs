import assert from "node:assert/strict";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import sharp from "sharp";

import {
  buildResponsiveVariants,
  selectVariantWidths,
} from "../../tools/build-responsive-media.mjs";

async function fixtureRoot(name) {
  const root = join(tmpdir(), `looksawful-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(join(root, "public", "media", "fixtures"), { recursive: true });
  return root;
}

test("selectVariantWidths skips upscale and near-master variants", () => {
  assert.deepEqual(selectVariantWidths(2600, [480, 768, 1280, 1920, 2560]), [480, 768, 1280, 1920]);
  assert.deepEqual(selectVariantWidths(1000, [480, 768, 1280]), [480, 768]);
  assert.deepEqual(selectVariantWidths(520, [480, 768]), []);
});

test("responsive builder writes deterministic webp variants and skips unchanged sources", async () => {
  const root = await fixtureRoot("responsive");
  const source = join(root, "public", "media", "fixtures", "photo.png");
  await sharp({ create: { width: 1000, height: 500, channels: 3, background: "#997755" } }).png().toFile(source);

  const manifestPath = join(root, "public", "media", "generated", "responsive-manifest.json");
  const catalogPath = join(root, "src", "data", "media", "responsive-generated.ts");
  const first = await buildResponsiveVariants({
    repoRoot: root,
    mediaAssets: [{ id: "photo", type: "image", src: "/media/fixtures/photo.png", width: 1000, height: 500 }],
    widths: [480, 768, 1280],
    manifestPath,
    catalogPath,
  });

  assert.equal(first.generatedCount, 2);
  assert.equal(first.skippedCount, 0);
  assert.deepEqual(first.manifest.assets[0].variants.map((variant) => variant.width), [480, 768]);
  assert.deepEqual(first.manifest.assets[0].variants.map((variant) => variant.src), [
    "/media/generated/responsive/fixtures/photo@480.webp",
    "/media/generated/responsive/fixtures/photo@768.webp",
  ]);

  for (const variant of first.manifest.assets[0].variants) {
    const output = join(root, "public", variant.src.replace(/^\//, ""));
    const metadata = await sharp(output).metadata();
    const outputStat = await stat(output);
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, variant.width);
    assert.equal(outputStat.size, variant.bytes);
  }

  const firstManifestBytes = await readFile(manifestPath);
  const firstManifestStat = await stat(manifestPath);
  const firstCatalogBytes = await readFile(catalogPath);
  const firstCatalogStat = await stat(catalogPath);

  const second = await buildResponsiveVariants({
    repoRoot: root,
    mediaAssets: [{ id: "photo", type: "image", src: "/media/fixtures/photo.png", width: 1000, height: 500 }],
    widths: [480, 768, 1280],
    manifestPath,
    catalogPath,
  });

  assert.equal(second.generatedCount, 0);
  assert.equal(second.skippedCount, 2);
  assert.equal(second.manifestChanged, false);
  assert.equal(second.catalogChanged, false);
  assert.deepEqual(await readFile(manifestPath), firstManifestBytes);
  assert.equal((await stat(manifestPath)).mtimeMs, firstManifestStat.mtimeMs);
  assert.deepEqual(await readFile(catalogPath), firstCatalogBytes);
  assert.equal((await stat(catalogPath)).mtimeMs, firstCatalogStat.mtimeMs);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.assets.length, 1);
  assert.equal(manifest.assets[0].sourceHash, first.manifest.assets[0].sourceHash);
});
