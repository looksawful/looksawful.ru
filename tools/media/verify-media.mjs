#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sha256File } from "./media-core.mjs";

function parseArguments(argv) {
  const options = { root: process.cwd(), index: "index.html" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") options.root = argv[++index];
    else if (argument === "--index") options.index = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  options.root = path.resolve(options.root);
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifestPath = path.resolve(options.root, "public/media/media-manifest.json");
  const indexPath = path.resolve(options.root, options.index);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const html = await readFile(indexPath, "utf8");
  const errors = [];
  const ids = new Set();
  const urls = new Set();

  for (const entry of manifest.entries) {
    if (ids.has(entry.id)) errors.push(`duplicate id: ${entry.id}`);
    ids.add(entry.id);
    if (urls.has(entry.src)) errors.push(`duplicate target url: ${entry.src}`);
    urls.add(entry.src);

    const targetPath = path.resolve(options.root, "public", entry.src.replace(/^\.\/media\//, "media/"));
    if (!existsSync(targetPath)) errors.push(`missing target: ${entry.id} -> ${targetPath}`);
    if (!html.includes(`data-media-id="${entry.id}"`)) errors.push(`id absent from html: ${entry.id}`);
    if (!html.includes(`src="${entry.src}"`)) errors.push(`src absent from html: ${entry.id}`);

    if (!existsSync(entry.sourcePath)) {
      errors.push(`original source missing: ${entry.id} -> ${entry.sourcePath}`);
    } else {
      const currentHash = await sha256File(entry.sourcePath);
      if (currentHash !== entry.sourceHash) errors.push(`original source changed: ${entry.id}`);
    }
  }

  const legacyProjectPath = /src=["'](?:\.\/)?(?:MEDIA-TEMP\/|assets\/media\/cases\/)/i;
  if (legacyProjectPath.test(html)) {
    errors.push("index.html still contains legacy project media paths");
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`verified ${manifest.entries.length} media entries`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
