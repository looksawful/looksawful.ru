import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { findUnindexedVisibleCopy } from "./site-copy-coverage.mjs";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const root = new URL("../../", import.meta.url);
const indexPath = fileURLToPath(new URL(argumentValue("--index", "generated/site-copy/index.json"), root));
const renderedPath = fileURLToPath(new URL(argumentValue("--rendered", "generated/site-copy/rendered.json"), root));

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} is unavailable or invalid: ${path}\n${error.message}`);
  }
}

export async function checkSiteCopyCoverage({ indexFile = indexPath, renderedFile = renderedPath } = {}) {
  const [index, rendered] = await Promise.all([
    readJson(indexFile, "Site-copy index"),
    readJson(renderedFile, "Rendered-copy snapshot"),
  ]);

  const indexedEntries = Array.isArray(index) ? index : index.entries;
  const renderedEntries = Array.isArray(rendered) ? rendered : rendered.entries;

  if (!Array.isArray(indexedEntries)) throw new Error("Site-copy index must contain an entries array");
  if (!Array.isArray(renderedEntries)) throw new Error("Rendered-copy snapshot must contain an entries array");

  return findUnindexedVisibleCopy({ indexed: indexedEntries, rendered: renderedEntries });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const missing = await checkSiteCopyCoverage();
  if (!missing.length) {
    console.log("Rendered site copy is covered by the source index.");
  } else {
    console.error(`Found ${missing.length} rendered text location(s) outside the site-copy index:`);
    for (const entry of missing) {
      console.error(`- ${entry.route} [${entry.locale}] ${entry.locator ?? "unknown locator"}: ${entry.text}`);
    }
    process.exitCode = 1;
  }
}
