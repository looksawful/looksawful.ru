import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOTS = ["public/assets", "src/assets", "src/visuals"];
const SOURCE_ROOTS = ["index.html", "src", "public", "gallery", "pets"];
const REPORT_PATH = path.join(ROOT, "_local", "reports", "asset-inventory.json");
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(target) {
  if (!(await exists(target))) return [];

  const entryStat = await stat(target);
  if (entryStat.isFile()) return [target];

  const entries = await readdir(target, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "_local") {
      continue;
    }

    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toProjectPath(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

async function hashFile(file) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

async function getDimensions(file) {
  const extension = path.extname(file).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) return null;

  try {
    const metadata = await sharp(file).metadata();
    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      format: metadata.format ?? extension.slice(1),
    };
  } catch {
    return {
      width: null,
      height: null,
      format: extension.slice(1),
    };
  }
}

async function collectSources() {
  const files = (
    await Promise.all(SOURCE_ROOTS.map((entry) => walk(path.join(ROOT, entry))))
  )
    .flat()
    .filter((file) => /\.(?:css|html|js|json|mjs|svg)$/iu.test(file));

  return Promise.all(
    files.map(async (file) => ({
      file: toProjectPath(file),
      text: await readFile(file, "utf8").catch(() => ""),
    })),
  );
}

function usageNeedles(assetPath) {
  const publicPath = assetPath.startsWith("public/")
    ? `/${assetPath.slice("public/".length)}`
    : assetPath;
  const basename = path.posix.basename(assetPath);

  return [...new Set([assetPath, publicPath, basename])].filter(Boolean);
}

function findUsage(assetPath, sources) {
  const needles = usageNeedles(assetPath);
  const usage = [];

  for (const source of sources) {
    if (source.file === assetPath) continue;
    if (needles.some((needle) => source.text.includes(needle))) {
      usage.push(source.file);
    }
  }

  return usage;
}

async function main() {
  const assetFiles = (
    await Promise.all(ASSET_ROOTS.map((entry) => walk(path.join(ROOT, entry))))
  )
    .flat()
    .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`));

  const sources = await collectSources();
  const records = [];
  const byHash = new Map();

  for (const file of assetFiles) {
    const fileStat = await stat(file);
    const assetPath = toProjectPath(file);
    const hash = await hashFile(file);
    const dimensions = await getDimensions(file);
    const usage = findUsage(assetPath, sources);
    const record = {
      path: assetPath,
      bytes: fileStat.size,
      extension: path.extname(file).slice(1).toLowerCase(),
      hash,
      dimensions,
      usage,
      used: usage.length > 0,
    };

    records.push(record);

    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(assetPath);
  }

  const duplicates = [...byHash.values()].filter((paths) => paths.length > 1);
  const report = {
    generatedAt: new Date().toISOString(),
    roots: ASSET_ROOTS,
    totals: {
      files: records.length,
      bytes: records.reduce((sum, record) => sum + record.bytes, 0),
      used: records.filter((record) => record.used).length,
      unused: records.filter((record) => !record.used).length,
      duplicateGroups: duplicates.length,
    },
    duplicates,
    assets: records.sort((a, b) => a.path.localeCompare(b.path)),
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    [
      `Asset inventory written to ${toProjectPath(REPORT_PATH)}`,
      `files=${report.totals.files}`,
      `used=${report.totals.used}`,
      `unused=${report.totals.unused}`,
      `duplicateGroups=${report.totals.duplicateGroups}`,
    ].join(" "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
