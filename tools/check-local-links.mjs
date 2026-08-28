import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  collectHtmlFiles,
  extractReferenceAttributes,
  hasAnchor,
  normalizeLocalReference,
  readUtf8,
  resolveLocalPath,
} from "./site-html-utils.mjs";

export async function checkLocalLinks({ distDir = "dist" } = {}) {
  const root = path.resolve(distDir);
  const htmlFiles = await collectHtmlFiles(root);
  const errors = [];
  const htmlCache = new Map();

  const readCached = async (filePath) => {
    if (!htmlCache.has(filePath)) htmlCache.set(filePath, await readUtf8(filePath));
    return htmlCache.get(filePath);
  };

  for (const sourceHtml of htmlFiles) {
    const html = await readCached(sourceHtml);
    const sourceLabel = path.relative(root, sourceHtml);

    for (const reference of extractReferenceAttributes(html)) {
      const normalized = normalizeLocalReference(reference.url, sourceHtml, root);
      if (!normalized) continue;

      const resolution = await resolveLocalPath(root, normalized.pathname);
      if (!resolution.found) {
        errors.push(`${sourceLabel} | ${reference.attribute} | ${reference.url} | expected ${path.relative(root, resolution.expected)}`);
        continue;
      }

      if (reference.attribute === "href" && normalized.hash && resolution.found.toLowerCase().endsWith(".html")) {
        const targetHtml = await readCached(resolution.found);
        if (!hasAnchor(targetHtml, normalized.hash)) {
          errors.push(`${sourceLabel} | href | ${reference.url} | missing anchor ${normalized.hash} in ${path.relative(root, resolution.found)}`);
        }
      }
    }
  }

  if (errors.length) {
    throw new Error(`broken local references:\n${errors.join("\n")}`);
  }

  return { htmlCount: htmlFiles.length };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  try {
    const result = await checkLocalLinks();
    console.log(`[local-links] ${result.htmlCount} HTML pages validated`);
  } catch (error) {
    console.error(`[local-links] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
