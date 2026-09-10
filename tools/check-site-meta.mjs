import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  SITE_ORIGIN,
  collectHtmlFiles,
  decodeEntities,
  extractJsonLdBlocks,
  getCanonical,
  getLinkHref,
  getMetaContent,
  getRobots,
  getTitle,
  is404Html,
  isFixtureHtml,
  isNoIndex,
  parseAttributes,
  readUtf8,
  validateCanonical,
} from "./site-html-utils.mjs";

const EXPECTED_ROBOTS = "index,follow,max-image-preview:large";
const EXPECTED_FAVICON = "/favicon.png";
const EXPECTED_FAVICON_TYPE = "image/png";
const EXPECTED_FAVICON_SIZES = "120x120";
const EXPECTED_APPLE_TOUCH_ICON = "/apple-touch-icon.png";
const EXPECTED_APPLE_TOUCH_ICON_SIZES = "180x180";
const EXPECTED_MANIFEST = "/site.webmanifest";
const EXPECTED_THEME_COLOR = "#ffffff";
const EXPECTED_OG_SITE_NAME = "looksawful";
const EXPECTED_OG_TYPE = "website";

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
    decodeEntities(match[1]).trim(),
  );
}

function expectedLocale(html, label) {
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];
  const lang = htmlTag ? (parseAttributes(htmlTag).lang ?? "").toLowerCase() : "";
  if (lang === "ru" || lang.startsWith("ru-")) return "ru_RU";
  if (lang === "en" || lang.startsWith("en-")) return "en_US";
  throw new Error(`${label}: unsupported or missing html lang for og:locale`);
}

function getLinkAttributes(html, rel, href) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.rel ?? "").toLowerCase() !== rel) continue;
    if (href && attributes.href !== href) continue;
    return attributes;
  }
  return null;
}

