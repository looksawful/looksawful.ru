import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import sharp from "sharp";

import { createMediaIntegrityReport } from "../../tools/check-data-integrity.ts";

async function fixtureRoot(name) {
  const root = join(tmpdir(), `looksawful-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(join(root, "public", "media", "fixtures"), { recursive: true });
  return root;
}

test("integrity report catches missing files, wrong dimensions, duplicate ids, wrong formats, and stale variants", async () => {
  const root = await fixtureRoot("integrity");
  const validImage = join(root, "public", "media", "fixtures", "valid.webp");
  const wrongExtension = join(root, "public", "media", "fixtures", "png-as-jpg.jpg");
  const videoDelivery = join(root, "public", "media", "fixtures", "video.mp4");
  await sharp({ create: { width: 10, height: 6, channels: 3, background: "red" } }).webp().toFile(validImage);
  await sharp({ create: { width: 4, height: 4, channels: 3, background: "blue" } }).png().toFile(wrongExtension);
  await writeFile(videoDelivery, Buffer.concat([Buffer.alloc(4), Buffer.from("ftypisom0000isom")]));
  await mkdir(join(root, "public", "media", "generated"), { recursive: true });
  await writeFile(
    join(root, "public", "media", "generated", "responsive-manifest.json"),
    JSON.stringify({
      generatedAt: "fixture",
      widthPolicy: [480],
      assets: [
        {
          id: "stale-variant",
          src: "/media/fixtures/valid.webp",
          sourceHash: "fixture",
          sourceBytes: 1,
          variants: [{ src: "/media/generated/fixtures/valid@480.webp", width: 480, height: 288, bytes: 1 }],
        },
      ],
    }),
    "utf8",
  );

  const report = await createMediaIntegrityReport({
    repoRoot: root,
    mediaAssets: [
      { id: "wrong-dimensions", type: "image", src: "/media/fixtures/valid.webp", width: 11, height: 6 },
      { id: "wrong-format", type: "image", src: "/media/fixtures/png-as-jpg.jpg", width: 4, height: 4 },
      { id: "missing-source", type: "image", src: "/media/fixtures/missing.webp", width: 1, height: 1 },
      { id: "missing-source", type: "image", src: "/media/fixtures/valid.webp", width: 10, height: 6 },
      {
        id: "video-with-missing-poster",
        type: "video",
        src: "/media/fixtures/video.mp4",
        sourceSrc: "/media/fixtures/source-master.mov",
      },
    ],
    mediaEntries: [
      {
        id: "video-use",
        assetId: "video-with-missing-poster",
        posterAssetId: "missing-poster",
      },
      {
        id: "unknown-asset-use",
        assetId: "unknown-asset",
      },
    ],
    generatedManifestPath: join(root, "public", "media", "generated", "responsive-manifest.json"),
    scanPhysicalMedia: false,
  });

  assert.equal(report.errorCount > 0, true);
  assert.match(report.errors.join("\n"), /duplicate id "missing-source"/);
  assert.match(report.errors.join("\n"), /missing-source.*delivery file does not exist/);
  assert.match(report.errors.join("\n"), /wrong-dimensions.*width 11 != 10/);
  assert.match(report.errors.join("\n"), /wrong-format.*extension jpg does not match actual png/);
  assert.match(report.errors.join("\n"), /video-with-missing-poster\)\.sourceSrc: source master does not exist/);
  assert.match(report.errors.join("\n"), /MediaEntry\(video-use\)\.posterAssetId: unknown MediaAsset "missing-poster"/);
  assert.match(report.errors.join("\n"), /MediaEntry\(unknown-asset-use\)\.assetId: unknown MediaAsset "unknown-asset"/);
  assert.match(report.errors.join("\n"), /stale generated variant.*valid@480\.webp/);
});

test("integrity report rejects unknown canonical Client relations without rejecting presentation-only logos", async () => {
  const root = await fixtureRoot("integrity-client-logo");
  const report = await createMediaIntegrityReport({
    repoRoot: root,
    mediaAssets: [],
    mediaEntries: [],
    clientLogos: [
      {
        id: "linked-logo",
        clientId: "unknown-client",
        name: "Linked logo",
        file: "01",
      },
      {
        id: "presentation-only-logo",
        name: "Presentation-only logo",
        file: "02",
      },
    ],
    scanPhysicalMedia: false,
  });

  assert.match(
    report.errors.join("\n"),
    /ClientLogo\(linked-logo\)\.clientId: unknown Client "unknown-client"/,
  );
  assert.doesNotMatch(report.errors.join("\n"), /ClientLogo\(presentation-only-logo\)\.clientId/);
});

test("integrity report supports registered GLB model assets", async () => {
  const root = await fixtureRoot("integrity-model");
  const model = join(root, "public", "media", "fixtures", "organism.glb");
  await writeFile(
    model,
    Buffer.concat([
      Buffer.from("glTF"),
      Buffer.from([2, 0, 0, 0]),
      Buffer.from([12, 0, 0, 0]),
    ]),
  );

  const report = await createMediaIntegrityReport({
    repoRoot: root,
    mediaAssets: [
      {
        id: "theme-organism",
        type: "model",
        src: "/media/fixtures/organism.glb",
        mimeType: "model/gltf-binary",
        byteLength: 12,
      },
    ],
    mediaEntries: [{ id: "theme-organism-use", assetId: "theme-organism" }],
    scanPhysicalMedia: false,
  });

  assert.equal(report.errorCount, 0);
  assert.equal(report.summary.models, 1);
});

test("integrity report never lets legacy root media shadow the public delivery file", async () => {
  const root = await fixtureRoot("integrity-public-ownership");
  const publicImage = join(root, "public", "media", "fixtures", "shadow.webp");
  const legacyDir = join(root, "media", "fixtures");
  const legacyImage = join(legacyDir, "shadow.webp");
  await mkdir(legacyDir, { recursive: true });
  await sharp({ create: { width: 10, height: 6, channels: 3, background: "green" } }).webp().toFile(publicImage);
  await sharp({ create: { width: 3, height: 3, channels: 3, background: "red" } }).webp().toFile(legacyImage);

  const report = await createMediaIntegrityReport({
    repoRoot: root,
    mediaAssets: [
      { id: "public-shadow", type: "image", src: "/media/fixtures/shadow.webp", width: 10, height: 6 },
    ],
    mediaEntries: [{ id: "public-shadow-use", assetId: "public-shadow" }],
    scanPhysicalMedia: false,
  });

  assert.equal(report.errorCount, 0, report.errors.join("\n"));
});
