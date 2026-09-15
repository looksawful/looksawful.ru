import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const TEST_LIMIT_BYTES = 1024;
const TEST_OVERSIZED_BYTES = 2048;

async function loadPackager() {
  try {
    return await import("../tools/preview/prepare-cloudflare-pages-v2.mjs");
  } catch (error) {
    assert.fail(`private preview media packager must be importable: ${error.message}`);
  }
}

test("private preview packaging records tracked oversized media without browser redirects", async () => {
  const { preparePrivateCloudflarePagesPreview } = await loadPackager();
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-private-preview-media-"));
  const dist = path.join(root, "dist");
  await mkdir(path.join(dist, "media/projects/demo"), { recursive: true });
  await mkdir(path.join(dist, "media/generated/video/demo"), { recursive: true });

  const trackedLarge = path.join(dist, "media/projects/demo/master.mov");
  const generatedLarge = path.join(dist, "media/generated/video/demo/delivery.web.mp4");
  await writeFile(trackedLarge, "x".repeat(TEST_OVERSIZED_BYTES));
  await writeFile(generatedLarge, "y".repeat(TEST_OVERSIZED_BYTES));

  const manifest = await preparePrivateCloudflarePagesPreview({
    distDir: dist,
    repository: "looksawful/looksawful.ru",
    headSha: SHA,
    limitBytes: TEST_LIMIT_BYTES,
    isTracked: (repoPath) => repoPath === "public/media/projects/demo/master.mov",
    transcodeGeneratedVideo: async (filePath) => {
      await writeFile(filePath, "preview");
      return 7;
    },
  });

  await assert.rejects(stat(trackedLarge), { code: "ENOENT" });
  assert.equal(await readFile(generatedLarge, "utf8"), "preview");
  await assert.rejects(readFile(path.join(dist, "_redirects"), "utf8"), { code: "ENOENT" });

  assert.deepEqual(manifest.records, [
    {
      path: "media/generated/video/demo/delivery.web.mp4",
      originalBytes: TEST_OVERSIZED_BYTES,
      previewBytes: 7,
      handling: "preview-only-generated-video-surrogate",
    },
    {
      path: "media/projects/demo/master.mov",
      originalBytes: TEST_OVERSIZED_BYTES,
      handling: "authenticated-exact-sha-upstream",
      upstream: `https://raw.githubusercontent.com/looksawful/looksawful.ru/${SHA}/public/media/projects/demo/master.mov`,
    },
  ]);

  const writtenManifest = JSON.parse(await readFile(path.join(dist, "preview-media-manifest.json"), "utf8"));
  assert.deepEqual(writtenManifest, manifest);
});

test("private preview packaging fails closed on unknown oversized files and preserves the source copy", async () => {
  const { preparePrivateCloudflarePagesPreview } = await loadPackager();
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-private-preview-unknown-"));
  const dist = path.join(root, "dist");
  await mkdir(path.join(dist, "mystery"), { recursive: true });
  const filePath = path.join(dist, "mystery/blob.bin");
  await writeFile(filePath, "z".repeat(TEST_OVERSIZED_BYTES));

  await assert.rejects(
    preparePrivateCloudflarePagesPreview({
      distDir: dist,
      repository: "looksawful/looksawful.ru",
      headSha: SHA,
      limitBytes: TEST_LIMIT_BYTES,
      isTracked: () => false,
      transcodeGeneratedVideo: async () => {
        throw new Error("should not transcode unknown assets");
      },
    }),
    /unsupported oversized private preview asset/i,
  );

  assert.equal((await stat(filePath)).size, TEST_OVERSIZED_BYTES);
});
