import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

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
const SEARCH_FAVICON = "/favicon-48.png";
const SVG_FAVICON = "/favicon.svg";
const APPLE_TOUCH_ICON = "/apple-touch-icon.png";
const SITE_MANIFEST = "/site.webmanifest";
const THEME_COLOR = "#f9f9f9";
const GENERATED_ICONS = Object.freeze([
  { file: "favicon-48.png", size: 48 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-192.png", size: 192 },
  { file: "favicon-512.png", size: 512 },
]);

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

function stripDisplayMetadata(html) {
  return html
    .replace(/\s*<link\b(?=[^>]*\brel=["']icon["'])[^>]*>/gi, "")
    .replace(/\s*<link\b(?=[^>]*\brel=["']apple-touch-icon["'])[^>]*>/gi, "")
    .replace(/\s*<link\b(?=[^>]*\brel=["']manifest["'])[^>]*>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/gi, "");
}

function displayMetadata() {
  return [
    `<link rel="icon" href="${SEARCH_FAVICON}" sizes="48x48" type="image/png">`,
    `<link rel="icon" href="${SVG_FAVICON}" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="${APPLE_TOUCH_ICON}" sizes="180x180">`,
    `<link rel="manifest" href="${SITE_MANIFEST}">`,
    metaName("theme-color", THEME_COLOR),
  ];
}

export function finalizeStaticDiscoveryHtml(html, label = "HTML") {
  if (isNoIndex(html)) return html;

  const title = getTitle(html);
  const description = getMetaContent(html, "description");
  const canonical = getCanonical(html);
  const ogImage = getMetaContent(html, "og:image", "property");
  const locale = pageLocale(html, label);
  const normalized = stripDisplayMetadata(html);
  const additions = displayMetadata();

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

async function generateSiteIcons(root) {
  const source = path.join(root, "favicon.svg");
  await Promise.all(GENERATED_ICONS.map(async ({ file, size }) => {
    await sharp(source)
      .resize(size, size, { fit: "contain" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(root, file));
  }));
}

export async function finalizeStaticDiscovery({ distDir = "dist" } = {}) {
  const root = path.resolve(distDir);
  await generateSiteIcons(root);

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
