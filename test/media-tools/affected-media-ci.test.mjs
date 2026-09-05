import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { buildResponsiveVariants } from "../../tools/build-responsive-media.mjs";

const repoUrl = new URL("../../", import.meta.url);
const readRepo = (relativePath) => readFile(new URL(relativePath, repoUrl), "utf8");

test("a single changed image resolves to exactly its MediaAsset id", async () => {
  let affectedMedia;
  try {
    affectedMedia = await import("../../tools/media/affected-media.mjs");
  } catch (error) {
    assert.fail(`affected-media resolver must exist: ${error.message}`);
  }

  const result = affectedMedia.resolveAffectedMediaPaths([
    "public/media/projects/index/shootings-cover.webp",
  ]);

  assert.deepEqual(result.imageAssetIds, ["project-index-shootings-cover"]);
  assert.deepEqual(result.videoAssetIds, []);
  assert.deepEqual(result.unmatchedMediaPaths, []);
  assert.equal(result.requiresFullRebuild, false);
});

test("media infrastructure changes explicitly request the full path", async () => {
  let affectedMedia;
  try {
    affectedMedia = await import("../../tools/media/affected-media.mjs");
  } catch (error) {
    assert.fail(`affected-media resolver must exist: ${error.message}`);
  }

  const result = affectedMedia.resolveAffectedMediaPaths([
    "tools/build-responsive-media.mjs",
  ]);

  assert.equal(result.requiresFullRebuild, true);
});

test("partial responsive generation preserves untouched manifest entries byte-for-byte", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "affected-responsive-"));
  try {
    const mediaDir = path.join(root, "public/media/test");
    const manifestPath = path.join(root, "public/media/generated/responsive-manifest.json");
    const catalogPath = path.join(root, "src/data/media/responsive-generated.ts");
    await mkdir(mediaDir, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });

    await sharp({
      create: {
        width: 640,
        height: 400,
        channels: 3,
        background: { r: 12, g: 34, b: 56 },
      },
    }).png().toFile(path.join(mediaDir, "a.png"));

    const untouchedEntry = {
      id: "asset-b",
      src: "/media/test/b.png",
      sourceWidth: 800,
      sourceHeight: 600,
      sourceBytes: 123,
      sourceHash: "untouched-source-hash",
      configHash: "untouched-config-hash",
      variants: [
        {
          src: "/media/generated/responsive/media/test/b-480.webp",
          width: 480,
          height: 360,
          bytes: 456,
          format: "webp",
        },
      ],
    };
    await writeFile(
      manifestPath,
      `${JSON.stringify({
        widthPolicy: [480],
        outputFormat: "webp",
        quality: 84,
        assets: [untouchedEntry],
      }, null, 2)}\n`,
      "utf8",
    );

    await buildResponsiveVariants({
      repoRoot: root,
      mediaAssets: [
        {
          id: "asset-a",
          type: "image",
          src: "/media/test/a.png",
          width: 640,
          height: 400,
        },
      ],
      widths: [480],
      manifestPath,
      catalogPath,
      preserveUntouched: true,
    });

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.deepEqual(
      manifest.assets.find(({ id }) => id === "asset-b"),
      untouchedEntry,
      "an affected-only build must not rewrite an unrelated manifest record",
    );
    assert.ok(manifest.assets.some(({ id }) => id === "asset-a"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("media-only PRs use the affected image gate instead of Fast CI recovery", async () => {
  const [fastCi, cmsMedia, affectedWorkflow] = await Promise.all([
    readRepo(".github/workflows/ci-fast.yml"),
    readRepo(".github/workflows/cms-media.yml"),
    readRepo(".github/workflows/media-affected.yml").catch((error) => {
      assert.fail(`affected media workflow must exist: ${error.message}`);
    }),
  ]);

  assert.match(fastCi, /pull_request:\s*\n\s+branches: \[dev, prod\][\s\S]*?paths-ignore:/);
  assert.match(fastCi, /public\/media\/projects\/index\/\*\*/);
  assert.match(fastCi, /public\/media\/catalog\/\*\*/);

  assert.doesNotMatch(
    cmsMedia,
    /Require exact base cache for non-video media mutation/,
    "image-only CMS media must not require the previous whole-library cache",
  );
  assert.match(cmsMedia, /affected-media\.mjs/);
  assert.match(cmsMedia, /build-responsive-media\.mjs[^\n]*--asset-id/);

  assert.match(affectedWorkflow, /affected-media\.mjs/);
  assert.match(affectedWorkflow, /build-responsive-media\.mjs[^\n]*--asset-id/);
  assert.doesNotMatch(affectedWorkflow, /ffmpeg|media:sync|media:video/i);
});
