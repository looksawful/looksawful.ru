import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { projectCardPresentations } from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";

const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);
const expectedIds = ["jestei", "styx", "sensetique", "shootings"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("project-card presentations keep fixed identity while homepage visibility remains editable", () => {
  assert.deepEqual(projectCardPresentations.map(({ id }) => id), expectedIds);
  assert.ok(projectCardPresentations.every(({ visible }) => typeof visible === "boolean"));
});

test("homepage card selection filters only presentations whose CMS visibility is false", async () => {
  const dataModule = await import("../src/data/projects.ts");
  assert.equal(typeof dataModule.getVisibleProjectCardPresentations, "function");

  const fixture = clone(projectCardPresentations).map((card) => ({ ...card, visible: true }));
  fixture[0].visible = false;

  assert.deepEqual(
    dataModule.getVisibleProjectCardPresentations(fixture).map(({ id }) => id),
    expectedIds.slice(1),
  );
});

test("homepage renderer uses the visibility-filtered ProjectCardPresentation collection", async () => {
  const source = await readFile(homeSlotsUrl, "utf8");
  assert.match(source, /getVisibleProjectCardPresentations\(\)\.map\(renderProjectCard\)/);
  assert.doesNotMatch(source, /getVisibleHomeCards|homeCards\.map\(renderProjectCard\)/);
});

test("hiding a homepage card does not own or alter its standalone route", () => {
  for (const card of projectCardPresentations) {
    const href = getProjectCardHref(card);
    if (card.id === "jestei") assert.equal(href, "/work/jestei-pool/");
    if (card.id === "styx") assert.equal(href, "/work/styx/");
    if (card.id === "sensetique") assert.equal(href, "/work/sensetique/");
    if (card.id === "shootings") assert.equal(href, "/shootings/");
  }
});

test("Pages CMS exposes homepage visibility but no route controls for project cards", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const projectCardsBlock = cmsConfig.match(/\n  - name: project-cards\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";

  assert.match(projectCardsBlock, /- name: visible\b[\s\S]*?type: boolean/);
  assert.match(projectCardsBlock, /label: Показывать на главной/);
  assert.doesNotMatch(projectCardsBlock, /- name: (route|canonical|listed|indexable|slug|pageType|pageId)\b/);
});
