import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  prepareCloudflarePagesPreview,
  rawGitHubUrl,
  redirectLine,
} from "../tools/preview/prepare-cloudflare-pages.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const TEST_LIMIT_BYTES = 1024;
const TEST_OVERSIZED_BYTES = 2048;

test("raw GitHub fallback is exact-SHA scoped and path-safe", () => {
  assert.equal(
    rawGitHubUrl("looksawful/looksawful.ru", SHA, "media/projects/demo/file name.mov"),
    `https://raw.githubusercontent.com/looksawful/looksawful.ru/${SHA}/public/media/projects/demo/file%20name.mov`,
  );
  assert.equal(
    redirectLine("media/projects/demo/file.mov", "https://example.com/file.mov"),
    "/media/projects/demo/file.mov https://example.com/file.mov 302",
  );
});

test("preview packaging redirects tracked oversized assets and only surrogates generated delivery video", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-preview-media-"));
  const dist = path.join(root, "dist");
  await mkdir(path.join(dist, "media/projects/demo"), { recursive: true });
  await mkdir(path.join(dist, "media/generated/video/demo"), { recursive: true });

  const trackedLarge = path.join(dist, "media/projects/demo/master.mov");
  const generatedLarge = path.join(dist, "media/generated/video/demo/delivery.web.mp4");
  const small = path.join(dist, "small.txt");
  await writeFile(trackedLarge, "x".repeat(TEST_OVERSIZED_BYTES));
  await writeFile(generatedLarge, "y".repeat(TEST_OVERSIZED_BYTES));
  await writeFile(small, "small");

  const manifest = await prepareCloudflarePagesPreview({
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
  assert.equal(await readFile(small, "utf8"), "small");

  const redirects = await readFile(path.join(dist, "_redirects"), "utf8");
  assert.match(redirects, new RegExp(`/media/projects/demo/master\\.mov https://raw\\.githubusercontent\\.com/looksawful/looksawful\\.ru/${SHA}/public/media/projects/demo/master\\.mov 302`));

  assert.deepEqual(
    manifest.records.map(({ path: assetPath, handling }) => ({ path: assetPath, handling })),
    [
      {
        path: "media/generated/video/demo/delivery.web.mp4",
        handling: "preview-only-generated-video-surrogate",
      },
      {
        path: "media/projects/demo/master.mov",
        handling: "exact-sha-github-raw-redirect",
      },
    ],
  );
});

test("unknown oversized files fail closed and remain on disk", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-preview-media-unknown-"));
  const dist = path.join(root, "dist");
  await mkdir(path.join(dist, "mystery"), { recursive: true });
  const filePath = path.join(dist, "mystery/blob.bin");
  await writeFile(filePath, "z".repeat(TEST_OVERSIZED_BYTES));

  await assert.rejects(
    prepareCloudflarePagesPreview({
      distDir: dist,
      repository: "looksawful/looksawful.ru",
      headSha: SHA,
      limitBytes: TEST_LIMIT_BYTES,
      isTracked: () => false,
      transcodeGeneratedVideo: async () => {
        throw new Error("should not transcode unknown assets");
      },
    }),
    /unsupported oversized preview asset/,
  );

  assert.equal((await stat(filePath)).size, TEST_OVERSIZED_BYTES);
});
