import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { SITE_ORIGIN } from "../src/site/config.ts";

export { SITE_ORIGIN };
export const SITE_ORIGIN_URL = new URL(SITE_ORIGIN);

const FIXTURE_SEGMENTS = new Set(["fixtures", "__fixtures__", "test-fixtures"]);
const SKIPPED_SCHEMES = /^(?:mailto|tel|data|blob|javascript):/i;

export async function collectHtmlFiles(rootDir) {
  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        files.push(absolute);
      }
    }
  }

  await walk(rootDir);
  return files;
}

export function isFixtureHtml(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath).split(path.sep);
  return relative.some((segment) => FIXTURE_SEGMENTS.has(segment.toLowerCase()));
}

export function is404Html(filePath) {
  return path.basename(filePath).toLowerCase() === "404.html";
}

export function getTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : null;
}

export function getMetaContent(html, key, attribute = "name") {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    if ((attrs[attribute] ?? "").toLowerCase() === key.toLowerCase()) {
      return attrs.content ?? null;
    }
  }
  return null;
}

export function getLinkHref(html, rel) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const relTokens = (attrs.rel ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    if (relTokens.includes(rel.toLowerCase())) {
      return attrs.href ?? null;
    }
  }
  return null;
}

export function getCanonical(html) {
  return getLinkHref(html, "canonical");
}

export function getRobots(html) {
  return getMetaContent(html, "robots");
}

export function isNoIndex(html) {
  const robots = getRobots(html);
  if (!robots) return false;
  return robots.toLowerCase().split(/[\s,]+/).includes("noindex");
}

export function validateCanonical(canonical, label = "canonical") {
  if (!canonical) {
    throw new Error(`${label}: missing production canonical`);
  }

  let url;
  try {
    url = new URL(canonical);
  } catch {
    throw new Error(`${label}: invalid URL ${canonical}`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${label}: canonical must use https: ${canonical}`);
  }
  if (url.origin !== SITE_ORIGIN) {
    throw new Error(`${label}: canonical origin must be ${SITE_ORIGIN}: ${canonical}`);
  }
  if (url.search || url.hash) {
    throw new Error(`${label}: canonical must not contain query or hash: ${canonical}`);
  }

  return url.href;
}

export function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function parseAttributes(tag) {
  const attrs = {};
  const source = tag.replace(/^<\/?[A-Za-z0-9:-]+\s*/u, "").replace(/\/?>$/u, "");
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const key = match[1].toLowerCase();
    attrs[key] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

const DECODED_ENTITIES = Object.freeze({
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#34;": '"',
  "&#39;": "'",
  "&apos;": "'",
});

export function decodeEntities(value) {
  return String(value).replace(
    /&(amp|lt|gt|quot|#34|#39|apos);/g,
    (entity) => DECODED_ENTITIES[entity],
  );
}

function findHtmlTagEnd(html, start) {
  let quote = null;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return index;
  }
  return -1;
}

function isTagBoundary(char) {
  return !char || char === ">" || char === "/" || /\s/u.test(char);
}

export function extractJsonLdBlocks(html) {
  const blocks = [];
  const lower = html.toLowerCase();
  let cursor = 0;

  while (cursor < html.length) {
    const start = lower.indexOf("<script", cursor);
    if (start === -1) break;
    const boundary = lower[start + "<script".length];
    if (!isTagBoundary(boundary)) {
      cursor = start + "<script".length;
      continue;
    }

    const openEnd = findHtmlTagEnd(html, start);
    if (openEnd === -1) break;
    const closeStart = lower.indexOf("</script>", openEnd + 1);
    if (closeStart === -1) break;

    const openingTag = html.slice(start, openEnd + 1);
    const attrs = parseAttributes(openingTag);
    if ((attrs.type ?? "").toLowerCase() === "application/ld+json") {
      blocks.push(html.slice(openEnd + 1, closeStart).trim());
    }
    cursor = closeStart + "</script>".length;
  }

  return blocks;
}

export function extractReferenceAttributes(html) {
  const references = [];
  const tagPattern = /<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>/g;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(html)) !== null) {
    const attrs = parseAttributes(tagMatch[0]);
    for (const attribute of ["href", "src", "poster"]) {
      if (attrs[attribute]) {
        references.push({ attribute, url: attrs[attribute] });
      }
    }
    if (attrs.srcset) {
      for (const candidate of parseSrcset(attrs.srcset)) {
        references.push({ attribute: "srcset", url: candidate });
      }
    }
  }
  return references;
}

export function parseSrcset(value) {
  return value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .map((candidate) => candidate.split(/\s+/, 1)[0])
    .filter(Boolean);
}

export function isSkippableReference(value) {
  return !value || SKIPPED_SCHEMES.test(value);
}

export function normalizeLocalReference(value, sourceHtml, distDir) {
  if (isSkippableReference(value)) return null;

  let url;
  let pathname;
  let hash = "";

  if (/^https?:\/\//i.test(value)) {
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if (url.origin !== SITE_ORIGIN) return null;
    pathname = decodeURIComponent(url.pathname);
    hash = url.hash;
  } else {
    const hashIndex = value.indexOf("#");
    const withoutHash = hashIndex === -1 ? value : value.slice(0, hashIndex);
    hash = hashIndex === -1 ? "" : value.slice(hashIndex);
    const queryIndex = withoutHash.indexOf("?");
    const withoutQuery = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

    if (!withoutQuery) {
      pathname = path.relative(distDir, sourceHtml).split(path.sep).join("/");
      pathname = `/${pathname}`;
    } else if (withoutQuery.startsWith("/")) {
      pathname = decodeURIComponent(withoutQuery);
    } else {
      const sourceRelativeDir = path.dirname(path.relative(distDir, sourceHtml));
      pathname = `/${path.normalize(path.join(sourceRelativeDir, decodeURIComponent(withoutQuery))).split(path.sep).join("/")}`;
    }
  }

  const cleanPath = pathname.replace(/^\/+/, "");
  return { pathname: `/${cleanPath}`, hash };
}

export async function resolveLocalPath(distDir, pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const direct = path.join(distDir, relative);
  const candidates = [];

  if (pathname.endsWith("/") || relative === "") {
    candidates.push(path.join(direct, "index.html"));
  } else {
    candidates.push(direct);
    if (!path.extname(relative)) {
      candidates.push(path.join(direct, "index.html"));
      candidates.push(`${direct}.html`);
    }
  }

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return { found: candidate, expected: candidates[0] };
      if (info.isDirectory()) {
        const indexPath = path.join(candidate, "index.html");
        const indexInfo = await stat(indexPath).catch(() => null);
        if (indexInfo?.isFile()) return { found: indexPath, expected: indexPath };
      }
    } catch {
      // Try the next deterministic candidate.
    }
  }

  return { found: null, expected: candidates[0] ?? direct };
}

export async function readUtf8(filePath) {
  return readFile(filePath, "utf8");
}

export function hasAnchor(html, hash) {
  if (!hash || hash === "#") return true;
  let target;
  try {
    target = decodeURIComponent(hash.slice(1));
  } catch {
    target = hash.slice(1);
  }
  if (!target) return true;

  for (const tag of html.match(/<[A-Za-z][^>]*>/g) ?? []) {
    const attrs = parseAttributes(tag);
    if (attrs.id === target || attrs.name === target) return true;
  }
  return false;
}
