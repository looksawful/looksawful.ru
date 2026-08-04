#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  collectCanonicalAssets,
  duplicateGroups,
  extractManagedMediaTags,
  ratioToken,
  sha256File,
} from "./media-system-core.mjs";
import { MEDIA_PATHS } from "./media.config.mjs";
import sharp from "sharp";

function parseArguments(argv) {
  const options = {
    root: process.cwd(),
    mode: "build",
    dist: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") options.root = argv[++index];
    else if (argument === "--mode") options.mode = argv[++index];
    else if (argument === "--dist") options.dist = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!["build", "strict"].includes(options.mode)) {
    throw new Error(`Unknown verification mode: ${options.mode}`);
  }

  options.root = path.resolve(options.root);
  return options;
}

function publicPathFromUrl(projectRoot, url, dist = false) {
  const normalized = String(url ?? "")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");

  return dist
    ? path.resolve(projectRoot, "dist", normalized)
    : path.resolve(projectRoot, "public", normalized);
}

function entryOutputUrls(entry) {
  const urls = new Set();

  for (const key of ["default", "fallback", "thumbnail", "fullscreen", "poster"]) {
    if (entry[key]?.src) urls.add(entry[key].src);
  }

  for (const variant of entry.srcset ?? []) {
    if (variant?.src) urls.add(variant.src);
  }

  for (const source of entry.sources ?? []) {
    if (source?.src) urls.add(source.src);
  }

  return [...urls];
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifestPath = path.resolve(
    options.root,
    MEDIA_PATHS.manifestJson,
  );
  const indexPath = path.resolve(options.root, MEDIA_PATHS.index);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entries = manifest.entries ?? {};
  const errors = [];
  const warnings = [];
  const ids = Object.keys(entries);

  if (!ids.length) {
    errors.push("Generated media manifest has no entries.");
  }

  if (options.dist) {
    for (const entry of Object.values(entries)) {
      for (const url of entryOutputUrls(entry)) {
        const filename = publicPathFromUrl(options.root, url, true);
        if (!existsSync(filename)) {
          errors.push(`dist output missing: ${entry.id} -> ${filename}`);
        }
      }
    }
  } else {
    const assets = await collectCanonicalAssets(options.root);
    const canonicalIds = new Set(assets.map((asset) => asset.id));

    for (const asset of assets) {
      const entry = entries[asset.id];

      if (!entry) {
        errors.push(`manifest entry missing: ${asset.id}`);
        continue;
      }

      if (entry.source !== `${MEDIA_PATHS.sources}/${asset.relativePath}`) {
        errors.push(`manifest source mismatch: ${asset.id}`);
      }

      if (asset.type === "image") {
        const metadata = await sharp(asset.absolute).metadata();
        const width = metadata.width;
        const height = metadata.height;

        if (!width || !height) {
          errors.push(`could not read dimensions: ${asset.relativePath}`);
        } else {
          const actual = ratioToken(width, height);
          if (actual !== asset.ratio) {
            errors.push(
              `ratio mismatch: ${asset.relativePath}, filename=${asset.ratio}, actual=${actual}`,
            );
          }
        }
      }

      if (options.mode === "strict") {
        const hash = await sha256File(asset.absolute);
        if (hash !== entry.sourceHash) {
          errors.push(`source hash mismatch: ${asset.id}`);
        }
      }

      for (const url of entryOutputUrls(entry)) {
        const filename = publicPathFromUrl(options.root, url, false);
        if (!existsSync(filename)) {
          errors.push(`generated output missing: ${asset.id} -> ${filename}`);
        }
      }
    }

    for (const id of ids) {
      if (!canonicalIds.has(id)) {
        errors.push(`manifest contains removed canonical asset: ${id}`);
      }
    }

    const html = await readFile(indexPath, "utf8");
    const records = extractManagedMediaTags(html);
    const htmlIds = new Set();

    for (const record of records) {
      if (htmlIds.has(record.id)) {
        errors.push(`duplicate data-media-id in index.html: ${record.id}`);
      }

      htmlIds.add(record.id);

      if (!entries[record.id]) {
        errors.push(`unknown data-media-id in index.html: ${record.id}`);
      }
    }

    if (/MEDIA-TEMP[\\/]/i.test(html)) {
      errors.push("index.html contains MEDIA-TEMP media paths.");
    }

    if (/(?:src|poster)\s*=\s*["'][a-z]:[\\/]/i.test(html)) {
      errors.push("index.html contains an absolute Windows media path.");
    }

    if (/media\/projects\/[^"'<>]+\/source\//i.test(html)) {
      errors.push("index.html still references the legacy /source/ media structure.");
    }

    const duplicates = duplicateGroups(Object.values(entries));

    if (duplicates.length) {
      const message = `${duplicates.length} exact duplicate media group(s) detected.`;

      if (options.mode === "strict") errors.push(message);
      else warnings.push(message);
    }
  }

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  if (errors.length) {
    for (const error of errors) {
      console.error(`error: ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `verified ${ids.length} media entries (${options.dist ? "dist" : options.mode})`,
  );
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
