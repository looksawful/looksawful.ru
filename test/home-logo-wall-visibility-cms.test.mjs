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

test("Homepage logo-wall visibility keeps stable identity and is disabled by content state", async () => {
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));

  assert.deepEqual(homeSectionIds, ["client-logo-wall"]);
  assert.deepEqual(visibility, [{ id: "client-logo-wall", visible: false }]);
  assert.equal(isHomeSectionVisible("client-logo-wall"), false);
});

test("Homepage logo-wall visibility remains a reversible boolean contract", () => {
  assert.deepEqual(
    parseSectionVisibility(
      [{ id: "client-logo-wall", visible: true }],
      homeSectionIds,
    ),
    [{ id: "client-logo-wall", visible: true }],
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

test("disabled logo wall is absent from generated Homepage output", async () => {
  const indexHtml = await readFile(indexUrl, "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.doesNotMatch(rendered, /portfolio-showcase--clients/);
  assert.doesNotMatch(rendered, /id="portfolio-clients-title"/);
  assert.doesNotMatch(rendered, /portfolio-logo-wall/);
  assert.doesNotMatch(rendered, /data-infinite-reel-track[^>]*>[\s\S]*?CLIENT_LOGOS/);
});

test("Homepage visibility content is explicitly authorized for CMS publication", () => {
  assert.equal(
    classifyCmsPublicationPath("src/content/visibility/home.json"),
    CMS_PUBLICATION_CLASS.CMS_CONTENT,
  );
});
