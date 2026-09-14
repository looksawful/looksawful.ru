import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  RETENTION_MS,
  prepareRetainedAssets,
} from "../tools/webvisor-retained-assets.mjs";

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "webvisor-assets-"));
  const distDir = path.join(root, "dist");
  const cacheDir = path.join(root, "cache");
  await mkdir(path.join(distDir, "assets"), { recursive: true });
  await mkdir(path.join(cacheDir, "assets"), { recursive: true });
  return { root, distDir, cacheDir };
}

async function writeManifest(cacheDir, entries) {
  await writeFile(
    path.join(cacheDir, "manifest.json"),
    `${JSON.stringify({ version: 1, assets: entries }, null, 2)}\n`,
    "utf8",
  );
}

test("keeps previous immutable assets for Webvisor while current HTML stays untouched", async () => {
  const { root, distDir, cacheDir } = await fixture();
  const nowMs = Date.UTC(2026, 8, 11, 12, 0, 0);
  const oldCss = "main-old.css";
  const currentCss = "main-current.css";
  const indexHtml = `<link rel="stylesheet" href="/assets/${currentCss}">`;

  try {
    await writeFile(path.join(cacheDir, "assets", oldCss), "old-css", "utf8");
    await writeManifest(cacheDir, {
      [oldCss]: { firstSeenMs: nowMs - (15 * 24 * 60 * 60 * 1000), size: 7 },
    });
    await writeFile(path.join(distDir, "assets", currentCss), "current-css", "utf8");
    await writeFile(path.join(distDir, "index.html"), indexHtml, "utf8");

    const result = await prepareRetainedAssets({ distDir, cacheDir, nowMs });

    assert.equal(await readFile(path.join(distDir, "assets", oldCss), "utf8"), "old-css");
    assert.equal(await readFile(path.join(cacheDir, "assets", currentCss), "utf8"), "current-css");
    assert.equal(await readFile(path.join(distDir, "index.html"), "utf8"), indexHtml);
    assert.deepEqual(result.retainedPrevious, [oldCss]);

    const manifest = JSON.parse(await readFile(path.join(cacheDir, "manifest.json"), "utf8"));
    assert.deepEqual(Object.keys(manifest.assets).sort(), [currentCss, oldCss].sort());
    assert.equal(manifest.assets[currentCss].firstSeenMs, nowMs);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("prunes assets only after the 16 day replay retention window", async () => {
  const { root, distDir, cacheDir } = await fixture();
  const nowMs = Date.UTC(2026, 8, 11, 12, 0, 0);
  const expiredCss = "main-expired.css";

  try {
    await writeFile(path.join(cacheDir, "assets", expiredCss), "expired", "utf8");
    await writeManifest(cacheDir, {
      [expiredCss]: { firstSeenMs: nowMs - RETENTION_MS - 1, size: 7 },
    });
    await writeFile(path.join(distDir, "assets", "main-current.css"), "current", "utf8");

    const result = await prepareRetainedAssets({ distDir, cacheDir, nowMs });

    assert.equal(await exists(path.join(distDir, "assets", expiredCss)), false);
    assert.equal(await exists(path.join(cacheDir, "assets", expiredCss)), false);
    assert.deepEqual(result.pruned, [expiredCss]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed on an impossible hashed-name content collision", async () => {
  const { root, distDir, cacheDir } = await fixture();
  const nowMs = Date.UTC(2026, 8, 11, 12, 0, 0);
  const asset = "main-same-hash.css";

  try {
    await writeFile(path.join(cacheDir, "assets", asset), "historical", "utf8");
    await writeManifest(cacheDir, {
      [asset]: { firstSeenMs: nowMs - 1000, size: 10 },
    });
    await writeFile(path.join(distDir, "assets", asset), "different-current", "utf8");

    await assert.rejects(
      prepareRetainedAssets({ distDir, cacheDir, nowMs }),
      /immutable asset collision/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("enforces an explicit retained asset size bound instead of growing forever", async () => {
  const { root, distDir, cacheDir } = await fixture();
  const nowMs = Date.UTC(2026, 8, 11, 12, 0, 0);

  try {
    await writeFile(path.join(distDir, "assets", "main-current.css"), "12345", "utf8");

    await assert.rejects(
      prepareRetainedAssets({ distDir, cacheDir, nowMs, maxBytes: 4 }),
      /retained asset pool exceeds/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Pages production pipeline restores, overlays, saves and verifies retained Webvisor CSS", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );

  assert.match(
    workflow,
    /outputs:\s*\n\s+retained_css: \$\{\{ steps\.webvisor-assets\.outputs\.retained_css \}\}/,
  );
  assert.match(
    workflow,
    /- name: Restore Webvisor retained assets[\s\S]*?uses: actions\/cache\/restore@v6[\s\S]*?path: \.cache\/webvisor-assets[\s\S]*?restore-keys: \|[\s\S]*?webvisor-assets-v1-\$\{\{ runner\.os \}\}-/,
  );

  const buildIndex = workflow.indexOf("- name: Build site");
  const prepareIndex = workflow.indexOf("- name: Prepare Webvisor retained assets");
  const saveIndex = workflow.indexOf("- name: Save Webvisor retained assets");
  const uploadIndex = workflow.indexOf("- name: Upload Pages artifact");
  assert.ok(buildIndex >= 0 && buildIndex < prepareIndex, "retention overlay must run after the current Vite build");
  assert.ok(prepareIndex < saveIndex && saveIndex < uploadIndex, "prepared pool must be saved before upload");

  assert.match(
    workflow,
    /- name: Prepare Webvisor retained assets[\s\S]*?id: webvisor-assets[\s\S]*?node tools\/webvisor-retained-assets\.mjs --dist dist --cache \.cache\/webvisor-assets/,
  );
  assert.match(
    workflow,
    /- name: Save Webvisor retained assets[\s\S]*?uses: actions\/cache\/save@v6[\s\S]*?path: \.cache\/webvisor-assets/,
  );
  assert.match(workflow, /retained_css="\$\{\{ needs\.build\.outputs\.retained_css \}\}"/);
  assert.match(workflow, /webvisor-retained\.headers/);
  assert.match(workflow, /content-type:\[\[:space:\]\]\*text\/css/i);
});
