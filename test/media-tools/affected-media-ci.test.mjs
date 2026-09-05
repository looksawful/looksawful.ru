import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { buildResponsiveVariants } from "../../tools/build-responsive-media.mjs";

const repoUrl = new URL("../../", import.meta.url);
const readRepo = (relativePath) => readFile(new URL(relativePath, repoUrl), "utf8");
const step = (workflow, name) =>
  workflow.match(new RegExp(`\\n      - name: ${name}\\b[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";

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
  assert.deepEqual(result.unrelatedPaths, []);
  assert.equal(result.requiresFullRebuild, false);
  assert.equal(result.imageOnly, true);
});

test("an image mixed with engineering work never bypasses full Fast CI", async () => {
  const { resolveAffectedMediaPaths } = await import("../../tools/media/affected-media.mjs");
  const result = resolveAffectedMediaPaths([
    "public/media/projects/index/shootings-cover.webp",
    "src/main.ts",
  ]);

  assert.deepEqual(result.imageAssetIds, ["project-index-shootings-cover"]);
  assert.deepEqual(result.unrelatedPaths, ["src/main.ts"]);
  assert.equal(result.imageOnly, false);
});

test("media infrastructure changes explicitly request the full path", async () => {
  const { resolveAffectedMediaPaths } = await import("../../tools/media/affected-media.mjs");
  const result = resolveAffectedMediaPaths(["tools/build-responsive-media.mjs"]);

  assert.equal(result.requiresFullRebuild, true);
  assert.equal(result.imageOnly, false);
});

test("partial responsive generation preserves untouched manifest entries", async () => {
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
      "an affected-only build must preserve unrelated manifest data",
    );
    assert.ok(manifest.assets.some(({ id }) => id === "asset-a"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("raster-only PRs keep required Fast CI but route expensive media work to the affected gate", async () => {
  const [fastCi, cmsMedia, affectedWorkflow] = await Promise.all([
    readRepo(".github/workflows/ci-fast.yml"),
    readRepo(".github/workflows/cms-media.yml"),
    readRepo(".github/workflows/media-affected.yml").catch((error) => {
      assert.fail(`affected media workflow must exist: ${error.message}`);
    }),
  ]);

  const prBlock = fastCi.match(/pull_request:\n([\s\S]*?)\n  workflow_dispatch:/)?.[1] ?? "";
  assert.doesNotMatch(
    prBlock,
    /paths-ignore:/,
    "Fast CI must remain a required PR check; image-only routing happens inside verify",
  );
  assert.match(fastCi, /name: Classify pull request media scope/);
  assert.match(fastCi, /affected-media\.mjs/);

  for (const name of [
    "Check repository growth",
    "Install dependencies",
    "Calculate canonical media fingerprint",
    "Restore exact generated media cache",
    "Install recovery video tooling on cache miss",
    "Recover generated media on cache miss",
    "Typecheck",
    "Fast tests",
    "Production build",
  ]) {
    assert.match(
      step(fastCi, name),
      /image_only != 'true'/,
      `${name} must stay off the image-only PR path`,
    );
  }

  assert.match(cmsMedia, /affected-media\.mjs/);
  const targetedCmsBuild = step(cmsMedia, "Build affected image derivatives only");
  assert.match(targetedCmsBuild, /image_only == 'true'/);
  assert.match(targetedCmsBuild, /args\+=\(--asset-id "\$id"\)/);
  assert.match(targetedCmsBuild, /node tools\/build-responsive-media\.mjs "\$\{args\[@\]\}"/);

  assert.match(affectedWorkflow, /affected-media\.mjs/);
  const targetedPrBuild = step(affectedWorkflow, "Build affected responsive variants only");
  assert.match(targetedPrBuild, /image_only == 'true'/);
  assert.match(targetedPrBuild, /args\+=\(--asset-id "\$id"\)/);
  assert.match(targetedPrBuild, /node tools\/build-responsive-media\.mjs "\$\{args\[@\]\}"/);
  assert.equal(
    step(affectedWorkflow, "Require registered image-only scope"),
    "",
    "mixed image+code PRs belong to full Fast CI and must not fail the affected workflow",
  );
  assert.doesNotMatch(affectedWorkflow, /ffmpeg|media:sync|media:video/i);
});
