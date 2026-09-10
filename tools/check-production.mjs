import { pathToFileURL } from "node:url";
import path from "node:path";

import { decodeEntities } from "./site-html-utils.mjs";

const ORIGIN = "https://www.looksawful.ru";
const TIMEOUT_MS = 20_000;
const MAX_SAMPLE = 10;
const HEALTHCHECK_USER_AGENT = "looksawful-healthcheck/1.0";
const YANDEX_BOT_USER_AGENT = "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)";
const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function decodeXml(value) {
  return decodeEntities(value);
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function assertSitemapShape(xml, label) {
  const hasUrlset = /<urlset\b/i.test(xml) && /<\/urlset>/i.test(xml);
  const hasIndex = /<sitemapindex\b/i.test(xml) && /<\/sitemapindex>/i.test(xml);
  if (hasUrlset === hasIndex) throw new Error(`${label}: expected exactly one of urlset or sitemapindex`);
  return hasIndex ? "index" : "urlset";
}

function assertPng(bytes, label) {
  if (bytes.byteLength < PNG_SIGNATURE.byteLength) throw new Error(`${label}: response is too small to be a PNG`);
  for (let index = 0; index < PNG_SIGNATURE.byteLength; index += 1) {
    if (bytes[index] !== PNG_SIGNATURE[index]) throw new Error(`${label}: response is not PNG`);
  }
}

async function fetchChecked(
  url,
  {
    expectHtml = false,
    expectedContentType = null,
    userAgent = HEALTHCHECK_USER_AGENT,
    responseType = "text",
  } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache", "User-Agent": userAgent },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (expectedContentType && !contentType.toLowerCase().includes(expectedContentType.toLowerCase())) {
    throw new Error(`${url}: expected ${expectedContentType} Content-Type, got ${contentType || "missing"}`);
  }

  if (responseType === "bytes") {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) throw new Error(`${url}: empty response`);
    return { response, bytes, text: null };
  }

  const text = await response.text();
  if (!text.trim()) throw new Error(`${url}: empty response`);

  if (expectHtml) {
    if (!contentType.toLowerCase().includes("text/html")) throw new Error(`${url}: expected HTML Content-Type, got ${contentType || "missing"}`);
    if (/There isn't a GitHub Pages site here|<title>\s*404\b|404 File not found/i.test(text)) {
      throw new Error(`${url}: response resembles a GitHub Pages 404`);
    }
  }
  return { response, text, bytes: null };
}

async function readSitemap(url, visited = new Set(), userAgent = HEALTHCHECK_USER_AGENT) {
  if (visited.has(url)) throw new Error(`sitemap loop detected: ${url}`);
  visited.add(url);
  const { text } = await fetchChecked(url, { userAgent });
  const type = assertSitemapShape(text, url);
  const entries = locs(text);
  if (type === "urlset") return entries;

  const urls = [];
  for (const child of entries) {
    const parsed = new URL(child);
    if (parsed.origin !== ORIGIN) throw new Error(`${url}: child sitemap has wrong origin ${child}`);
    urls.push(...await readSitemap(parsed.href, visited, userAgent));
  }
  return urls;
}

function deterministicSample(urls, max = MAX_SAMPLE) {
  const sorted = [...new Set(urls)].sort((a, b) => a.localeCompare(b));
  if (sorted.length <= max) return sorted;
  const home = sorted.find((url) => new URL(url).pathname === "/");
  const selected = home ? [home] : [];
  const seenTop = new Set();
  for (const url of sorted) {
    const first = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    if (!first || seenTop.has(first)) continue;
    seenTop.add(first);
    if (!selected.includes(url)) selected.push(url);
    if (selected.length >= max) return selected;
  }
  for (const url of sorted) {
    if (!selected.includes(url)) selected.push(url);
    if (selected.length >= max) break;
  }
  return selected;
}

export async function checkProduction({ expectedSha = process.env.EXPECTED_PROD_SHA ?? null } = {}) {
  const homepage = `${ORIGIN}/`;
  const faviconUrl = `${ORIGIN}/favicon.png`;
  const appleTouchIconUrl = `${ORIGIN}/apple-touch-icon.png`;
  const robotsUrl = `${ORIGIN}/robots.txt`;
  const sitemapUrl = `${ORIGIN}/sitemap.xml`;
  const versionUrl = `${ORIGIN}/deploy-version.txt`;

  await fetchChecked(homepage, { expectHtml: true });

  const { bytes: favicon } = await fetchChecked(faviconUrl, {
    expectedContentType: "image/png",
    userAgent: YANDEX_BOT_USER_AGENT,
    responseType: "bytes",
  });
  assertPng(favicon, "favicon.png");

  const { bytes: appleTouchIcon } = await fetchChecked(appleTouchIconUrl, {
    expectedContentType: "image/png",
    userAgent: YANDEX_BOT_USER_AGENT,
    responseType: "bytes",
  });
  assertPng(appleTouchIcon, "apple-touch-icon.png");

  const { text: robots } = await fetchChecked(robotsUrl, { userAgent: YANDEX_BOT_USER_AGENT });
  if (!robots.includes(`Sitemap: ${sitemapUrl}`)) throw new Error("robots.txt: production sitemap declaration missing");

  const sitemapUrls = await readSitemap(sitemapUrl, new Set(), YANDEX_BOT_USER_AGENT);
  if (sitemapUrls.length === 0) throw new Error("sitemap contains no URLs");
  for (const url of sitemapUrls) {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN) throw new Error(`sitemap URL has wrong origin: ${url}`);
  }

  const { text: deployVersion } = await fetchChecked(versionUrl);
  if (expectedSha && !deployVersion.split(/\r?\n/).includes(`commit=${expectedSha}`)) {
    throw new Error(`deploy-version mismatch: expected commit=${expectedSha}`);
  }

  const sample = deterministicSample(sitemapUrls);
  for (const url of sample) await fetchChecked(url, { expectHtml: true });

  return {
    homepage: "PASS",
    favicon: "PASS",
    appleTouchIcon: "PASS",
    robots: "PASS",
    sitemap: "PASS",
    deployVersion: expectedSha ? "PASS" : "CHECKED",
    sitemapUrlCount: sitemapUrls.length,
    sampledUrls: sample,
  };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  try {
    const result = await checkProduction();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[production] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
