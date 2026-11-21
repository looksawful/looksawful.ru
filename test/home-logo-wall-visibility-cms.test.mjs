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

const indexUrl = new URL("../index.html", import.meta.url);
const visibilityUrl = new URL("../src/content/visibility/home.json", import.meta.url);

test("Homepage section visibility keeps stable identities and authored boolean state", async () => {
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));

  assert.deepEqual(homeSectionIds, ["client-logo-wall", "pet-projects"]);
  assert.deepEqual(visibility.map(({ id }) => id), [...homeSectionIds]);
  for (const { id, visible } of visibility) {
    assert.equal(typeof visible, "boolean");
    assert.equal(isHomeSectionVisible(id), visible, `authored visibility must reach the renderer for ${id}`);
  }
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

test("Homepage sections follow authored visibility in generated output", async () => {
  const indexHtml = await readFile(indexUrl, "utf8");
  const rendered = renderHomepage(indexHtml);

  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));
  const expectedMarkers = {
    "client-logo-wall": [/portfolio-showcase--clients/, /id="portfolio-clients-title"/, /portfolio-logo-wall/],
    "pet-projects": [/class="pet-projects"/, /id="pet-projects-title"/],
  };
  for (const { id, visible } of visibility) {
    for (const marker of expectedMarkers[id]) {
      assert.equal(marker.test(rendered), visible, `rendered section ${id} must follow authored visibility`);
    }
  }
  assert.doesNotMatch(rendered, /CLIENT_LOGOS/);
});
