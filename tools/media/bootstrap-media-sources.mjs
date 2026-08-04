#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  extractManagedMediaTags,
  normalizeHtmlPath,
  parseAssetName,
  parseMediaId,
  sha256File,
  sourcePathFromHtml,
  stableJson,
} from "./media-system-core.mjs";
import { MEDIA_PATHS } from "./media.config.mjs";

function parseArguments(argv) {
  const options = {
    root: process.cwd(),
    apply: false,
    overwrite: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") options.root = argv[++index];
    else if (argument === "--apply") options.apply = true;
    else if (argument === "--overwrite") options.overwrite = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  options.root = path.resolve(options.root);
  return options;
}

function destinationFor(projectRoot, id, sourceFilename) {
  const { project, container, position } = parseMediaId(id);
  const sourceAsset = parseAssetName(sourceFilename);

  if (sourceAsset.position !== position) {
    throw new Error(
      `Media id and filename position disagree: ${id} -> ${sourceFilename}`,
    );
  }

  return path.resolve(
    projectRoot,
    MEDIA_PATHS.sources,
    project,
    container,
    sourceFilename,
  );
}

async function fileHashIfExists(filename) {
  if (!existsSync(filename)) return null;
  return sha256File(filename);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const indexPath = path.resolve(options.root, MEDIA_PATHS.index);
  const html = await readFile(indexPath, "utf8");
  const records = extractManagedMediaTags(html);

  if (!records.length) {
    throw new Error("No media tags with data-media-id were found in index.html.");
  }

  const ids = new Set();
  const plan = [];
  const missing = [];

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate data-media-id in index.html: ${record.id}`);
    }

    ids.add(record.id);

    const normalizedSrc = normalizeHtmlPath(record.src);
    const sourcePath = sourcePathFromHtml({
      projectRoot: options.root,
      src: normalizedSrc,
    });

    if (!existsSync(sourcePath)) {
      missing.push({
        id: record.id,
        src: record.src,
        sourcePath,
      });
      continue;
    }

    const sourceFilename = path.basename(sourcePath);
    const targetPath = destinationFor(
      options.root,
      record.id,
      sourceFilename,
    );

    const sourceHash = await sha256File(sourcePath);
    const targetHash = await fileHashIfExists(targetPath);
    const action = targetHash === sourceHash
      ? "skip"
      : targetHash && !options.overwrite
        ? "conflict"
        : "copy";

    plan.push({
      id: record.id,
      type: record.type,
      source: record.src,
      sourcePath,
      targetPath,
      sourceHash,
      targetHash,
      action,
    });
  }

  const conflicts = plan.filter((entry) => entry.action === "conflict");

  console.log(`media bootstrap: ${records.length} HTML records`);
  console.log(`copy: ${plan.filter((entry) => entry.action === "copy").length}`);
  console.log(`skip: ${plan.filter((entry) => entry.action === "skip").length}`);
  console.log(`conflict: ${conflicts.length}`);
  console.log(`missing: ${missing.length}`);

  if (missing.length) {
    for (const entry of missing) {
      console.error(`missing ${entry.id}: ${entry.sourcePath}`);
    }
  }

  if (conflicts.length) {
    for (const entry of conflicts) {
      console.error(`conflict ${entry.id}: ${entry.targetPath}`);
    }
  }

  const reportPath = path.resolve(
    options.root,
    MEDIA_PATHS.reports,
    "bootstrap.json",
  );

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply to copy canonical originals.");
    if (missing.length || conflicts.length) process.exitCode = 2;
    return;
  }

  if (missing.length || conflicts.length) {
    throw new Error(
      "Bootstrap stopped because sources are missing or canonical targets conflict.",
    );
  }

  for (const entry of plan) {
    if (entry.action !== "copy") continue;

    await mkdir(path.dirname(entry.targetPath), { recursive: true });
    await copyFile(entry.sourcePath, entry.targetPath);
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    stableJson({
      version: 1,
      generatedAt: new Date().toISOString(),
      entries: plan.map((entry) => ({
        id: entry.id,
        source: entry.source,
        sourcePath: entry.sourcePath,
        targetPath: entry.targetPath,
        sourceHash: entry.sourceHash,
        action: entry.action,
      })),
    }),
    "utf8",
  );

  console.log(`Canonical originals ready: ${MEDIA_PATHS.sources}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
