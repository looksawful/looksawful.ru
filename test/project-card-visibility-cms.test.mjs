import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { projects } from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";

const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("project cards default to visible without changing the current homepage set", () => {
  assert.deepEqual(
    projects.map(({ id, visible }) => [id, visible]),
    [
      ["jestei", true],
      ["styx", true],
      ["sensetique", true],
      ["shootings", true],
    ],
  );
});

test("homepage project selection filters only cards whose CMS visibility is false", async () => {
  const dataModule = await import("../src/data/projects.ts");
  assert.equal(typeof dataModule.getHomepageProjects, "function");

  const fixture = clone(projects);
  fixture[0].visible = false;

  assert.deepEqual(
    dataModule.getHomepageProjects(fixture).map(({ id }) => id),
    ["styx", "sensetique", "shootings"],
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
  const projectCardsBlock = cmsConfig.match(/- name: project-cards\b[\s\S]*?(?=\n  - name: cv\b)/)?.[0] ?? "";

  assert.match(projectCardsBlock, /- name: visible\b[\s\S]*?type: boolean/);
  assert.match(projectCardsBlock, /label: Показывать на главной/);
  assert.doesNotMatch(projectCardsBlock, /- name: (route|canonical|listed|indexable|slug|pageType)\b/);
});
