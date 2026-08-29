import assert from "node:assert/strict";
import test from "node:test";

import { projects } from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";
import { createHomepageSlots } from "../src/site/renderers/home/home-slots.ts";

const expected = new Map([
  ["jestei", "/work/jestei-pool/"],
  ["styx", "/work/styx/"],
  ["sensetique", "/work/sensetique/"],
  ["shootings", "/shootings/"],
]);

test("CMS project card IDs resolve through the page layer", () => {
  for (const project of projects) {
    assert.equal(getProjectCardHref(project.id), expected.get(project.id));
  }
});

test("homepage card markup links to enabled standalone routes", () => {
  const cards = createHomepageSlots().find(([marker]) => marker === "<!-- PROJECT_CARDS -->")?.[1];
  assert.ok(cards);

  for (const href of expected.values()) {
    assert.match(cards, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }

  assert.doesNotMatch(cards, /href="#project-(?:jestei|styx|sensetique|shootings)"/);
});
