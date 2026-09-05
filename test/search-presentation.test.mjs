import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getPageByPath } from "../src/site/pages/manifest.ts";
import { cvSearchPresentation } from "../src/site/pages/search-presentation.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";
import { replacePageMetadata } from "../src/site/shell/metadata.ts";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cvSource = readFileSync(new URL("../public/cv/index.html", import.meta.url), "utf8");

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
