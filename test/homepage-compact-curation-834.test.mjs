import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { entityPageContentRegistry, getEntityPageContent } from "../src/content/pages/index.ts";
import { projectCardPresentations } from "../src/data/projects.ts";
import { homepageEntries } from "../src/site/pages/homepage.ts";
import { getPageByPath } from "../src/site/pages/manifest.ts";
import { getEntitySearchPresentation } from "../src/site/pages/search-presentation.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const homepage = renderHomepagePage(source);

function articleSlice(articleId) {
  const marker = `id="${articleId}"`;
  const start = homepage.lastIndexOf("<article", homepage.indexOf(marker));
  assert.ok(start >= 0, `${articleId} must render`);
  const callout = homepage.indexOf('class="project-preview-entry"', start);
  assert.ok(callout > start, `${articleId} must expose its terminal CTA`);
  const end = homepage.indexOf("</article>", callout);
  assert.ok(end > callout, `${articleId} must close after its CTA`);
  return homepage.slice(start, end + "</article>".length);
}
test("homepage compact configuration keeps three cases and explicitly disables Съёмки", () => {
  assert.deepEqual(
    homepageEntries.map((entry) => [entry.entity.type, entry.entity.id, entry.mode]),
    [
      ["case", "jestei-pool", "compact"],
      ["case", "styx", "compact"],
      ["case", "sensetique", "compact"],
      ["collection", "music-photography", "none"],
    ],
  );

  const [jestei, styx, sensetique] = homepageEntries;
  assert.deepEqual(jestei.preview?.sections, [
    { id: "jestei-home", blockIndexes: [0] },
    { id: "jestei-brand", blockIndexes: [0] },
    { id: "jestei-event", blockIndexes: [0] },
  ]);
  assert.deepEqual(styx.preview?.sections, [
    { id: "styx-production-preview", blockIndexes: [0] },
    { id: "styx-production-media", blockIndexes: [0] },
  ]);
  assert.deepEqual(sensetique.preview?.sections, [
    { id: "sensetique-studio-preview", blockIndexes: [0] },
    { id: "sensetique-harsh-light", blockIndexes: [1] },
  ]);
});
test("homepage renders only the approved visual-only compact cases", () => {
  assert.doesNotMatch(homepage, /id="project-shootings"/);

  const contracts = [
    ["project-jestei", "project-styx", ["jestei-home", "jestei-brand", "jestei-event"], "/work/jestei-pool/"],
    ["project-styx", "project-sensetique", ["styx-production-preview", "styx-production-media"], "/work/styx/"],
    ["project-sensetique", null, ["sensetique-studio-preview", "sensetique-harsh-light"], "/work/sensetique/"],
  ];

  for (const [articleId, nextId, sectionIds, href] of contracts) {
    const article = articleSlice(articleId);
    assert.match(article, /class="project__head"/);
    assert.match(article, /class="project__lead"/);
    assert.doesNotMatch(article, /class="project__title"/);
    assert.match(article, /class="project__title visually-hidden"/);
    for (const id of sectionIds) assert.match(article, new RegExp(`id="${id}"`));
    assert.doesNotMatch(article, /class="section-copy\b/);
    assert.doesNotMatch(article, /class="media__caption\b/);
    assert.doesNotMatch(article, /class="credits\b/);
    assert.doesNotMatch(article, /class="project__links\b/);
    assert.match(article, new RegExp(`class="project-preview-entry"[\\s\\S]*href="${href.replaceAll("/", "\\/")}"[\\s\\S]*Подробнее о проекте`));
  }
});
test("standalone Styx temporarily omits social instructions without deleting canonical data", () => {
  const content = getEntityPageContent(entityPageContentRegistry, "case:styx");
  assert.ok(content.sections.some((section) => section.id === "styx-social-instructions"));

  const page = getPageByPath("/work/styx/");
  assert.ok(page && page.type === "case");
  const html = renderStandaloneEntityPage(page);
  assert.doesNotMatch(html, /id="styx-social-instructions"/);
  assert.match(html, /id="styx-production-preview"/);
});

test("standalone Съёмки keeps media but hides unfinished intro and shoot headings", () => {
  const page = getPageByPath("/shootings/");
  assert.ok(page && page.type === "collection");
  const html = renderStandaloneEntityPage(page);

  assert.match(html, />Съёмки</);
  assert.doesNotMatch(html, /class="project__summary"/);
  assert.doesNotMatch(html, /class="project__lead"/);
  assert.doesNotMatch(html, /class="section-copy\b/);
  assert.doesNotMatch(html, /class="credits\b/);
  assert.doesNotMatch(html, /class="media__caption\b/);
  assert.match(html, /id="shootings-obladaet-collage"/);
  assert.match(html, /id="shootings-hypression-collage"/);
});
test("Съёмки is the public identity while the existing /shootings/ route and large card stay available", () => {
  const card = projectCardPresentations.find((candidate) => candidate.id === "shootings");
  assert.ok(card);
  assert.equal(card.title, "Съёмки");

  const search = getEntitySearchPresentation("collection:music-photography");
  assert.ok(search);
  assert.ok(search.title.startsWith("Съёмки"));

  assert.match(homepage, /<a\b(?=[^>]*class="project-card")(?=[^>]*href="\/shootings\/")[^>]*>/);
  assert.match(homepage, />Съёмки</);
});

test("Lab Storybook records the real compact-project renderer variants", () => {
  const storyUrl = new URL("../src/lab/stories/compact-project-preview.stories.js", import.meta.url);
  assert.equal(existsSync(storyUrl), true);
  const story = readFileSync(storyUrl, "utf8");
  assert.match(story, /renderCompactHomepageEntity/);
  assert.match(story, /Jestei/);
  assert.match(story, /Styx/);
  assert.match(story, /Sensetique/);
});
