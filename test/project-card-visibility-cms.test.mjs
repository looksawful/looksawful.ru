import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { homeCards } from "../src/data/projects.ts";
import { getHomeCardHref } from "../src/site/pages/project-card-routes.ts";

const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);
const expectedIds = ["jestei", "styx", "sensetique", "shootings"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("home cards keep fixed identity while homepage visibility remains editable", () => {
  assert.deepEqual(homeCards.map(({ id }) => id), expectedIds);
  assert.ok(homeCards.every(({ visible }) => typeof visible === "boolean"));
});

test("homepage card selection filters only cards whose CMS visibility is false", async () => {
  const dataModule = await import("../src/data/projects.ts");
  assert.equal(typeof dataModule.getVisibleHomeCards, "function");

  const fixture = clone(homeCards).map((card) => ({ ...card, visible: true }));
  fixture[0].visible = false;

  assert.deepEqual(
    dataModule.getVisibleHomeCards(fixture).map(({ id }) => id),
    expectedIds.slice(1),
  );
});

test("homepage renderer uses the visibility-filtered home card collection", async () => {
  const source = await readFile(homeSlotsUrl, "utf8");
  assert.match(source, /getVisibleHomeCards\(\)\.map\(renderProjectCard\)/);
  assert.doesNotMatch(source, /const projectCards = homeCards\.map\(renderProjectCard\)/);
});

test("hiding a homepage card does not own or alter its standalone route", () => {
  for (const card of homeCards) {
    const href = getHomeCardHref(card);
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
