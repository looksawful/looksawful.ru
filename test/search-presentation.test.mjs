import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { getPageByPath } from "../src/site/pages/manifest.ts";
import { cvSearchPresentation } from "../src/site/pages/search-presentation.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";
import { replacePageMetadata } from "../src/site/shell/metadata.ts";
import { checkProduction } from "../tools/check-production.mjs";
import { validateSite } from "../tools/check-site-meta.mjs";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cvSource = readFileSync(new URL("../public/cv/index.html", import.meta.url), "utf8");
const pagesWorkflow = readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");

const HOME_TITLE = "Иван Крушинский — арт-директор цифровых продуктов";
const HOME_DESCRIPTION =
  "Арт-директор цифровых продуктов и дизайнер. Проектирую интерфейсы, айдентику и визуальные системы, руковожу командами и довожу продукты до релиза.";
const SOCIAL_IMAGE = "https://www.looksawful.ru/media/hero/hero-portrait.webp";

test("homepage search and social presentation stays coherent", () => {
  const html = renderHomepagePage(indexSource);

  assert.match(html, new RegExp(`<title>${HOME_TITLE}</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${HOME_DESCRIPTION}">`));
  assert.match(html, /<meta property="og:type" content="website">/);
  assert.match(html, /<meta property="og:site_name" content="looksawful">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, new RegExp(`<meta property="og:image" content="${SOCIAL_IMAGE}">`));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${SOCIAL_IMAGE}">`));

  const jsonLdMatch = html.match(
    /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/i,
  );
  assert.ok(jsonLdMatch, "homepage must expose JSON-LD");
  const structured = JSON.parse(jsonLdMatch[1]);
  const graph = structured["@graph"];
  assert.ok(Array.isArray(graph));
  const website = graph.find((item) => item?.["@type"] === "WebSite");
  const person = graph.find((item) => item?.["@type"] === "Person");
  assert.equal(website?.name, "looksawful");
  assert.equal(website?.alternateName, "Иван Крушинский");
  assert.equal(person?.jobTitle, "Арт-директор цифровых продуктов");

  assert.match(
    html,
    /<!--noindex--><address class="cluster" data-nosnippet>[\s\S]*?<\/address><!--\/noindex-->/,
  );
  assert.match(
    html,
    /<!--noindex--><footer class="project__footer cluster" data-reveal-group data-nosnippet>[\s\S]*?<\/footer><!--\/noindex-->/,
  );
});

test("standalone indexable entity pages inherit the same social identity", () => {
  const page = getPageByPath("/work/jestei-pool/");
  assert.ok(page && page.type === "case");

  const html = renderStandaloneEntityPage(page);
  assert.match(html, /<meta property="og:site_name" content="looksawful">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.looksawful\.ru\/media\/hero\/hero-portrait\.webp">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/www\.looksawful\.ru\/media\/hero\/hero-portrait\.webp">/);
});

test("CV uses the same social identity with resume-specific copy", () => {
  const page = getPageByPath("/cv/");
  assert.ok(page && page.renderer === "cv");

  const html = replacePageMetadata(cvSource, {
    page,
    ...cvSearchPresentation,
  });

  assert.match(html, /<title>Иван Крушинский — резюме<\/title>/);
  assert.match(
    html,
    /<meta name="description" content="Резюме Ивана Крушинского — арт-директора цифровых продуктов и дизайнера: опыт, компетенции, инструменты и образование\.">/,
  );
  assert.match(html, /<meta property="og:site_name" content="looksawful">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.looksawful\.ru\/media\/hero\/hero-portrait\.webp">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
});

test("site metadata validation rejects a missing favicon asset", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "site-meta-favicon-"));
  try {
    await mkdir(path.join(dir, "media", "hero"), { recursive: true });
    await writeFile(path.join(dir, "index.html"), renderHomepagePage(indexSource), "utf8");
    await writeFile(path.join(dir, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://www.looksawful.ru/sitemap.xml\n", "utf8");
    await writeFile(
      path.join(dir, "sitemap.xml"),
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.looksawful.ru/</loc></url></urlset>',
      "utf8",
    );
    await writeFile(path.join(dir, "media", "hero", "hero-portrait.webp"), "fixture", "utf8");

    await assert.rejects(
      () => validateSite({ distDir: dir }),
      /favicon/i,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("production discovery health checks favicon as YandexBot", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const headers = new Headers(init.headers ?? {});
    requests.push({ pathname: url.pathname, userAgent: headers.get("User-Agent") ?? "" });

    if (url.pathname === "/") {
      return new Response("<!doctype html><html><head><title>fixture</title></head><body>ok</body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\n\nSitemap: https://www.looksawful.ru/sitemap.xml\n", { status: 200 });
    }
    if (url.pathname === "/sitemap.xml") {
      return new Response('<?xml version="1.0"?><urlset><url><loc>https://www.looksawful.ru/</loc></url></urlset>', { status: 200 });
    }
    if (url.pathname === "/deploy-version.txt") {
      return new Response("commit=test-sha\ndeployed-from=prod\n", { status: 200 });
    }
    if (url.pathname === "/favicon.svg") {
      return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"></svg>', {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      });
    }
    throw new Error(`unexpected URL ${url.href}`);
  };

  try {
    const result = await checkProduction({ expectedSha: "test-sha" });
    assert.equal(result.favicon, "PASS");
    const faviconRequest = requests.find((request) => request.pathname === "/favicon.svg");
    assert.ok(faviconRequest, "production health check must request /favicon.svg");
    assert.match(faviconRequest.userAgent, /YandexBot/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Pages deployment verifies Yandex-visible discovery files after publish", () => {
  assert.match(pagesWorkflow, /YandexBot\/3\.0/);
  assert.match(pagesWorkflow, /favicon\.svg/);
  assert.match(pagesWorkflow, /robots\.txt/);
  assert.match(pagesWorkflow, /sitemap\.xml/);
  assert.match(pagesWorkflow, /image\/svg\+xml/);
});
