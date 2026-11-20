import assert from "node:assert/strict";
import test from "node:test";

import { SITE_ORIGIN as pageSiteOrigin } from "../src/site/config.ts";
import { renderPageMetadata } from "../src/site/shell/metadata.ts";
import { renderPageShell } from "../src/site/shell/page-shell.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { SITE_ORIGIN as toolingSiteOrigin } from "../tools/site-html-utils.mjs";

const jestei = sitePages.find((page) => page.id === "case:jestei-pool");
const notFound = sitePages.find((page) => page.id === "not-found");

if (!jestei || !notFound) throw new Error("required test pages are missing");

test("page rendering and postbuild tooling share one production origin", () => {
  assert.equal(pageSiteOrigin, "https://www.looksawful.ru");
  assert.equal(toolingSiteOrigin, pageSiteOrigin);
});

test("public page metadata uses the production canonical origin", () => {
  const html = renderPageMetadata({
    page: jestei,
    title: "Jestei Pool — Иван Крушинский",
    description: "Описание кейса.",
  });

  assert.match(html, /<title>Jestei Pool — Иван Крушинский<\/title>/);
  assert.match(html, /name="robots" content="index,follow,max-image-preview:large"/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.looksawful\.ru\/work\/jestei-pool\/"/);
  assert.match(html, /property="og:url" content="https:\/\/www\.looksawful\.ru\/work\/jestei-pool\/"/);
});

test("non-indexable page metadata is noindex", () => {
  const html = renderPageMetadata({
    page: notFound,
    title: "404 — Иван Крушинский",
    description: "Страница не найдена.",
  });

  assert.match(html, /name="robots" content="noindex,nofollow"/);
});

test("standalone page shell exposes page identity and one main landmark", () => {
  const html = renderPageShell({
    page: jestei,
    title: "Jestei Pool — Иван Крушинский",
    description: "Описание кейса.",
    content: '<article id="project-jestei"><h1>Jestei Pool</h1></article>',
  });

  assert.match(html, /data-page-type="case"/);
  assert.match(html, /data-page-id="case:jestei-pool"/);
  assert.match(html, /data-entity-id="jestei-pool"/);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.match(html, /<a class="site-nav__brand" href="\/">looksawful<\/a>/);
  assert.match(html, /<link href="\/src\/styles\/index\.css" rel="stylesheet">/);
  assert.match(html, /<script src="\/src\/main\.js" type="module"><\/script>/);
});
