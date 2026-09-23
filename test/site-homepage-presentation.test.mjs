import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../src/site/pages/homepage.ts";
import { getPageByPath } from "../src/site/pages/manifest.ts";
import { extractElementContainingMarker } from "../src/site/rendering/html.ts";
import { portfolioPresentation } from "../src/site/pages/portfolio-presentation.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const expected = [
  ["case", "jestei-pool", "compact", 10],
  ["case", "styx", "compact", 20],
  ["case", "sensetique", "compact", 30],
  ["collection", "music-photography", "none", 40],
];

const compactContracts = [
  {
    path: "/work/jestei-pool/",
    articleId: "project-jestei",
    keptSections: ["jestei-home", "jestei-brand", "jestei-event"],
    standaloneOnlySection: "jestei-interface",
  },
  {
    path: "/work/styx/",
    articleId: "project-styx",
    keptSections: ["styx-production-preview", "styx-production-media"],
    standaloneOnlySection: "styx-brand",
  },
  {
    path: "/work/sensetique/",
    articleId: "project-sensetique",
    keptSections: ["sensetique-studio-preview", "sensetique-harsh-light"],
    standaloneOnlySection: "sensetique-equipment",
  },
];

test("homepage presentation uses the approved compact portfolio order", () => {
  assert.deepEqual(
    homepageEntries.map((entry) => [entry.entity.type, entry.entity.id, entry.mode, entry.order]),
    expected,
  );
  assert.doesNotThrow(() => assertHomepagePresentationSupported(homepageEntries));
});

test("compact homepage previews render the approved visual selections", () => {
  const homepage = renderHomepagePage(indexSource);
  assert.doesNotMatch(homepage, /id="project-shootings"/);

  for (const contract of compactContracts) {
    assert.match(homepage, new RegExp(`id="${contract.articleId}"`));
    for (const sectionId of contract.keptSections) {
      assert.match(homepage, new RegExp(`id="${sectionId}"`));
    }
    assert.doesNotMatch(homepage, new RegExp(`id="${contract.standaloneOnlySection}"`));
    const page = getPageByPath(contract.path);
    assert.ok(page && page.type === "case");
    const standalone = renderStandaloneEntityPage(page);
    assert.match(standalone, new RegExp(`id="${contract.standaloneOnlySection}"`));
  }
});

test("Jestei compact preview exposes only the terminal full-case CTA", () => {
  const homepage = renderHomepagePage(indexSource);
  const start = homepage.indexOf('id="project-jestei"');
  const end = homepage.indexOf('id="project-styx"');
  assert.ok(start >= 0 && end > start);

  const jestei = homepage.slice(start, end);
  assert.doesNotMatch(jestei, /class="project__links cluster"/);
  assert.match(
    jestei,
    /class="project-preview-entry"[\s\S]*href="\/work\/jestei-pool\/"[\s\S]*Подробнее о проекте/,
  );
});

test("standalone Jestei keeps compact metadata without duplicating project identity", () => {
  const homepage = renderHomepagePage(indexSource);
  const homeStart = homepage.indexOf('id="project-jestei"');
  const homeEnd = homepage.indexOf('id="project-styx"');
  const homeJestei = homepage.slice(homeStart, homeEnd);
  assert.match(homeJestei, /class="project__head"/);

  const page = getPageByPath("/work/jestei-pool/");
  assert.ok(page && page.type === "case");
  const standalone = renderStandaloneEntityPage(page);
  assert.match(standalone, /class="project__head"/);
  assert.doesNotMatch(standalone, /class="project__name"/);
  assert.match(standalone, /class="project__role"/);
  assert.match(standalone, /class="project__period"/);
  assert.match(standalone, /class="project__intro wrapper editorial-grid"/);
  assert.match(standalone, /class="project__title project__title--logo"/);
});

test("project preview CTA uses compact desktop sizing and full-width mobile sizing", () => {
  const css = readFileSync(new URL("../src/styles/project-shell.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.project-preview-entry__link\s*\{[\s\S]*?inline-size:\s*100%;[\s\S]*?border-radius:\s*var\(--radius-contained\);[\s\S]*?background:\s*var\(--clr-text\);/,
  );
  assert.match(
    css,
    /@container project \(width > 50rem\)[\s\S]*?\.project-preview-entry__link\s*\{[\s\S]*?inline-size:\s*fit-content;/,
  );
});


test("homepage keeps unresolved Featured membership fail-closed", () => {
  const homepage = renderHomepagePage(indexSource);
  assert.doesNotMatch(homepage, /class="pet-projects"/);
});

test("homepage Featured section is driven only by portfolio presentation membership", () => {
  const homepage = renderHomepagePage(indexSource, {
    ...portfolioPresentation,
    featured: [
      "project:awful-cases",
      "project:moves-awful",
      "collection:music-photography",
    ],
  });

  const positions = [
    homepage.indexOf('class="hero"'),
    homepage.indexOf('class="projects-grid"'),
    homepage.indexOf('id="project-jestei"'),
    homepage.indexOf('id="project-styx"'),
    homepage.indexOf('id="project-sensetique"'),
    homepage.indexOf('class="pet-projects"'),
  ];

  assert.ok(positions.every((position) => position >= 0), `missing homepage layer: ${positions.join(", ")}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(homepage, /class="pet-projects"[^>]*aria-labelledby="featured-projects-title"/);

  const projectIndex = extractElementContainingMarker(
    homepage,
    "section",
    'id="projects-grid-title"',
  );
  const featured = extractElementContainingMarker(
    homepage,
    "section",
    'id="featured-projects-title"',
  );

  for (const href of [
    "/work/awful-cases/",
    "/work/moves-awful/",
    "/shootings/",
  ]) {
    const linkPattern = new RegExp(`href="${href}"`, "g");
    assert.equal((projectIndex.match(linkPattern) ?? []).length, 1, `Project index: ${href}`);
    assert.equal((featured.match(linkPattern) ?? []).length, 1, `Featured: ${href}`);
  }

  assert.doesNotMatch(projectIndex, /href="\/work\/berserk-timer\//);
  assert.doesNotMatch(featured, /href="\/work\/berserk-timer\//);
  assert.match(homepage, /class="subproject-card"/);
  assert.match(homepage, /class="project-card"/);
  assert.match(homepage, /\.pet-projects \.project-card\b/);
  assert.match(homepage, /\.pet-projects__grid > li\b/);
});
