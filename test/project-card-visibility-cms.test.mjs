import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { projects } from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";

const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);
const expectedIds = ["jestei", "styx", "sensetique", "shootings"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("project cards keep fixed identity while homepage visibility remains editable", () => {
  assert.deepEqual(projects.map(({ id }) => id), expectedIds);
  assert.ok(projects.every(({ visible }) => typeof visible === "boolean"));
});

test("homepage project selection filters only cards whose CMS visibility is false", async () => {
  const dataModule = await import("../src/data/projects.ts");
  assert.equal(typeof dataModule.getHomepageProjects, "function");

  const fixture = clone(projects).map((project) => ({ ...project, visible: true }));
  fixture[0].visible = false;

  assert.deepEqual(
    dataModule.getHomepageProjects(fixture).map(({ id }) => id),
    expectedIds.slice(1),
  );
});

test("homepage renderer uses the visibility-filtered project collection", async () => {
  const source = await readFile(homeSlotsUrl, "utf8");
  assert.match(source, /getHomepageProjects\(\)\.map\(renderProjectCard\)/);
  assert.doesNotMatch(source, /const projectCards = projects\.map\(renderProjectCard\)/);
});

test("hiding a homepage card does not own or alter its standalone route", () => {
  assert.equal(getProjectCardHref("jestei"), "/work/jestei-pool/");
  assert.equal(getProjectCardHref("styx"), "/work/styx/");
  assert.equal(getProjectCardHref("sensetique"), "/work/sensetique/");
  assert.equal(getProjectCardHref("shootings"), "/shootings/");
});

test("Pages CMS exposes homepage visibility but no route controls for project cards", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const projectCardsBlock = cmsConfig.match(/\n  - name: project-cards\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";

  assert.match(projectCardsBlock, /- name: visible\b[\s\S]*?type: boolean/);
  assert.match(projectCardsBlock, /label: Показывать на главной/);
  assert.doesNotMatch(projectCardsBlock, /- name: (route|canonical|listed|indexable|slug|pageType)\b/);
});
