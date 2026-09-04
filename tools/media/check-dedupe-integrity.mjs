import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { mediaAssets, mediaEntries } from "../../src/data/media/index.ts";
import { registeredMediaAssets } from "../../src/data/media/assets/registered.ts";

import logicalSource from "../media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };
import noMergeSource from "../media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };

const rootUrl = new URL("../../", import.meta.url);
const retiredAliasMap = new Map(
  logicalSource.components.flatMap((component) =>
    component.removeAssetIds.map((fromAssetId) => [fromAssetId, component.canonicalAssetId]),
  ),
);
const retiredMediaAssetIds = new Set(retiredAliasMap.keys());

function canonicalMediaAssetId(assetId) {
  return retiredAliasMap.get(assetId) ?? assetId;
}

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

export async function checkDedupeIntegrity() {
  const errors = [];
  const warnings = [];
  const assetIdGroups = new Map();
  const srcGroups = new Map();
  const byteHashGroups = new Map();
  const pixelHashGroups = new Map();
  const assetById = new Map();

  for (const asset of mediaAssets) {
    pushGroup(assetIdGroups, asset.id, asset);
    pushGroup(srcGroups, asset.src, asset);
    assetById.set(asset.id, asset);

    if (retiredMediaAssetIds.has(asset.id)) {
      errors.push(`retired MediaAsset survived runtime registry: ${asset.id}`);
    }
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
    if (retiredMediaAssetIds.has(entry.assetId)) {
      errors.push(`MediaEntry references retired asset: ${entry.id} -> ${entry.assetId}`);
    }
    if (entry.posterAssetId && !assetById.has(entry.posterAssetId)) {
      errors.push(`dangling posterAssetId: ${entry.id} -> ${entry.posterAssetId}`);
    }
  }

  for (const asset of mediaAssets) {
    const repoPath = repoPathFor(asset.src);
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

  const registeredByPath = new Map(
    registeredMediaAssets.map((asset) => [repoPathFor(asset.src), asset]),
  );

  for (const constraint of noMergeSource) {
    for (const side of ["left", "right"]) {
      try {
        await readFile(absolutePath(constraint[side]));
      } catch {
        errors.push(
          `${constraint.decision.toUpperCase()} no-merge source missing: ${constraint.source} ${constraint[side]}`,
        );
      }
    }

    const leftAsset = registeredByPath.get(constraint.left);
    const rightAsset = registeredByPath.get(constraint.right);
    if (leftAsset && rightAsset) {
      const leftCanonical = canonicalMediaAssetId(leftAsset.id);
      const rightCanonical = canonicalMediaAssetId(rightAsset.id);
      if (leftCanonical === rightCanonical) {
        errors.push(
          `${constraint.decision.toUpperCase()} no-merge violation: ${constraint.source} -> ${leftCanonical}`,
        );
      }
    }
  }

  // Perceptual/near matching is intentionally not an error gate. The reviewed
  // Stage 3 detector remains a human-review workflow; this command never
  // auto-merges or auto-deletes based on visual similarity.
  warnings.push(
    "near/perceptual similarity is review-only and is not used for automatic deletion",
  );

  return {
    assetCount: mediaAssets.length,
    entryCount: mediaEntries.length,
    imageAssetCount: mediaAssets.filter((asset) => asset.type === "image").length,
    retiredAliasCount: retiredMediaAssetIds.size,
    noMergeConstraintCount: noMergeSource.length,
    errors,
    warnings,
  };
}

async function main() {
  const result = await checkDedupeIntegrity();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.errors.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
