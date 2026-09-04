import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);
const ROOTS = ["public/media", "public/pets"];
const EXCLUDED_PREFIXES = ["public/media/generated/"];

function posix(value) {
  return String(value).replace(/\\/g, "/");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function isIncludedImage(relativePath) {
  const clean = posix(relativePath);
  return (
    IMAGE_EXTENSIONS.has(path.extname(clean).toLowerCase()) &&
    !EXCLUDED_PREFIXES.some((prefix) => clean.startsWith(prefix))
  );
}

async function walkImages(repoRoot, relativeRoot) {
  const root = path.resolve(repoRoot, relativeRoot);
  const output = [];
  const pending = [root];

  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const relative = posix(path.relative(repoRoot, absolute));
      if (isIncludedImage(relative)) output.push(relative);
    }
  }

  return output;
}

function pushGroup(map, key, value) {
  const values = map.get(key);
  if (values) values.push(value);
  else map.set(key, [value]);
}

function duplicateGroups(map) {
  return [...map.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([identity, paths]) => ({ identity, paths: [...paths].sort() }))
    .sort((left, right) => left.paths[0].localeCompare(right.paths[0]));
}

async function decodedPixelHash(absolutePath) {
  const { data, info } = await sharp(absolutePath, { animated: false })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const header = Buffer.from(`${info.width}x${info.height}x${info.channels}:`, "utf8");
  return sha256(Buffer.concat([header, data]));
}

export async function auditPhysicalDuplicates({ repoRoot = process.cwd() } = {}) {
  const relativePaths = (
    await Promise.all(ROOTS.map((root) => walkImages(repoRoot, root)))
  )
    .flat()
    .sort();

  const byteGroups = new Map();
  const byteHashByPath = new Map();
  const decodeErrors = [];

  for (const relativePath of relativePaths) {
    const bytes = await readFile(path.resolve(repoRoot, relativePath));
    const hash = sha256(bytes);
    byteHashByPath.set(relativePath, hash);
    pushGroup(byteGroups, hash, relativePath);
  }

  const exactDuplicateGroups = duplicateGroups(byteGroups);
  const pixelGroups = new Map();

  for (const relativePath of relativePaths) {
    try {
      const pixelHash = await decodedPixelHash(path.resolve(repoRoot, relativePath));
      pushGroup(pixelGroups, pixelHash, relativePath);
    } catch (error) {
      decodeErrors.push(`${relativePath}: ${error.message}`);
    }
  }

  const pixelIdenticalGroups = duplicateGroups(pixelGroups).filter((group) => {
    const byteHashes = new Set(group.paths.map((relativePath) => byteHashByPath.get(relativePath)));
    return byteHashes.size > 1;
  });

  return {
    physicalImageCount: relativePaths.length,
    roots: ROOTS,
    excludedPrefixes: EXCLUDED_PREFIXES,
    exactDuplicateGroupCount: exactDuplicateGroups.length,
    exactDuplicateGroups,
    pixelIdenticalGroupCount: pixelIdenticalGroups.length,
    pixelIdenticalGroups,
    decodeErrorCount: decodeErrors.length,
    decodeErrors,
  };
}

async function main() {
  const result = await auditPhysicalDuplicates();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (
    result.exactDuplicateGroupCount > 0 ||
    result.pixelIdenticalGroupCount > 0 ||
    result.decodeErrorCount > 0
  ) {
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
