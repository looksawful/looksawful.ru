#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  destinationFor,
  groupDuplicateHashes,
  inspectImage,
  inspectVideo,
  mediaExtension,
  ratioToken,
  resolveSourcePath,
  rewriteProjectMedia,
  sha256File,
} from "./media-core.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArguments(argv) {
  const options = {
    apply: false,
    root: process.cwd(),
    index: "index.html",
    lyveRoot: process.env.LYVE_MEDIA_ROOT || "",
    quality: 90,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--root") options.root = argv[++index];
    else if (argument === "--index") options.index = argv[++index];
    else if (argument === "--lyve-root") options.lyveRoot = argv[++index];
    else if (argument === "--quality") options.quality = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!Number.isFinite(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error(`Invalid quality: ${options.quality}`);
  }

  options.root = path.resolve(options.root);
  return options;
}

async function loadMap() {
  const filePath = path.join(scriptDirectory, "media-migration-map.json");
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function prepareEntry(entry, options) {
  const resolved = resolveSourcePath({
    projectRoot: options.root,
    source: entry.source,
    project: entry.project,
    externalRoots: options.lyveRoot ? { lyve: options.lyveRoot } : {},
  });

  if (!resolved.path) {
    return { ...entry, error: "source-not-found", attempts: resolved.attempts };
  }

  const dimensions = entry.type === "image"
    ? await inspectImage(resolved.path)
    : inspectVideo(resolved.path);
  const ratio = ratioToken(dimensions.width, dimensions.height);
  const extension = mediaExtension(resolved.path, entry.type);
  const destination = destinationFor(entry, ratio, extension);
  const sourceHash = await sha256File(resolved.path);

  return {
    ...entry,
    sourcePath: resolved.path,
    sourceHash,
    width: dimensions.width,
    height: dimensions.height,
    ratio,
    targetFile: destination.filesystem,
    targetUrl: destination.url,
  };
}

function printSummary(entries, options) {
  const missing = entries.filter((entry) => entry.error);
  const images = entries.filter((entry) => entry.type === "image" && !entry.error).length;
  const videos = entries.filter((entry) => entry.type === "video" && !entry.error).length;
  const duplicates = groupDuplicateHashes(entries.filter((entry) => !entry.error));

  console.log(`mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`project root: ${options.root}`);
  console.log(`entries: ${entries.length}`);
  console.log(`images: ${images}`);
  console.log(`videos: ${videos}`);
  console.log(`missing: ${missing.length}`);
  console.log(`exact duplicate groups: ${duplicates.length}`);

  if (missing.length) {
    console.error("\nMissing sources:");
    for (const entry of missing) {
      console.error(`- ${entry.id}: ${entry.source}`);
      for (const attempt of entry.attempts) console.error(`    ${attempt}`);
    }
  }
}

async function copyEntry(entry, options) {
  const target = path.resolve(options.root, entry.targetFile);
  await mkdir(path.dirname(target), { recursive: true });

  if (entry.type === "image") {
    await sharp(entry.sourcePath)
      .rotate()
      .webp({ quality: options.quality, effort: 6, smartSubsample: true })
      .toFile(target);
  } else {
    await copyFile(entry.sourcePath, target);
  }

  const outputHash = await sha256File(target);
  return { ...entry, targetPath: target, outputHash };
}

function reportMarkdown(entries, duplicates) {
  const lines = [
    "# Media migration report",
    "",
    `Entries: ${entries.length}`,
    `Images: ${entries.filter((entry) => entry.type === "image").length}`,
    `Videos: ${entries.filter((entry) => entry.type === "video").length}`,
    `Exact duplicate groups: ${duplicates.length}`,
    "",
    "## Exact duplicates",
    "",
  ];

  if (!duplicates.length) lines.push("No exact duplicates found.");
  for (const duplicate of duplicates) {
    lines.push(`- ${duplicate.hash}`);
    duplicate.ids.forEach((id, index) => lines.push(`  - ${id}: ${duplicate.sources[index]}`));
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const map = await loadMap();
  const ids = new Set();

  for (const entry of map.entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate media id in map: ${entry.id}`);
    ids.add(entry.id);
  }

  const prepared = [];
  for (const entry of map.entries) prepared.push(await prepareEntry(entry, options));
  printSummary(prepared, options);

  const missing = prepared.filter((entry) => entry.error);
  if (missing.length) process.exitCode = 2;
  if (!options.apply || missing.length) return;

  const indexPath = path.resolve(options.root, options.index);
  if (!existsSync(indexPath)) throw new Error(`Index not found: ${indexPath}`);
  const originalHtml = await readFile(indexPath, "utf8");

  const migrated = [];
  for (const entry of prepared) migrated.push(await copyEntry(entry, options));

  const rewritten = rewriteProjectMedia(originalHtml, migrated);
  const backupPath = path.resolve(options.root, "index.before-media-migration.html");
  if (!existsSync(backupPath)) await writeFile(backupPath, originalHtml, "utf8");
  await writeFile(indexPath, rewritten, "utf8");

  const manifestPath = path.resolve(options.root, "public/media/media-manifest.json");
  const reportDirectory = path.resolve(options.root, "tools/media/reports");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await mkdir(reportDirectory, { recursive: true });

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries: migrated.map((entry) => ({
      id: entry.id,
      project: entry.project,
      container: entry.container,
      position: entry.position,
      type: entry.type,
      src: entry.targetUrl,
      width: entry.width,
      height: entry.height,
      ratio: entry.ratio,
      sourceOriginal: entry.source,
      sourcePath: entry.sourcePath,
      sourceHash: entry.sourceHash,
      outputHash: entry.outputHash,
    })),
  };

  const duplicates = groupDuplicateHashes(migrated);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(reportDirectory, "media-migration-report.json"),
    `${JSON.stringify({ duplicates }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(reportDirectory, "media-migration-report.md"),
    reportMarkdown(migrated, duplicates),
    "utf8",
  );

  console.log("\nMigration complete.");
  console.log(`backup: ${backupPath}`);
  console.log(`manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
