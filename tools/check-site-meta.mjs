import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  SITE_ORIGIN,
  collectHtmlFiles,
  extractJsonLdBlocks,
  getCanonical,
  getMetaContent,
  getRobots,
  getTitle,
  is404Html,
  isFixtureHtml,
  isNoIndex,
  readUtf8,
  validateCanonical,
} from "./site-html-utils.mjs";

const EXPECTED_ROBOTS = "index,follow,max-image-preview:large";

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
      .trim(),
  );
}

async function validateOwnOgImage(value, distDir, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label}: og:image must be an absolute URL: ${value}`);
  }
  if (url.protocol !== "https:") throw new Error(`${label}: og:image must use https: ${value}`);
  if (!new Set(["looksawful.ru", "www.looksawful.ru"]).has(url.hostname)) {
    throw new Error(`${label}: og:image host is not looksawful.ru: ${value}`);
  }
  const assetPath = path.join(distDir, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
  const info = await stat(assetPath).catch(() => null);
  if (!info?.isFile()) throw new Error(`${label}: og:image asset does not exist: ${assetPath}`);
}

export async function validateSite({ distDir = "dist" } = {}) {
  const root = path.resolve(distDir);
  const errors = [];
  const warnings = [];
  const canonicals = new Map();
  const titles = new Map();
  const noindexCanonicals = new Set();
  const htmlFiles = await collectHtmlFiles(root);

  for (const filePath of htmlFiles) {
    if (is404Html(filePath) || isFixtureHtml(filePath, root)) continue;
    const label = path.relative(root, filePath);
    const html = await readUtf8(filePath);
    const noindex = isNoIndex(html);
    const canonicalRaw = getCanonical(html);

    if (noindex) {
      if (canonicalRaw) {
        try { noindexCanonicals.add(validateCanonical(canonicalRaw, label)); } catch (error) { errors.push(error.message); }
      }
      continue;
    }

    const title = getTitle(html);
    const description = getMetaContent(html, "description");
    const robots = getRobots(html);
    const ogTitle = getMetaContent(html, "og:title", "property");
    const ogDescription = getMetaContent(html, "og:description", "property");
    const ogUrl = getMetaContent(html, "og:url", "property");
    const ogImage = getMetaContent(html, "og:image", "property");

    if (!title?.trim()) errors.push(`${label}: missing or empty title`);
    if (!description?.trim()) errors.push(`${label}: missing or empty description`);
    if (!robots?.trim()) errors.push(`${label}: missing meta robots`);
    else if (robots.replace(/\s+/g, "").toLowerCase() !== EXPECTED_ROBOTS) {
      errors.push(`${label}: robots must be ${EXPECTED_ROBOTS}`);
    }
    if (!ogTitle?.trim()) errors.push(`${label}: missing og:title`);
    if (!ogDescription?.trim()) errors.push(`${label}: missing og:description`);
    if (!ogUrl?.trim()) errors.push(`${label}: missing og:url`);

    let canonical = null;
    try {
      canonical = validateCanonical(canonicalRaw, label);
      const prior = canonicals.get(canonical);
      if (prior) errors.push(`duplicate canonical ${canonical}: ${prior} and ${label}`);
      else canonicals.set(canonical, label);
    } catch (error) {
      errors.push(error.message);
    }

    if (canonical && ogUrl && ogUrl !== canonical) errors.push(`${label}: og:url must equal canonical`);
    if (ogTitle && title && ogTitle.trim() !== title.trim()) errors.push(`${label}: og:title must equal title`);
    if (ogDescription && description && ogDescription !== description) errors.push(`${label}: og:description must equal description`);
    if (ogImage) {
      try { await validateOwnOgImage(ogImage, root, label); } catch (error) { errors.push(error.message); }
    }

    if (title) {
      const normalized = title.replace(/\s+/g, " ").trim();
      const prior = titles.get(normalized);
      if (prior) warnings.push(`duplicate title "${normalized}": ${prior} and ${label}`);
      else titles.set(normalized, label);
    }

    if (label.split(path.sep).join("/") === "index.html") {
      const blocks = extractJsonLdBlocks(html);
      if (blocks.length === 0) errors.push("index.html: missing JSON-LD");
      let types = [];
      for (const block of blocks) {
        try {
          const parsed = JSON.parse(block);
          const items = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
          types.push(...items.map((item) => item?.["@type"]).filter(Boolean));
        } catch {
          errors.push("index.html: invalid JSON-LD");
        }
      }
      if (!types.includes("WebSite")) errors.push("index.html: JSON-LD missing WebSite");
      if (!types.includes("Person")) errors.push("index.html: JSON-LD missing Person");
    }
  }

  const robotsPath = path.join(root, "robots.txt");
  const sitemapPath = path.join(root, "sitemap.xml");
  let robotsText = "";
  let sitemapText = "";
  try { robotsText = await readFile(robotsPath, "utf8"); } catch { errors.push("missing robots.txt"); }
  if (robotsText && !robotsText.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) errors.push("robots.txt: missing production sitemap declaration");
  try { sitemapText = await readFile(sitemapPath, "utf8"); } catch { errors.push("missing sitemap.xml"); }

  if (sitemapText) {
    for (const loc of parseSitemapLocs(sitemapText)) {
      let url;
      try { url = new URL(loc); } catch { errors.push(`sitemap: invalid URL ${loc}`); continue; }
      if (url.origin !== SITE_ORIGIN) errors.push(`sitemap: URL has wrong origin ${loc}`);
      if (noindexCanonicals.has(loc)) errors.push(`sitemap: noindex URL included ${loc}`);
    }
  }

  warnings.forEach((warning) => console.warn(`[site-meta] warning: ${warning}`));
  if (errors.length) throw new Error(errors.join("\n"));
  return { htmlCount: htmlFiles.length, indexableCount: canonicals.size, warnings };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  try {
    const result = await validateSite();
    console.log(`[site-meta] ${result.indexableCount} indexable HTML pages validated`);
  } catch (error) {
    console.error(`[site-meta] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
