import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(publicDir, "assets");
const reportDir = path.join(publicDir, "_audit-gallery-inventory");
const manifestPath = path.join(publicDir, "assets", "gallery", "manifest.json");

const mediaExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif", ".mp4", ".webm", ".mov", ".m4v"]);
const imageExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const textExtensions = new Set([".html", ".css", ".scss", ".sass", ".less", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".yml", ".yaml", ".txt"]);
const ignoredDirs = new Set([".git", ".vite", "node_modules", "dist", "dist-ssr", "build", "out", "coverage", ".cache", "_reports", "_audit-gallery-inventory"]);
const maxTextBytes = 8 * 1024 * 1024;

const posix = (value) => value.split(path.sep).join("/");
const repoPath = (absolute) => posix(path.relative(rootDir, absolute));
const publicPath = (absolute) => absolute.startsWith(publicDir + path.sep) ? `/${posix(path.relative(publicDir, absolute))}` : null;
const extensionOf = (value) => path.extname(value).toLowerCase();

async function walk(dir, predicate = () => true) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(absolute, predicate));
    else if (entry.isFile() && predicate(absolute)) result.push(absolute);
  }
  return result;
}

async function sha256File(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

const hashBuffer = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function bitsToHex(bits) {
  let output = "";
  for (let index = 0; index < bits.length; index += 4) {
    output += Number.parseInt(bits.slice(index, index + 4).padEnd(4, "0"), 2).toString(16);
  }
  return output;
}

async function imageFingerprint(filePath) {
  try {
    const image = sharp(filePath, { animated: false, failOn: "none" }).rotate();
    const metadata = await image.metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    const normalized = await image.clone().resize(64, 64, { fit: "fill" }).removeAlpha().raw().toBuffer();
    const dPixels = await image.clone().resize(9, 8, { fit: "fill" }).grayscale().raw().toBuffer();
    let dBits = "";
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        dBits += dPixels[row * 9 + column] > dPixels[row * 9 + column + 1] ? "1" : "0";
      }
    }
    const aPixels = await image.clone().resize(8, 8, { fit: "fill" }).grayscale().raw().toBuffer();
    const mean = [...aPixels].reduce((sum, value) => sum + value, 0) / aPixels.length;
    const aBits = [...aPixels].map((value) => value >= mean ? "1" : "0").join("");
    const average = await image.clone().resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer();
    return {
      width,
      height,
      ratio: width && height ? Number((width / height).toFixed(6)) : null,
      format: metadata.format || extensionOf(filePath).slice(1),
      pages: Number(metadata.pages || 1),
      pixelHash: hashBuffer(normalized),
      dHash: bitsToHex(dBits),
      aHash: bitsToHex(aBits),
      averageRgb: average.length >= 3 ? [average[0], average[1], average[2]] : null,
    };
  } catch (error) {
    return { metadataError: String(error.message || error) };
  }
}

function inferArea(value) {
  const normalized = `/${value.toLowerCase()}`;
  if (normalized.includes("/public/assets/gallery/database/")) return "gallery-database";
  if (normalized.includes("/public/assets/gallery/custom/")) return "gallery-custom";
  if (normalized.includes("/public/assets/media/cases/")) return "case-media";
  if (normalized.includes("/public/assets/gallery/")) return "gallery-system";
  return "other-public-assets";
}

function inferProject(value) {
  const normalized = value.toLowerCase();
  if (normalized.includes("jesteipool") || normalized.includes("/jestei/")) return "jesteipool";
  if (normalized.includes("styx")) return "styx";
  if (normalized.includes("shootings") || normalized.includes("shoots") || normalized.includes("photography")) return "shootings";
  if (normalized.includes("pets")) return "pets";
  if (normalized.includes("vanila-draft")) return "vanila-draft-unclassified";
  return "unclassified";
}

