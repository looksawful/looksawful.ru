import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../src/site/pages/homepage.ts";
import { getPageByPath } from "../src/site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const expected = [
  ["case", "jestei-pool", "compact", 10],
  ["case", "styx", "compact", 20],
  ["case", "sensetique", "compact", 30],
  ["collection", "music-photography", "compact", 40],
];

const compactContracts = [
  {
    path: "/work/jestei-pool/",
    articleId: "project-jestei",
    keptSections: [
      "jestei-featured",
      "jestei-home",
      "jestei-brand",
      "jestei-event",
    ],
    standaloneOnlySection: "jestei-interface",
  },
  {
    path: "/work/styx/",
    articleId: "project-styx",
    keptSections: ["styx-brand", "styx-logo-banner"],
    standaloneOnlySection: "styx-production-preview",
  },
  {
    path: "/work/sensetique/",
    articleId: "project-sensetique",
    keptSections: ["sensetique-studio-preview", "sensetique-studio"],
    standaloneOnlySection: "sensetique-equipment",
  },
  {
    path: "/shootings/",
    articleId: "project-shootings",
    keptSections: ["shootings-obladaet", "shootings-obladaet-collage"],
    standaloneOnlySection: "shootings-obladaet-portraits",
  },
];

test("homepage presentation uses compact previews in the canonical portfolio order", () => {
  assert.deepEqual(
    homepageEntries.map((entry) => [entry.entity.type, entry.entity.id, entry.mode, entry.order]),
    expected,
  );
  assert.doesNotThrow(() => assertHomepagePresentationSupported(homepageEntries));
});
test("compact homepage previews render curated Jestei sections while leaving standalone content intact", () => {
  const homepage = renderHomepagePage(indexSource);

  for (const contract of compactContracts) {
    assert.match(homepage, new RegExp(`id="${contract.articleId}"`));
    for (const sectionId of contract.keptSections) {
      assert.match(homepage, new RegExp(`id="${sectionId}"`));
    }
    assert.doesNotMatch(homepage, new RegExp(`id="${contract.standaloneOnlySection}"`));

    const page = getPageByPath(contract.path);
    assert.ok(page && (page.type === "case" || page.type === "collection"));
    const standalone = renderStandaloneEntityPage(page);
    assert.match(standalone, new RegExp(`id="${contract.standaloneOnlySection}"`));
  }
});

test("Jestei compact preview exposes both intro and terminal links to the full canonical case", () => {
  const homepage = renderHomepagePage(indexSource);
  const start = homepage.indexOf('id="project-jestei"');
  const end = homepage.indexOf('id="project-styx"');
  assert.ok(start >= 0 && end > start);

  const jestei = homepage.slice(start, end);
  assert.match(jestei, /class="project__links cluster"[\s\S]*href="\/work\/jestei-pool\/"[\s\S]*>Полный кейс<\/a>/);
  assert.match(jestei, /class="project-preview-entry"[\s\S]*href="\/work\/jestei-pool\/"[\s\S]*Полный кейс Jestei Pool/);
});