async function validateOwnAssetUrl(value, distDir, label, kind) {
  let url;
  try {
    url = new URL(value, SITE_ORIGIN);
  } catch {
    throw new Error(`${label}: ${kind} has invalid URL: ${value}`);
  }
  if (url.origin !== SITE_ORIGIN) throw new Error(`${label}: ${kind} must use ${SITE_ORIGIN}: ${value}`);
  const assetPath = path.join(distDir, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
  const info = await stat(assetPath).catch(() => null);
  if (!info?.isFile()) throw new Error(`${label}: ${kind} asset does not exist: ${assetPath}`);
  return assetPath;
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
  await validateOwnAssetUrl(value, distDir, label, "og:image");
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
    const favicon = getLinkHref(html, "icon");
    const faviconAttributes = getLinkAttributes(html, "icon", EXPECTED_FAVICON);
    const appleTouchIcon = getLinkHref(html, "apple-touch-icon");
    const appleTouchIconAttributes = getLinkAttributes(html, "apple-touch-icon", EXPECTED_APPLE_TOUCH_ICON);
    const manifest = getLinkHref(html, "manifest");
    const themeColor = getMetaContent(html, "theme-color");
    const ogType = getMetaContent(html, "og:type", "property");
    const ogLocale = getMetaContent(html, "og:locale", "property");
    const ogSiteName = getMetaContent(html, "og:site_name", "property");
    const ogTitle = getMetaContent(html, "og:title", "property");
    const ogDescription = getMetaContent(html, "og:description", "property");
    const ogUrl = getMetaContent(html, "og:url", "property");
    const ogImage = getMetaContent(html, "og:image", "property");
    const twitterCard = getMetaContent(html, "twitter:card");
    const twitterTitle = getMetaContent(html, "twitter:title");
    const twitterDescription = getMetaContent(html, "twitter:description");
    const twitterImage = getMetaContent(html, "twitter:image");

    let locale = null;
    try { locale = expectedLocale(html, label); } catch (error) { errors.push(error.message); }

    if (!title?.trim()) errors.push(`${label}: missing or empty title`);
    if (!description?.trim()) errors.push(`${label}: missing or empty description`);
    if (!robots?.trim()) errors.push(`${label}: missing meta robots`);
    else if (robots.replace(/\s+/g, "").toLowerCase() !== EXPECTED_ROBOTS) {
      errors.push(`${label}: robots must be ${EXPECTED_ROBOTS}`);
    }

    if (favicon !== EXPECTED_FAVICON) {
      errors.push(`${label}: favicon must be ${EXPECTED_FAVICON}`);
    } else {
      if (faviconAttributes?.type !== EXPECTED_FAVICON_TYPE) {
        errors.push(`${label}: favicon type must be ${EXPECTED_FAVICON_TYPE}`);
      }
      if (faviconAttributes?.sizes !== EXPECTED_FAVICON_SIZES) {
        errors.push(`${label}: favicon sizes must be ${EXPECTED_FAVICON_SIZES}`);
      }
      try { await validateOwnAssetUrl(favicon, root, label, "favicon"); } catch (error) { errors.push(error.message); }
    }

    if (appleTouchIcon !== EXPECTED_APPLE_TOUCH_ICON) {
      errors.push(`${label}: apple-touch-icon must be ${EXPECTED_APPLE_TOUCH_ICON}`);
    } else {
      if (appleTouchIconAttributes?.sizes !== EXPECTED_APPLE_TOUCH_ICON_SIZES) {
        errors.push(`${label}: apple-touch-icon sizes must be ${EXPECTED_APPLE_TOUCH_ICON_SIZES}`);
      }
      try { await validateOwnAssetUrl(appleTouchIcon, root, label, "apple-touch-icon"); } catch (error) { errors.push(error.message); }
    }

    if (manifest !== EXPECTED_MANIFEST) {
      errors.push(`${label}: manifest must be ${EXPECTED_MANIFEST}`);
    } else {
      try { await validateOwnAssetUrl(manifest, root, label, "manifest"); } catch (error) { errors.push(error.message); }
    }

    if (themeColor !== EXPECTED_THEME_COLOR) {
      errors.push(`${label}: theme-color must be ${EXPECTED_THEME_COLOR}`);
    }

    if (ogType !== EXPECTED_OG_TYPE) errors.push(`${label}: og:type must be ${EXPECTED_OG_TYPE}`);
    if (locale && ogLocale !== locale) errors.push(`${label}: og:locale must be ${locale}`);
    if (ogSiteName !== EXPECTED_OG_SITE_NAME) errors.push(`${label}: og:site_name must be ${EXPECTED_OG_SITE_NAME}`);
    if (!ogTitle?.trim()) errors.push(`${label}: missing og:title`);
    if (!ogDescription?.trim()) errors.push(`${label}: missing og:description`);
    if (!ogUrl?.trim()) errors.push(`${label}: missing og:url`);

    const expectedTwitterCard = ogImage ? "summary_large_image" : "summary";
    if (twitterCard !== expectedTwitterCard) errors.push(`${label}: twitter:card must be ${expectedTwitterCard}`);
    if (!twitterTitle?.trim()) errors.push(`${label}: missing twitter:title`);
    if (!twitterDescription?.trim()) errors.push(`${label}: missing twitter:description`);
    if (ogImage && !twitterImage?.trim()) errors.push(`${label}: missing twitter:image`);

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
    if (twitterTitle && title && twitterTitle.trim() !== title.trim()) errors.push(`${label}: twitter:title must equal title`);
    if (twitterDescription && description && twitterDescription !== description) errors.push(`${label}: twitter:description must equal description`);
    if (twitterImage && ogImage && twitterImage !== ogImage) errors.push(`${label}: twitter:image must equal og:image`);
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

  const manifestPath = path.join(root, "site.webmanifest");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.theme_color !== EXPECTED_THEME_COLOR) {
      errors.push(`site.webmanifest: theme_color must be ${EXPECTED_THEME_COLOR}`);
    }
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const favicon = icons.find((icon) => icon?.src === EXPECTED_FAVICON);
    if (!favicon) {
      errors.push(`site.webmanifest: missing ${EXPECTED_FAVICON} icon`);
    } else {
      if (favicon.type !== EXPECTED_FAVICON_TYPE) errors.push(`site.webmanifest: favicon type must be ${EXPECTED_FAVICON_TYPE}`);
      if (favicon.sizes !== EXPECTED_FAVICON_SIZES) errors.push(`site.webmanifest: favicon sizes must be ${EXPECTED_FAVICON_SIZES}`);
    }
  } catch (error) {
    errors.push(`site.webmanifest: ${error instanceof Error ? error.message : String(error)}`);
  }

  const robotsPath = path.join(root, "robots.txt");
  const sitemapPath = path.join(root, "sitemap.xml");
  let robotsText = "";
  let sitemapText = "";
  try { robotsText = await readFile(robotsPath, "utf8"); } catch { errors.push("missing robots.txt"); }
  if (robotsText && !robotsText.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) errors.push("robots.txt: missing production sitemap declaration");
  try { sitemapText = await readFile(sitemapPath, "utf8"); } catch { errors.push("missing sitemap.xml"); }

  if (sitemapText) {
    const sitemapLocs = parseSitemapLocs(sitemapText);
    const sitemapUrls = new Set();
    for (const loc of sitemapLocs) {
      let url;
      try { url = new URL(loc); } catch { errors.push(`sitemap: invalid URL ${loc}`); continue; }
      if (url.origin !== SITE_ORIGIN) errors.push(`sitemap: URL has wrong origin ${loc}`);
      if (noindexCanonicals.has(loc)) errors.push(`sitemap: noindex URL included ${loc}`);
      sitemapUrls.add(url.href);
    }

    if (/<urlset\b/i.test(sitemapText)) {
      for (const canonical of canonicals.keys()) {
        if (!sitemapUrls.has(canonical)) errors.push(`sitemap: missing indexable canonical ${canonical}`);
      }
      for (const sitemapUrl of sitemapUrls) {
        if (!canonicals.has(sitemapUrl)) errors.push(`sitemap: URL has no indexable canonical ${sitemapUrl}`);
      }
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