function normalizeReference(value) {
  const cleaned = value.replace(/[?#].*$/, "").replace(/^https?:\/\/[^/]+/i, "").replace(/^public\//, "/");
  if (cleaned.startsWith("/assets/")) return cleaned;
  if (cleaned.startsWith("assets/")) return `/${cleaned}`;
  return null;
}

async function collectReferences() {
  const textFiles = await walk(rootDir, (absolute) => textExtensions.has(extensionOf(absolute)));
  const map = new Map();
  const pattern = /(?:https?:\/\/[^\s"'`)]+)?\/?assets\/[A-Za-z0-9_%@()+,.;=\-\[\]{}!$&'~\/А-Яа-яЁё ]+?\.(?:webp|png|jpe?g|gif|svg|avif|mp4|webm|mov|m4v)(?:\?[^\s"'`)]*)?/gi;
  let scanned = 0;
  for (const absolute of textFiles) {
    const stats = await fs.stat(absolute);
    if (stats.size > maxTextBytes) continue;
    scanned += 1;
    const relative = repoPath(absolute);
    const lines = (await fs.readFile(absolute, "utf8")).split(/\r?\n/);
    for (let line = 0; line < lines.length; line += 1) {
      for (const match of lines[line].matchAll(pattern)) {
        const target = normalizeReference(match[0]);
        if (!target) continue;
        if (!map.has(target)) map.set(target, []);
        const usages = map.get(target);
        if (usages.length < 100) usages.push({ file: relative, line: line + 1 });
      }
    }
  }
  return { map, scanned };
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].filter(([, values]) => values.length > 1).map(([key, values]) => ({ key, items: values.map((item) => item.repoPath) }));
}

function countBy(items, keyFn) {
  const output = {};
  for (const item of items) {
    const key = String(keyFn(item) ?? "unknown");
    output[key] = (output[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(output).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ru")));
}

function hamming(left, right) {
  if (!left || !right || left.length !== right.length) return Infinity;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    let value = Number.parseInt(left[index], 16) ^ Number.parseInt(right[index], 16);
    while (value) { distance += value & 1; value >>= 1; }
  }
  return distance;
}

function perceptualCandidates(images) {
  const buckets = new Map();
  for (const image of images) {
    if (!image.dHash || !image.aHash || !image.ratio) continue;
    const bucket = Math.round(Math.log2(image.ratio) * 24);
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push(image);
  }
  const pairs = new Set();
  const output = [];
  for (const [bucket, leftItems] of buckets) {
    const candidates = [...leftItems, ...(buckets.get(bucket - 1) || []), ...(buckets.get(bucket + 1) || [])];
    for (const left of leftItems) {
      for (const right of candidates) {
        if (left.repoPath >= right.repoPath) continue;
        const pairKey = `${left.repoPath}\n${right.repoPath}`;
        if (pairs.has(pairKey) || left.pixelHash === right.pixelHash) continue;
        pairs.add(pairKey);
        const ratioDelta = Math.abs(left.ratio - right.ratio) / Math.max(left.ratio, right.ratio);
        if (ratioDelta > 0.03) continue;
        const dDistance = hamming(left.dHash, right.dHash);
        const aDistance = hamming(left.aHash, right.aHash);
        if (dDistance <= 5 && aDistance <= 7) {
          output.push({ left: left.repoPath, right: right.repoPath, dHashDistance: dDistance, aHashDistance: aDistance, ratioDelta: Number(ratioDelta.toFixed(6)), leftSize: `${left.width || 0}x${left.height || 0}`, rightSize: `${right.width || 0}x${right.height || 0}` });
        }
      }
    }
  }
  return output.sort((left, right) => left.dHashDistance - right.dHashDistance || left.aHashDistance - right.aHashDistance);
}

function duplicateNameCandidates(items) {
  const normalize = (name) => path.parse(name.toLowerCase()).name
    .replace(/--(?:jpg|jpeg|png|webp|svg)$/i, "")
    .replace(/\b(?:копия|copy|final|финал|web|webp|clean|чище|v\d+)\b/giu, "")
    .replace(/[\s_()\-—]+/g, "")
    .replace(/\d+$/g, "");
  return groupBy(items, (item) => normalize(item.filename)).filter((group) => group.key.length >= 5);
}

async function readManifest() {
  try { return JSON.parse(await fs.readFile(manifestPath, "utf8")); }
  catch (error) { return { items: [], manifestError: String(error.message || error) }; }
}

async function main() {
  await fs.rm(reportDir, { recursive: true, force: true });
  await fs.mkdir(reportDir, { recursive: true });
  const mediaFiles = await walk(assetsDir, (absolute) => mediaExtensions.has(extensionOf(absolute)));
  const { map: references, scanned: textFilesScanned } = await collectReferences();
  const manifest = await readManifest();
  const manifestItems = Array.isArray(manifest.items) ? manifest.items : [];
  const manifestBySrc = new Map();
  for (const item of manifestItems) {
    if (!manifestBySrc.has(item.src)) manifestBySrc.set(item.src, []);
    manifestBySrc.get(item.src).push(item);
  }

  const inventory = [];
  for (let index = 0; index < mediaFiles.length; index += 1) {
    const absolute = mediaFiles[index];
    const stats = await fs.stat(absolute);
    const relative = repoPath(absolute);
    const urlPath = publicPath(absolute);
    const extension = extensionOf(absolute);
    const type = imageExtensions.has(extension) ? "image" : videoExtensions.has(extension) ? "video" : "media";
    const fingerprint = type === "image" ? await imageFingerprint(absolute) : {};
    const usages = references.get(urlPath) || [];
    const manifestEntries = manifestBySrc.get(urlPath) || [];
    inventory.push({
      index: index + 1,
      repoPath: relative,
      publicPath: urlPath,
      filename: path.basename(absolute),
      extension,
      type,
      bytes: stats.size,
      sha256: await sha256File(absolute),
      area: inferArea(relative),
      inferredProject: inferProject(relative),
      references: usages,
      referencedOutsideManifest: usages.some((entry) => entry.file !== "public/assets/gallery/manifest.json"),
      inManifest: manifestEntries.length > 0,
      manifestIds: manifestEntries.map((entry) => entry.id),
      ...fingerprint,
    });
    if ((index + 1) % 250 === 0) console.log(`gallery audit: ${index + 1}/${mediaFiles.length}`);
  }

  const byPublicPath = new Map(inventory.map((item) => [item.publicPath, item]));
  const missingReferences = [...references.entries()].filter(([target]) => !byPublicPath.has(target)).map(([target, usages]) => ({ publicPath: target, references: usages }));
  const exactDuplicates = groupBy(inventory, (item) => item.sha256);
  const pixelDuplicates = groupBy(inventory.filter((item) => item.pixelHash), (item) => item.pixelHash).filter((group) => new Set(group.items.map((name) => inventory.find((item) => item.repoPath === name)?.sha256)).size > 1);
  const visualCandidates = perceptualCandidates(inventory.filter((item) => item.type === "image"));
  const nameCandidates = duplicateNameCandidates(inventory);
  const manifestDuplicateIds = groupBy(manifestItems, (item) => item.id);
  const manifestDuplicateSrc = groupBy(manifestItems, (item) => item.src);
  const manifestMissingFiles = manifestItems.filter((item) => !byPublicPath.has(item.src)).map((item) => ({ id: item.id, src: item.src, project: item.project, category: item.category }));
  const unindexedAssets = inventory.filter((item) => !item.inManifest);
  const unreferencedAssets = inventory.filter((item) => !item.inManifest && !item.referencedOutsideManifest);
  const manifestOnlyAssets = inventory.filter((item) => item.inManifest && !item.referencedOutsideManifest);
  const metadataErrors = inventory.filter((item) => item.metadataError);

  const summary = {
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || "build",
    totals: {
      mediaFiles: inventory.length,
      images: inventory.filter((item) => item.type === "image").length,
      videos: inventory.filter((item) => item.type === "video").length,
      bytes: inventory.reduce((sum, item) => sum + item.bytes, 0),
      textFilesScanned,
      manifestItems: manifestItems.length,
      exactDuplicateGroups: exactDuplicates.length,
      exactDuplicateFiles: exactDuplicates.reduce((sum, group) => sum + group.items.length, 0),
      pixelDuplicateGroups: pixelDuplicates.length,
      pixelDuplicateFiles: pixelDuplicates.reduce((sum, group) => sum + group.items.length, 0),
      perceptualCandidates: visualCandidates.length,
      filenameCandidateGroups: nameCandidates.length,
      missingReferences: missingReferences.length,
      manifestDuplicateIds: manifestDuplicateIds.length,
      manifestDuplicateSrc: manifestDuplicateSrc.length,
      manifestMissingFiles: manifestMissingFiles.length,
      unindexedAssets: unindexedAssets.length,
      unreferencedAssets: unreferencedAssets.length,
      manifestOnlyAssets: manifestOnlyAssets.length,
      metadataErrors: metadataErrors.length,
    },
    byArea: countBy(inventory, (item) => item.area),
    byProject: countBy(inventory, (item) => item.inferredProject),
    byExtension: countBy(inventory, (item) => item.extension),
    manifestByProject: countBy(manifestItems, (item) => item.project),
    manifestByCategory: countBy(manifestItems, (item) => item.category),
    manifestByType: countBy(manifestItems, (item) => item.type),
    largestFiles: [...inventory].sort((left, right) => right.bytes - left.bytes).slice(0, 100).map((item) => ({ repoPath: item.repoPath, bytes: item.bytes, width: item.width || 0, height: item.height || 0, project: item.inferredProject })),
  };

  const reports = {
    "summary.json": summary,
    "site-assets-inventory.json": inventory,
    "reference-map.json": Object.fromEntries(references),
    "exact-duplicates.json": exactDuplicates,
    "pixel-duplicates.json": pixelDuplicates,
    "perceptual-candidates.json": visualCandidates,
    "filename-candidates.json": nameCandidates,
    "missing-references.json": missingReferences,
    "manifest-audit.json": { sources: manifest.sources || [], itemCount: manifestItems.length, duplicateIds: manifestDuplicateIds, duplicateSrc: manifestDuplicateSrc, missingFiles: manifestMissingFiles, byProject: summary.manifestByProject, byCategory: summary.manifestByCategory, byType: summary.manifestByType, manifestError: manifest.manifestError || null },
    "unindexed-assets.json": unindexedAssets,
    "unreferenced-assets.json": unreferencedAssets,
    "manifest-only-assets.json": manifestOnlyAssets,
    "metadata-errors.json": metadataErrors,
  };
  for (const [name, data] of Object.entries(reports)) await fs.writeFile(path.join(reportDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(reportDir, "index.json"), `${JSON.stringify({ files: Object.keys(reports), summary }, null, 2)}\n`, "utf8");
  console.log(`GALLERY_AUDIT_SUMMARY=${JSON.stringify(summary)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
