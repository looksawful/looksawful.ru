import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sitePages } from "../src/site/pages/manifest.ts";
import {
  SITE_ORIGIN,
  collectHtmlFiles,
  getCanonical,
  is404Html,
  isFixtureHtml,
  isNoIndex,
  readUtf8,
  validateCanonical,
  xmlEscape,
} from "./site-html-utils.mjs";

export const MAX_URLS_PER_SITEMAP = 45_000;

export function renderUrlset(urls) {
  const body = urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body ? `\n${body}\n` : "\n"}</urlset>\n`;
}

export function renderSitemapIndex(fileNames) {
  const body = fileNames
    .map((fileName) => `  <sitemap><loc>${xmlEscape(`${SITE_ORIGIN}/${fileName}`)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function buildSitemapFiles(urls, maxUrls = MAX_URLS_PER_SITEMAP) {
  if (!Number.isInteger(maxUrls) || maxUrls < 1) {
    throw new Error("maxUrls must be a positive integer");
  }

  if (urls.length <= maxUrls) {
    return new Map([["sitemap.xml", renderUrlset(urls)]]);
  }

  const chunks = [];
  for (let offset = 0; offset < urls.length; offset += maxUrls) {
    chunks.push(urls.slice(offset, offset + maxUrls));
  }

  const files = new Map();
  const chunkNames = chunks.map((_, index) => `sitemap-${index + 1}.xml`);
  files.set("sitemap.xml", renderSitemapIndex(chunkNames));
  chunks.forEach((chunk, index) => files.set(chunkNames[index], renderUrlset(chunk)));
  return files;
}

export function collectManifestIndexableCanonicals(pages = sitePages) {
  const canonicals = [];
  const seen = new Set();

  for (const page of pages) {
    if (!page.enabled || !page.discovery.indexable) continue;

    const url = new URL(page.path, `${SITE_ORIGIN}/`);
    if (url.origin !== SITE_ORIGIN || url.search || url.hash) {
      throw new Error(`invalid indexable SitePage canonical path: ${page.path}`);
    }

    const canonical = url.href;
    if (seen.has(canonical)) {
      throw new Error(`duplicate indexable SitePage canonical: ${canonical}`);
    }
    seen.add(canonical);
    canonicals.push(canonical);
  }

  canonicals.sort((a, b) => a.localeCompare(b));
  return canonicals;
}

export async function collectIndexableCanonicals(distDir) {
  const htmlFiles = await collectHtmlFiles(distDir);
  const canonicals = [];
  const seen = new Map();

  for (const filePath of htmlFiles) {
    if (is404Html(filePath) || isFixtureHtml(filePath, distDir)) continue;
    const html = await readUtf8(filePath);
    if (isNoIndex(html)) continue;

    const relative = path.relative(distDir, filePath);
    const canonical = validateCanonical(getCanonical(html), relative);
    const previous = seen.get(canonical);
    if (previous) {
      throw new Error(`duplicate canonical ${canonical}: ${previous} and ${relative}`);
    }
    seen.set(canonical, relative);
    canonicals.push(canonical);
  }

  canonicals.sort((a, b) => a.localeCompare(b));
  return canonicals;
}

export async function validateBuiltIndexableCanonicals(distDir, pages = sitePages) {
  const expected = collectManifestIndexableCanonicals(pages);
  const actual = await collectIndexableCanonicals(distDir);
  const actualSet = new Set(actual);

  for (const canonical of expected) {
    if (!actualSet.has(canonical)) {
      throw new Error(`missing indexable canonical in built output: ${canonical}`);
    }
  }

  return expected;
}

async function removeGeneratedSitemaps(outputDir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(outputDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /^sitemap(?:-\d+)?\.xml$/i.test(entry.name))
      .map((entry) => rm(path.join(outputDir, entry.name), { force: true })),
  );
}

export async function generateSitemaps({ distDir = "dist", outputDir = distDir } = {}) {
  const absoluteDist = path.resolve(distDir);
  const absoluteOutput = path.resolve(outputDir);
  const urls = await validateBuiltIndexableCanonicals(absoluteDist);
  const files = buildSitemapFiles(urls);

  await mkdir(absoluteOutput, { recursive: true });
  await removeGeneratedSitemaps(absoluteOutput);
  await Promise.all(
    [...files].map(([fileName, xml]) => writeFile(path.join(absoluteOutput, fileName), xml, "utf8")),
  );

  return { urls, files: [...files.keys()] };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  try {
    const result = await generateSitemaps();
    console.log(`[sitemap] ${result.urls.length} URLs -> ${result.files.join(", ")}`);
  } catch (error) {
    console.error(`[sitemap] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
