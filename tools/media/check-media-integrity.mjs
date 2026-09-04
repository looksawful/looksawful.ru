import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { mediaAssets, mediaEntries } from "../../src/data/media/index.ts";

const rootUrl = new URL("../../", import.meta.url);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function repoPathFor(src) {
  if (typeof src !== "string" || !src.startsWith("/")) return null;
  const clean = src.split(/[?#]/, 1)[0];
  return `public${clean}`;
}

function absolutePath(repoPath) {
  return fileURLToPath(new URL(repoPath, rootUrl));
}

function pushGroup(map, key, value) {
  const group = map.get(key);
  if (group) group.push(value);
  else map.set(key, [value]);
}

function duplicateGroups(map) {
  return [...map.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([identity, values]) => ({ identity, values }));
}

function formatGroup(label, group) {
  return `${label} ${group.identity}: ${group.values
    .map(({ id, src }) => `${id} (${src})`)
    .join(", ")}`;
}

async function decodedPixelHash(path) {
  const { data, info } = await sharp(path, { animated: false })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const header = Buffer.from(`${info.width}x${info.height}x${info.channels}:`, "utf8");
  return sha256(Buffer.concat([header, data]));
}

export async function checkMediaIntegrity() {
  const errors = [];
  const assetIdGroups = new Map();
  const srcGroups = new Map();
  const byteHashGroups = new Map();
  const pixelHashGroups = new Map();
  const assetById = new Map();

  for (const asset of mediaAssets) {
    pushGroup(assetIdGroups, asset.id, asset);
    pushGroup(srcGroups, asset.src, asset);
    assetById.set(asset.id, asset);
  }

  for (const group of duplicateGroups(assetIdGroups)) {
    errors.push(formatGroup("duplicate MediaAsset id", group));
  }
  for (const group of duplicateGroups(srcGroups)) {
    errors.push(formatGroup("duplicate canonical src", group));
  }

  for (const entry of mediaEntries) {
    if (!assetById.has(entry.assetId)) {
      errors.push(`dangling MediaEntry.assetId: ${entry.id} -> ${entry.assetId}`);
    }
    if (entry.posterAssetId && !assetById.has(entry.posterAssetId)) {
      errors.push(`dangling posterAssetId: ${entry.id} -> ${entry.posterAssetId}`);
    }
  }

  for (const asset of mediaAssets) {
    const authoredSrc = asset.type === "video" ? (asset.sourceSrc ?? asset.src) : asset.src;
    const repoPath = repoPathFor(authoredSrc);
    if (!repoPath) continue;

    let bytes;
    try {
      bytes = await readFile(absolutePath(repoPath));
    } catch (error) {
      errors.push(`missing canonical source: ${asset.id} -> ${repoPath} (${error.code ?? error.message})`);
      continue;
    }

    if (asset.type !== "image") continue;

    pushGroup(byteHashGroups, sha256(bytes), asset);
    try {
      const pixelHash = await decodedPixelHash(absolutePath(repoPath));
      pushGroup(pixelHashGroups, pixelHash, asset);
    } catch (error) {
      errors.push(`image decode failed: ${asset.id} -> ${repoPath} (${error.message})`);
    }
  }

  for (const group of duplicateGroups(byteHashGroups)) {
    errors.push(formatGroup("byte-identical logical MediaAssets", group));
  }
  for (const group of duplicateGroups(pixelHashGroups)) {
    errors.push(formatGroup("pixel-identical logical MediaAssets", group));
  }

  return {
    assetCount: mediaAssets.length,
    entryCount: mediaEntries.length,
    imageAssetCount: mediaAssets.filter((asset) => asset.type === "image").length,
    errors,
  };
}

async function main() {
  const result = await checkMediaIntegrity();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.errors.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
