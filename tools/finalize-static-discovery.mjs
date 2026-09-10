import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  collectHtmlFiles,
  getCanonical,
  getLinkHref,
  getMetaContent,
  getTitle,
  is404Html,
  isFixtureHtml,
  isNoIndex,
  parseAttributes,
} from "./site-html-utils.mjs";

const SITE_NAME = "looksawful";
const FAVICON = "/favicon.png";
const FALLBACK_FAVICON = "/favicon.svg";
const APPLE_TOUCH_ICON = "/apple-touch-icon.png";
const THEME_COLOR = "#ffffff";
const MANIFEST = "/site.webmanifest";

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pageLocale(html, label) {
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];
  const lang = htmlTag ? (parseAttributes(htmlTag).lang ?? "").toLowerCase() : "";
  if (lang === "ru" || lang.startsWith("ru-")) return "ru_RU";
  if (lang === "en" || lang.startsWith("en-")) return "en_US";
  throw new Error(`${label}: unsupported or missing html lang`);
}

function metaProperty(property, content) {
  return `<meta property="${property}" content="${escapeAttribute(content)}">`;
}

function metaName(name, content) {
  return `<meta name="${name}" content="${escapeAttribute(content)}">`;
}

function normalizeLegacyFavicon(html) {
  if (getLinkHref(html, "icon") !== FALLBACK_FAVICON) return html;
  return html.replace(
    /<link\b(?=[^>]*\brel=["'](?:shortcut )?icon["'])(?=[^>]*\bhref=["']\/favicon\.svg["'])[^>]*>/i,
    `<link rel="icon" href="${FAVICON}" type="image/png" sizes="120x120">\n<link rel="icon" href="${FALLBACK_FAVICON}" type="image/svg+xml" sizes="any">`,
  );
}

export function finalizeStaticDiscoveryHtml(html, label = "HTML") {
  if (isNoIndex(html)) return html;

  let output = normalizeLegacyFavicon(html);
  const title = getTitle(output);
  const description = getMetaContent(output, "description");
  const canonical = getCanonical(output);
  const ogImage = getMetaContent(output, "og:image", "property");
  const locale = pageLocale(output, label);
  const additions = [];

  if (!getLinkHref(output, "icon")) {
    additions.push(`<link rel="icon" href="${FAVICON}" type="image/png" sizes="120x120">`);
    additions.push(`<link rel="icon" href="${FALLBACK_FAVICON}" type="image/svg+xml" sizes="any">`);
  }
  if (!getLinkHref(output, "apple-touch-icon")) {
    additions.push(`<link rel="apple-touch-icon" href="${APPLE_TOUCH_ICON}" sizes="180x180">`);
  }
  if (!getMetaContent(output, "theme-color")) {
    additions.push(metaName("theme-color", THEME_COLOR));
  }
  if (!getLinkHref(output, "manifest")) {
    additions.push(`<link rel="manifest" href="${MANIFEST}">`);
  }
  if (!getMetaContent(output, "og:type", "property")) additions.push(metaProperty("og:type", "website"));
  if (!getMetaContent(output, "og:locale", "property")) additions.push(metaProperty("og:locale", locale));
  if (!getMetaContent(output, "og:site_name", "property")) additions.push(metaProperty("og:site_name", SITE_NAME));
  if (!getMetaContent(output, "og:title", "property") && title) additions.push(metaProperty("og:title", title));
  if (!getMetaContent(output, "og:description", "property") && description) additions.push(metaProperty("og:description", description));
  if (!getMetaContent(output, "og:url", "property") && canonical) additions.push(metaProperty("og:url", canonical));

  const twitterCard = ogImage ? "summary_large_image" : "summary";
  if (!getMetaContent(output, "twitter:card")) additions.push(metaName("twitter:card", twitterCard));
  if (!getMetaContent(output, "twitter:title") && title) additions.push(metaName("twitter:title", title));
  if (!getMetaContent(output, "twitter:description") && description) additions.push(metaName("twitter:description", description));
  if (!getMetaContent(output, "twitter:image") && ogImage) additions.push(metaName("twitter:image", ogImage));

  if (additions.length === 0) return output;
  if (!/<\/head>/i.test(output)) throw new Error(`${label}: missing </head>`);
  output = output.replace(/<\/head>/i, `${additions.join("\n")}\n</head>`);
  return output;
}

export async function finalizeStaticDiscovery({ distDir = "dist" } = {}) {
  const root = path.resolve(distDir);
  const htmlFiles = await collectHtmlFiles(root);
  const changed = [];

  for (const filePath of htmlFiles) {
    if (is404Html(filePath) || isFixtureHtml(filePath, root)) continue;
    const label = path.relative(root, filePath).split(path.sep).join("/");
    const html = await readFile(filePath, "utf8");
    const finalized = finalizeStaticDiscoveryHtml(html, label);
    if (finalized === html) continue;
    await writeFile(filePath, finalized, "utf8");
    changed.push(label);
  }

  return changed;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  try {
    const changed = await finalizeStaticDiscovery();
    console.log(`[static-discovery] normalized ${changed.length} HTML page${changed.length === 1 ? "" : "s"}`);
  } catch (error) {
    console.error(`[static-discovery] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}