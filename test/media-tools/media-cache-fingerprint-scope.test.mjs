import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { computeMediaFingerprint } from "../../tools/media-dev-state.mjs";

const CONFIG_FILES = ["tools/build-responsive-media.mjs", "package-lock.json"];
const ASSETS = [{ id: "image", type: "image", src: "/media/source/image.jpg" }];

async function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

function lockfile({ sharp = "0.34.5", libvips = "1.2.4", vite = "8.0.0" } = {}) {
  return `${JSON.stringify({
    name: "media-cache-fixture",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        dependencies: {
          sharp: `^${sharp}`,
          vite: `^${vite}`,
        },
      },
      "node_modules/sharp": {
        version: sharp,
        optionalDependencies: {
          "@img/sharp-libvips-linux-x64": libvips,
          "@img/sharp-linux-x64": sharp,
        },
      },
      "node_modules/@img/sharp-linux-x64": { version: sharp },
      "node_modules/@img/sharp-libvips-linux-x64": { version: libvips },
      "node_modules/vite": { version: vite },
    },
  }, null, 2)}\n`;
}

async function withFixture(run) {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "media-cache-fingerprint-scope-"));
  try {
    await write(repoRoot, "public/media/source/image.jpg", "image-source");
    await write(repoRoot, "tools/build-responsive-media.mjs", "builder-v1\n");
    await write(repoRoot, "package-lock.json", lockfile());
    await run(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

async function fingerprint(repoRoot) {
  return computeMediaFingerprint({ repoRoot, assets: ASSETS, configFiles: CONFIG_FILES });
}

test("unrelated package-lock dependency changes do not invalidate generated media cache", async () => {
  await withFixture(async (repoRoot) => {
    const before = await fingerprint(repoRoot);
    await write(repoRoot, "package-lock.json", lockfile({ vite: "8.1.0" }));
    const after = await fingerprint(repoRoot);

    assert.equal(after, before);
  });
});

test("sharp package-lock changes invalidate generated media cache", async () => {
  await withFixture(async (repoRoot) => {
    const before = await fingerprint(repoRoot);
    await write(repoRoot, "package-lock.json", lockfile({ sharp: "0.34.6" }));
    const after = await fingerprint(repoRoot);

    assert.notEqual(after, before);
  });
});

test("sharp libvips package-lock changes invalidate generated media cache", async () => {
  await withFixture(async (repoRoot) => {
    const before = await fingerprint(repoRoot);
    await write(repoRoot, "package-lock.json", lockfile({ libvips: "1.2.5" }));
    const after = await fingerprint(repoRoot);

    assert.notEqual(after, before);
  });
});
