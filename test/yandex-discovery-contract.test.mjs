import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sitemapUrl = new URL("../tools/generate-sitemap.mjs", import.meta.url);
const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

test("Yandex Clean-param explicitly collapses service and approved outreach parameters", async () => {
  const robots = await read("public/robots.txt");
  assert.match(
    robots,
    /User-agent: Yandex[\s\S]*Clean-param: sha&utm_source&utm_medium&utm_campaign&utm_content&utm_id(?:\s|$)/,
  );
});

test("production verification uses sha only for deploy-version and probes canonical site URLs", async () => {
  const pages = await read(".github/workflows/pages.yml");
  const shaUrls = [...pages.matchAll(/https:\/\/www\.looksawful\.ru\/[^\"\s]*\?sha=\$\{GITHUB_SHA\}/g)]
    .map((match) => match[0]);

  assert.deepEqual(shaUrls, [
    "https://www.looksawful.ru/deploy-version.txt?sha=${GITHUB_SHA}",
  ]);
  assert.match(pages, /Cache-Control: no-cache/);
  assert.match(pages, /https:\/\/www\.looksawful\.ru\/robots\.txt\"/);
  assert.match(pages, /https:\/\/www\.looksawful\.ru\/sitemap\.xml\"/);
});

test("sitemap canonical set is derived from enabled indexable SitePages", async () => {
  const { collectManifestIndexableCanonicals } = await import(sitemapUrl.href);
  assert.equal(typeof collectManifestIndexableCanonicals, "function");

  const urls = collectManifestIndexableCanonicals();
  assert.deepEqual(urls, [
    "https://www.looksawful.ru/",
    "https://www.looksawful.ru/cv/",
    "https://www.looksawful.ru/privacy/",
    "https://www.looksawful.ru/shootings/",
    "https://www.looksawful.ru/work/jestei-pool/",
    "https://www.looksawful.ru/work/sensetique/",
    "https://www.looksawful.ru/work/styx/",
  ]);

  for (const url of urls) {
    assert.equal(new URL(url).search, "");
    assert.equal(new URL(url).hash, "");
  }
  assert.equal(urls.some((url) => url.endsWith("/work/awful-cases/")), false);
  assert.equal(urls.some((url) => url.endsWith("/404.html")), false);
  assert.equal(urls.some((url) => url.includes("/docs/")), false);
  assert.equal(urls.some((url) => url.includes("/pets/")), false);
});

test("production sitemap requires every manifest indexable canonical without owning auxiliary documents", async () => {
  const source = await read("tools/generate-sitemap.mjs");
  assert.match(source, /collectManifestIndexableCanonicals/);
  assert.match(source, /missing indexable canonical/i);
  assert.doesNotMatch(source, /unexpected indexable canonical/i);
});
