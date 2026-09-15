import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  homeSectionIds,
  isHomeSectionVisible,
} from "../src/data/content/home-visibility.ts";
import { parseSectionVisibility } from "../src/data/content/section-visibility.ts";
import {
  applyClientLogoWallVisibility,
  renderHomepage,
} from "../src/site/renderers/home/home-slots.ts";
import {
  classifyCmsPublicationPath,
  CMS_PUBLICATION_CLASS,
} from "../tools/cms-publication-scope.mjs";

const indexUrl = new URL("../index.html", import.meta.url);
const visibilityUrl = new URL("../src/content/visibility/home.json", import.meta.url);

test("Homepage section visibility keeps stable identities and preview content state", async () => {
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));

  assert.deepEqual(homeSectionIds, ["client-logo-wall", "pet-projects"]);
  assert.deepEqual(visibility, [
    { id: "client-logo-wall", visible: false },
    { id: "pet-projects", visible: true },
  ]);
  assert.equal(isHomeSectionVisible("client-logo-wall"), false);
  assert.equal(isHomeSectionVisible("pet-projects"), true);
});

test("Homepage section visibility remains a reversible boolean contract", () => {
  assert.deepEqual(
    parseSectionVisibility(
      [
        { id: "client-logo-wall", visible: true },
        { id: "pet-projects", visible: true },
      ],
      homeSectionIds,
    ),
    [
      { id: "client-logo-wall", visible: true },
      { id: "pet-projects", visible: true },
    ],
  );
});

test("logo-wall visibility removes the complete outer section without a hidden wrapper", () => {
  const fixture = [
    "<main>",
    '<section class="portfolio-showcase portfolio-showcase--clients" aria-labelledby="portfolio-clients-title">',
    '<header><h2 id="portfolio-clients-title">Клиенты</h2></header>',
    '<section class="portfolio-logo-wall" data-infinite-reel><div>logos</div></section>',
    "</section>",
    '<section id="after">after</section>',
    "</main>",
  ].join("");

  assert.equal(applyClientLogoWallVisibility(fixture, true), fixture);

  const hidden = applyClientLogoWallVisibility(fixture, false);
  assert.doesNotMatch(hidden, /portfolio-showcase--clients/);
  assert.doesNotMatch(hidden, /portfolio-clients-title/);
  assert.doesNotMatch(hidden, /portfolio-logo-wall/);
  assert.match(hidden, /<section id="after">after<\/section>/);
});

test("preview Homepage hides clients and renders Useful", async () => {
  const indexHtml = await readFile(indexUrl, "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.doesNotMatch(rendered, /portfolio-showcase--clients/);
  assert.doesNotMatch(rendered, /id="portfolio-clients-title"/);
  assert.doesNotMatch(rendered, /portfolio-logo-wall/);
  assert.doesNotMatch(rendered, /data-infinite-reel-track[^>]*>[\s\S]*?CLIENT_LOGOS/);

  assert.match(rendered, /class="pet-projects"/);
  assert.match(rendered, /id="pet-projects-title"/);
  assert.match(rendered, />Полезное<\/h2>/);
});

test("Useful preview uses one consistent portrait app-card contract", async () => {
  const indexHtml = await readFile(indexUrl, "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.match(rendered, /--pet-card-width:\s*clamp\(13\.5rem,\s*58cqi,\s*20rem\)/);
  assert.match(rendered, /--pet-card-radius:\s*clamp\(1\.125rem,\s*3cqi,\s*1\.75rem\)/);
  assert.match(rendered, /\.pet-projects \.subproject-card\[data-shape\] \.subproject-card__media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/s);
  assert.match(rendered, /\.subproject-card__media :is\(img, video\)\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(rendered, /\.subproject-card__caption\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)[^}]*padding:\s*var\(--size-200\)\s*var\(--size-100\)\s*0/s);
  assert.match(rendered, /\.subproject-card__description\s*\{[^}]*display:\s*-webkit-box[^}]*-webkit-line-clamp:\s*2/s);
  assert.match(rendered, /from,\s*to\s*\{[^}]*scale:\s*0\.94/s);
  assert.doesNotMatch(rendered, /@container subproject-card \(width > 20rem\)/);
});

test("Homepage visibility content is explicitly authorized for CMS publication", () => {
  assert.equal(
    classifyCmsPublicationPath("src/content/visibility/home.json"),
    CMS_PUBLICATION_CLASS.CMS_CONTENT,
  );
});
