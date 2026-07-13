import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const sourceRoot = path.resolve(rootDir, "..", "vanila-draft", "media");
const targetRoot = path.join(rootDir, "public", "assets", "gallery", "database", "vanila-draft");
const mapPath = path.join(targetRoot, "_source-map.json");
const sourceExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".tif",
  ".tiff",
  ".heic",
]);
const maxSize = Number(process.env.DRAFT_GALLERY_SIZE || 1400);
const quality = Number(process.env.DRAFT_GALLERY_QUALITY || 78);
const force = process.argv.includes("--force");

function naturalCompare(a, b) {
  return a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" });
}

async function listSourceImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await listSourceImages(absolute)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name).toLowerCase())) {
      result.push(absolute);
    }
  }

  return result.sort(naturalCompare);
}

function toRelativeSource(absolutePath) {
  return path.relative(sourceRoot, absolutePath).replaceAll(path.sep, "/");
}

function toTargetPath(relativeSource) {
  const parsed = path.parse(relativeSource);
  const sourceExt = parsed.ext.slice(1).toLowerCase() || "image";
  return path.join(targetRoot, parsed.dir, `${parsed.name}--${sourceExt}.webp`);
}

async function shouldSkipExisting(sourcePath, targetPath) {
  if (force) return false;

  try {
    const [sourceStat, targetStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(targetPath),
    ]);
    return targetStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

async function convertImage(sourcePath) {
  const relativeSource = toRelativeSource(sourcePath);
  const targetPath = toTargetPath(relativeSource);

  if (await shouldSkipExisting(sourcePath, targetPath)) {
    const targetStat = await fs.stat(targetPath);
    return {
      status: "cached",
      source: `media/${relativeSource}`,
      output: path.relative(targetRoot, targetPath).replaceAll(path.sep, "/"),
      size: targetStat.size,
    };
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    const info = await sharp(sourcePath, { failOn: "none", limitInputPixels: false })
      .rotate()
      .resize({
        width: maxSize,
        height: maxSize,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toFile(targetPath);

    return {
      status: "imported",
      source: `media/${relativeSource}`,
      output: path.relative(targetRoot, targetPath).replaceAll(path.sep, "/"),
      width: info.width,
      height: info.height,
      size: info.size,
    };
  } catch (error) {
    try {
      await execFileAsync("magick", [
        sourcePath,
        "-auto-orient",
        "-resize",
        `${maxSize}x${maxSize}>`,
        "-quality",
        String(quality),
        targetPath,
      ]);

      const [targetStat, meta] = await Promise.all([
        fs.stat(targetPath),
        sharp(targetPath).metadata(),
      ]);

      return {
        status: "imported",
        source: `media/${relativeSource}`,
        output: path.relative(targetRoot, targetPath).replaceAll(path.sep, "/"),
        width: Number(meta.width || 0),
        height: Number(meta.height || 0),
        size: targetStat.size,
        fallback: "imagemagick",
      };
    } catch (fallbackError) {
      return {
        status: "skipped",
        source: `media/${relativeSource}`,
        error: error.message,
        fallbackError: fallbackError.message,
      };
    }
  }
}

async function runPool(items, workerCount, task) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

async function main() {
  const sourceFiles = await listSourceImages(sourceRoot);
  const startedAt = new Date().toISOString();
  let lastLog = 0;

  await fs.mkdir(targetRoot, { recursive: true });

  const results = await runPool(sourceFiles, 4, async (sourcePath, index) => {
    const result = await convertImage(sourcePath);
    const done = index + 1;

    if (done - lastLog >= 100 || done === sourceFiles.length) {
      lastLog = done;
      console.log(`draft gallery import: ${done}/${sourceFiles.length}`);
    }

    return result;
  });

  const imported = results.filter((item) => item.status === "imported");
  const cached = results.filter((item) => item.status === "cached");
  const skipped = results.filter((item) => item.status === "skipped");
  const ready = results.filter((item) => item.status === "imported" || item.status === "cached");
  const totalOutputBytes = ready.reduce((sum, item) => sum + Number(item.size || 0), 0);
  const sourceMap = {
    sourceRoot: path.relative(rootDir, sourceRoot).replaceAll(path.sep, "/"),
    targetRoot: path.relative(rootDir, targetRoot).replaceAll(path.sep, "/"),
    generatedAt: startedAt,
    options: { maxSize, quality },
    counts: {
      source: sourceFiles.length,
      imported: imported.length,
      cached: cached.length,
      skipped: skipped.length,
    },
    outputBytes: totalOutputBytes,
    items: results,
  };

  await fs.writeFile(mapPath, `${JSON.stringify(sourceMap, null, 2)}\n`, "utf8");

  console.log(
    `draft gallery import: ${imported.length} imported, ${cached.length} cached, ${skipped.length} skipped -> ${path.relative(rootDir, targetRoot)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
