const fs = require("node:fs");
const path = require("node:path");

const ORIGIN = "https://www.looksawful.ru";
const MAX_URLS = 30;

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function readSitemap(filePath, visited = new Set()) {
  const absolute = path.resolve(filePath);
  if (visited.has(absolute)) throw new Error(`sitemap loop: ${absolute}`);
  visited.add(absolute);
  const xml = fs.readFileSync(absolute, "utf8");
  if (/<urlset\b/i.test(xml)) return locs(xml);
  if (!/<sitemapindex\b/i.test(xml)) throw new Error(`${absolute}: invalid sitemap root`);
  const urls = [];
  for (const child of locs(xml)) {
    const parsed = new URL(child);
    if (parsed.origin !== ORIGIN) throw new Error(`wrong sitemap origin: ${child}`);
    urls.push(...readSitemap(path.join(path.dirname(absolute), path.basename(parsed.pathname)), visited));
  }
  return urls;
}

function sample(urls) {
  const sorted = [...new Set(urls)].sort((a, b) => a.localeCompare(b));
  if (sorted.length <= MAX_URLS) return sorted;
  const selected = [];
  const home = sorted.find((url) => new URL(url).pathname === "/");
  if (home) selected.push(home);
  const topSections = new Set();
  for (const url of sorted) {
    const segment = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    if (!segment || topSections.has(segment)) continue;
    topSections.add(segment);
    if (!selected.includes(url)) selected.push(url);
    if (selected.length >= MAX_URLS) return selected;
  }
  for (const url of sorted) {
    if (!selected.includes(url)) selected.push(url);
    if (selected.length >= MAX_URLS) break;
  }
  return selected;
}

const productionUrls = sample(readSitemap("./dist/sitemap.xml"));
const localUrls = productionUrls.map((url) => `http://localhost${new URL(url).pathname}`);

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: localUrls,
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./artifacts/lighthouse",
    },
  },
};
