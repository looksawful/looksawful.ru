import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { entityPageContentRegistry } from "../src/content/pages/index.ts";
import { entryRequestToPagePath } from "../src/site/build/site-pages-plugin.ts";
import { validatePageContentManifest } from "../src/site/pages/content-validation.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { extractElementById } from "../src/site/rendering/html.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

function page(id) {
  const result = sitePages.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`missing page ${id}`);
  return result;
}

function videoOpeningTagForSource(html, source) {
  const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<video([^>]*)><source src="${escapedSource}"`));
  assert.ok(match, `missing video source ${source}`);
  return match[1];
}

test("every enabled entity page has canonical PageContent", () => {
  assert.doesNotThrow(() => validatePageContentManifest(
    sitePages,
    entityPageContentRegistry,
    { requireEnabledEntityCoverage: true },
  ));
});

test("homepage final output resolves every build-time marker", () => {
  const rendered = renderHomepagePage(indexHtml);
  assert.doesNotMatch(rendered, /<!-- [A-Z][A-Z0-9_]+ -->/);
});

test("homepage full entities render from canonical PageContent in declared order", () => {
  const html = renderHomepagePage(indexHtml);
  const articleIds = [
    "project-jestei",
    "project-styx",
    "project-sensetique",
    "project-shootings",
  ];

  let previousIndex = -1;
  for (const articleId of articleIds) {
    const article = extractElementById(html, "article", articleId);
    const articleIndex = html.indexOf(article);
    assert.ok(articleIndex > previousIndex, `${articleId} must follow homepageEntries order`);
    previousIndex = articleIndex;

    assert.match(article, /data-section-type=/, `${articleId} must use canonical Section rendering`);
    assert.match(article, /<h2\b[^>]*class="project__title"/, `${articleId} must keep h2 on Homepage`);
    assert.doesNotMatch(article, /<!-- [A-Z][A-Z0-9_]+ -->/);
  }
});

test("homepage canonical entities do not depend on legacy entity markers", () => {
  const withoutEntityMarkers = indexHtml.replace(
    /<!-- (?:JESTEI|STYX|SENSETIQUE|SHOOTINGS)_[A-Z0-9_]+ -->/g,
    "",
  );

  assert.doesNotThrow(() => renderHomepagePage(withoutEntityMarkers));
});

test("standalone Jestei page is isolated from other case DOM and uses h1", () => {
  const html = renderStandaloneEntityPage(page("case:jestei-pool"));
  assert.match(html, /id="project-jestei"/);
  assert.match(html, /<h1 class="project__title"/);
  assert.doesNotMatch(html, /id="project-styx"/);
  assert.doesNotMatch(html, /id="project-sensetique"/);
  assert.doesNotMatch(html, /id="project-shootings"/);
  assert.doesNotMatch(html, /<!-- JESTEI_[A-Z0-9_]+ -->/);
});

test("standalone Sensetique page is canonical, isolated, and marker-free", () => {
  assert.equal(entityPageContentRegistry.has("case:sensetique"), true);

  const html = renderStandaloneEntityPage(page("case:sensetique"));
  assert.match(html, /id="project-sensetique"/);
  assert.match(html, /<h1 class="project__title"/);
  assert.match(html, /id="sensetique-studio"/);
  assert.match(html, /id="sensetique-production"/);
  assert.match(html, /<h3[^>]*>\s*Оборудование\s*<\/h3>/);
  assert.match(html, /В студии были импульсный и постоянный свет, насадки, отражатели и другое съёмочное оборудование\./);
  assert.match(html, /Публиковали съёмки в российских и европейских изданиях и работали с редакциями над спецпроектами\./);
  assert.match(html, /Для российских независимых дизайнеров и брендов одежды снимали лукбуки, кампейны, видео и каталоги\./);
  assert.match(html, /В студии проводили мастер-классы и интенсивы с приглашёнными авторами\./);
  assert.match(html, />Digital Fear of Love<\/strong>/);
  assert.doesNotMatch(html, /Digital-fear-of-love — адверториал для ювелирного бренда MIMI MOSCOW/);
  assert.doesNotMatch(html, /<strong class="credits__title">Olovo Moscow<\/strong>/);

  const krasotaVideo = videoOpeningTagForSource(
    html,
    "/media/projects/sensetique/09/source/56-16x9.mp4",
  );
  const olovoVideo = videoOpeningTagForSource(
    html,
    "/media/projects/sensetique/11/source/28-16x9.mp4",
  );
  assert.doesNotMatch(krasotaVideo, /(?:^|\s)(?:width|height)="/);
  assert.doesNotMatch(olovoVideo, /(?:^|\s)(?:width|height)="/);

  assert.doesNotMatch(html, /id="project-jestei"/);
  assert.doesNotMatch(html, /id="project-styx"/);
  assert.doesNotMatch(html, /id="project-shootings"/);
  assert.doesNotMatch(html, /<!-- SENSETIQUE_[A-Z0-9_]+ -->/);
});

test("standalone Shootings page uses the Collection route and excludes case DOM", () => {
  const html = renderStandaloneEntityPage(page("collection:music-photography"));
  assert.match(html, /id="project-shootings"/);
  assert.match(html, /<h1 class="project__title"/);
  assert.doesNotMatch(html, /id="project-jestei"/);
  assert.doesNotMatch(html, /id="project-styx"/);
  assert.doesNotMatch(html, /id="project-sensetique"/);
  assert.doesNotMatch(html, /<!-- SHOOTINGS_[A-Z0-9_]+ -->/);
});

test("unlisted standalone Project pages render canonical project content", () => {
  const awful = renderStandaloneEntityPage(page("project:awful-cases"));
  assert.match(awful, /id="project-awful-cases"/);
  assert.match(awful, /<h1 class="project__title"/);
  assert.match(awful, /id="awful-cases-demo"/);
  assert.match(awful, /id="awful-cases-settings"/);
  assert.doesNotMatch(awful, /<article\b[^>]*hidden/);
  assert.doesNotMatch(awful, /<!-- AWFUL_CASES_[A-Z0-9_]+ -->/);
  assert.match(awful, /<meta name="robots" content="noindex,nofollow">/);

  const moves = renderStandaloneEntityPage(page("project:moves-awful"));
  assert.match(moves, /id="project-moves-awful"/);
  assert.match(moves, /data-animated-canvas-gallery/);
  assert.doesNotMatch(moves, /<article\b[^>]*hidden/);
  assert.doesNotMatch(moves, /<!-- MOVES_AWFUL_[A-Z0-9_]+ -->/);

  const berry = renderStandaloneEntityPage(page("project:berry-social-content-2020"));
  assert.match(berry, /id="project-berry-social-content-2020"/);
  assert.match(berry, /<h1 class="project__title"/);
  assert.doesNotMatch(berry, /<article\b[^>]*hidden/);
  assert.doesNotMatch(berry, /<!-- BERRY_[A-Z0-9_]+ -->/);
});

test("Vite transform path resolution is explicit and route-safe", () => {
  assert.equal(entryRequestToPagePath("/index.html"), "/");
  assert.equal(entryRequestToPagePath("/work/jestei-pool/index.html"), "/work/jestei-pool/");
  assert.equal(entryRequestToPagePath("/work/awful-cases/index.html"), "/work/awful-cases/");
  assert.equal(entryRequestToPagePath("/shootings/index.html"), "/shootings/");
  assert.equal(entryRequestToPagePath("/404.html"), "/404.html");
});
