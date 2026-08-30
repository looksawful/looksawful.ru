import assert from "node:assert/strict";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ensureMediaDevState,
  inspectMediaDevState,
  writeMediaDevState,
} from "../../tools/media-dev-state.mjs";

const CONFIG_FILES = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "src/data/media/responsive-policy.ts",
  "package-lock.json",
];

const ASSETS = [
  { id: "image", type: "image", src: "/media/source/image.jpg" },
  {
    id: "video-generated",
    type: "video",
    src: "/media/generated/video/video.web.mp4",
    sourceSrc: "/media/source/video.mov",
  },
  { id: "video-direct", type: "video", src: "/media/source/direct.mp4" },
];

async function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
  return filePath;
}

async function createFixture() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "media-dev-state-"));
  await write(repoRoot, "public/media/source/image.jpg", "image-source");
  await write(repoRoot, "public/media/source/video.mov", "video-source");
  await write(repoRoot, "public/media/source/direct.mp4", "direct-video");
  await write(repoRoot, "public/media/generated/responsive/image-640.webp", "webp");
  await write(repoRoot, "public/media/generated/video/video.web.mp4", "video");

  for (const configPath of CONFIG_FILES) {
    await write(repoRoot, configPath, `fixture:${configPath}\n`);
  }

  await write(
    repoRoot,
    "public/media/generated/responsive-manifest.json",
    `${JSON.stringify({
      assets: [
        {
          id: "image",
          variants: [
            {
              src: "/media/generated/responsive/image-640.webp",
              bytes: Buffer.byteLength("webp"),
            },
          ],
        },
      ],
    }, null, 2)}\n`,
  );

  await write(
    repoRoot,
    "public/media/generated/video-inventory.json",
    `${JSON.stringify({
      videos: [
        {
          id: "video-generated",
          outputSrc: "/media/generated/video/video.web.mp4",
          outputBytes: Buffer.byteLength("video"),
        },
        { id: "video-direct", outputSrc: null, outputBytes: null },
      ],
    }, null, 2)}\n`,
  );

  return {
    repoRoot,
    assets: ASSETS.map((asset) => ({ ...asset })),
    statePath: path.join(repoRoot, ".cache/media/dev-state.json"),
  };
}

async function withFixture(run) {
  const fixture = await createFixture();
  try {
    await run(fixture);
  } finally {
    await rm(fixture.repoRoot, { recursive: true, force: true });
  }
}

async function writeFreshState(fixture) {
  await writeMediaDevState({
    repoRoot: fixture.repoRoot,
    assets: fixture.assets,
  });
  const result = await inspectMediaDevState({
    repoRoot: fixture.repoRoot,
    assets: fixture.assets,
  });
  assert.equal(result.fresh, true, result.reasons.join("; "));
}

test("missing or corrupted local state is stale", async () => {
  await withFixture(async (fixture) => {
    let result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /state/i);

    await mkdir(path.dirname(fixture.statePath), { recursive: true });
    await writeFile(fixture.statePath, "{broken-json", "utf8");
    result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /state/i);
  });
});

test("missing manifest or generated outputs invalidate an otherwise fresh state", async () => {
  await withFixture(async (fixture) => {
    await writeFreshState(fixture);

    const manifestPath = path.join(fixture.repoRoot, "public/media/generated/responsive-manifest.json");
    const manifestContents = await readFile(manifestPath, "utf8");
    await unlink(manifestPath);
    let result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /manifest/i);
    await writeFile(manifestPath, manifestContents, "utf8");

    await unlink(path.join(fixture.repoRoot, "public/media/generated/responsive/image-640.webp"));
    result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /responsive|output/i);
  });
});

test("missing generated video invalidates state while outputSrc null requires no derivative", async () => {
  await withFixture(async (fixture) => {
    await writeFreshState(fixture);
    await unlink(path.join(fixture.repoRoot, "public/media/generated/video/video.web.mp4"));

    const result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /video|output/i);
  });
});

test("source size and mtime changes invalidate local state without content hashing", async () => {
  await withFixture(async (fixture) => {
    await writeFreshState(fixture);
    const sourcePath = path.join(fixture.repoRoot, "public/media/source/image.jpg");

    await appendFile(sourcePath, "!");
    let result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /source|fingerprint/i);
  });

  await withFixture(async (fixture) => {
    await writeFreshState(fixture);
    const sourcePath = path.join(fixture.repoRoot, "public/media/source/image.jpg");
    const sourceStat = await stat(sourcePath);
    const nextMtime = new Date(sourceStat.mtimeMs + 5_000);
    await utimes(sourcePath, sourceStat.atime, nextMtime);

    const result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /source|fingerprint/i);
  });
});

test("registry and builder/config signature changes invalidate local state", async () => {
  await withFixture(async (fixture) => {
    await writeFreshState(fixture);
    const changedAssets = fixture.assets.map((asset, index) => (
      index === 0 ? { ...asset, id: "image-renamed" } : asset
    ));

    let result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: changedAssets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /registry/i);

    await appendFile(path.join(fixture.repoRoot, "tools/build-responsive-media.mjs"), "changed\n");
    result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, false);
    assert.match(result.reasons.join(" "), /config|tool/i);
  });
});

test("matching state, manifests, outputs, registry and config are fresh", async () => {
  await withFixture(async (fixture) => {
    await writeFreshState(fixture);
    const result = await inspectMediaDevState({ repoRoot: fixture.repoRoot, assets: fixture.assets });
    assert.equal(result.fresh, true, result.reasons.join("; "));
    assert.deepEqual(result.reasons, []);
  });
});

test("failed stale-state sync does not create a fresh state file", async () => {
  await withFixture(async (fixture) => {
    await assert.rejects(
      ensureMediaDevState({
        repoRoot: fixture.repoRoot,
        assets: fixture.assets,
        sync: async () => {
          throw new Error("sync failed");
        },
      }),
      /sync failed/,
    );

    await assert.rejects(readFile(fixture.statePath, "utf8"), /ENOENT/);
  });
});
