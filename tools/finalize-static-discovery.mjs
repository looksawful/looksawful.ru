import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  collectHtmlFiles,
  getCanonical,
  getMetaContent,
  getTitle,
  is404Html,
  isFixtureHtml,
  isNoIndex,
  parseAttributes,
} from "./site-html-utils.mjs";

const SITE_NAME = "looksawful";
const FAVICON = "/favicon.png";
const FAVICON_SVG = "/favicon.svg";
const APPLE_TOUCH_ICON = "/apple-touch-icon.png";
const MANIFEST = "/site.webmanifest";
const THEME_COLOR = "#ffffff";

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

function stripBrowserIdentity(html) {
  return html
    .replace(/\s*<link\b(?=[^>]*\brel=["']icon["'])[^>]*>/gi, "")
    .replace(/\s*<link\b(?=[^>]*\brel=["']apple-touch-icon["'])[^>]*>/gi, "")
    .replace(/\s*<link\b(?=[^>]*\brel=["']manifest["'])[^>]*>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/gi, "");
}

function browserIdentity() {
  return [
    `<link rel="icon" href="${FAVICON}" type="image/png" sizes="120x120">`,
    `<link rel="icon" href="${FAVICON_SVG}" type="image/svg+xml" sizes="any">`,
    `<link rel="apple-touch-icon" href="${APPLE_TOUCH_ICON}" sizes="180x180">`,
    `<link rel="manifest" href="${MANIFEST}">`,
    `<meta name="theme-color" content="${THEME_COLOR}">`,
  ];
}

export function finalizeStaticDiscoveryHtml(html, label = "HTML") {
  if (isNoIndex(html)) return html;

  const normalized = stripBrowserIdentity(html);
  const title = getTitle(normalized);
  const description = getMetaContent(normalized, "description");
  const canonical = getCanonical(normalized);
  const ogImage = getMetaContent(normalized, "og:image", "property");
  const locale = pageLocale(normalized, label);
  const additions = browserIdentity();

  if (!getMetaContent(normalized, "og:type", "property")) additions.push(metaProperty("og:type", "website"));
  if (!getMetaContent(normalized, "og:locale", "property")) additions.push(metaProperty("og:locale", locale));
  if (!getMetaContent(normalized, "og:site_name", "property")) additions.push(metaProperty("og:site_name", SITE_NAME));
  if (!getMetaContent(normalized, "og:title", "property") && title) additions.push(metaProperty("og:title", title));
  if (!getMetaContent(normalized, "og:description", "property") && description) additions.push(metaProperty("og:description", description));
  if (!getMetaContent(normalized, "og:url", "property") && canonical) additions.push(metaProperty("og:url", canonical));

  const twitterCard = ogImage ? "summary_large_image" : "summary";
  if (!getMetaContent(normalized, "twitter:card")) additions.push(metaName("twitter:card", twitterCard));
  if (!getMetaContent(normalized, "twitter:title") && title) additions.push(metaName("twitter:title", title));
  if (!getMetaContent(normalized, "twitter:description") && description) additions.push(metaName("twitter:description", description));
  if (!getMetaContent(normalized, "twitter:image") && ogImage) additions.push(metaName("twitter:image", ogImage));

  if (!/<\/head>/i.test(normalized)) throw new Error(`${label}: missing </head>`);
  return normalized.replace(/<\/head>/i, `${additions.join("\n")}\n</head>`);
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
