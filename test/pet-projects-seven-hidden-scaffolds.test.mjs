import assert from "node:assert/strict";
import test from "node:test";

import { otherProjects } from "../src/data/catalog/projects/other.ts";
import { usefulProjectsContent } from "../src/data/content/useful-projects.ts";
import { petProjectCards } from "../src/data/subproject-cards.ts";
import { getEnabledSitePages, getPageByPath, sitePages } from "../src/site/pages/manifest.ts";

const newDraftIds = ["sophisticate", "epson-driver"];
const hiddenCardIds = ["sea", "sophisticate", "epson-driver"];

test("new projects have one canonical catalog record and disabled routes", () => {
  for (const id of newDraftIds) {
    assert.equal(otherProjects.filter((project) => project.id === id).length, 1);
    const page = sitePages.find((candidate) => candidate.id === `project:${id}`);
    assert.ok(page, `missing site page for ${id}`);
    assert.equal(page.enabled, false);
    assert.equal(page.discovery.listed, false);
    assert.equal(page.discovery.indexable, false);
    assert.equal(getPageByPath(`/work/${id}/`), undefined);
    assert.equal(getEnabledSitePages().some((candidate) => candidate.id === `project:${id}`), false);
  }
});

test("draft cards remain authored but do not reach the public card renderer", () => {
  for (const id of hiddenCardIds) {
    const entry = usefulProjectsContent.cards.find((card) => card.id === id);
    assert.ok(entry, `missing card ${id}`);
    assert.equal(entry.visible, false);
    assert.equal(entry.state, "hidden");
    assert.equal(petProjectCards.some((card) => card.id === id), false);
  }
});
