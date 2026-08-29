import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { navigationLabels } from "../src/data/navigation.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";
import { renderSiteNavigation } from "../src/site/shell/navigation.ts";
import { escapeHtml } from "../src/utils/html.ts";

const page = (id) => {
  const found = sitePages.find((candidate) => candidate.id === id);
  assert.ok(found, `missing page ${id}`);
  return found;
};

const labelById = new Map(navigationLabels.map(({ id, label }) => [id, label]));
const requireLabel = (id) => {
  const label = labelById.get(id);
  assert.ok(label, `missing navigation label ${id}`);
  return label;
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const primaryDestinations = [
  ["home", "/"],
  ["case:jestei-pool", "/work/jestei-pool/"],
  ["case:styx", "/work/styx/"],
  ["case:sensetique", "/work/sensetique/"],
  ["collection:music-photography", "/shootings/"],
  ["cv", "/cv/"],
].map(([id, href]) => [requireLabel(id), href]);

test("global menu contains exactly the six public primary destinations and no Work item", () => {
  const html = renderSiteNavigation(page("case:jestei-pool"));

  for (const [label, href] of primaryDestinations) {
    assert.match(
      html,
      new RegExp(`href="${escapeRegExp(href)}"[^>]*>${escapeRegExp(escapeHtml(label))}<`),
    );
  }

  assert.doesNotMatch(html, />Work</);
  assert.doesNotMatch(html, /Awful Cases|Moves Awful|Berry/);
});

test("navigation exposes an accessible hamburger control and menu relationship", () => {
  const html = renderSiteNavigation(page("case:styx"));

  assert.match(html, /<button[^>]+data-site-menu-toggle/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="site-menu"/);
  assert.match(html, /id="site-menu"[^>]+data-site-menu/);
});

test("current public destination is marked and breadcrumb is shallow", () => {
  const html = renderSiteNavigation(page("collection:music-photography"));
  const homeLabel = escapeRegExp(escapeHtml(requireLabel("home")));
  const shootingsLabel = escapeRegExp(
    escapeHtml(requireLabel("collection:music-photography")),
  );

  assert.match(
    html,
    new RegExp(`href="/shootings/"[^>]+aria-current="page"[^>]*>${shootingsLabel}<`),
  );
  assert.match(html, /aria-label="Хлебные крошки"/);
  assert.match(html, new RegExp(`href="/">${homeLabel}<\\/a>`));
  assert.match(
    html,
    new RegExp(`aria-current="page"[^>]*>${shootingsLabel}<\\/span>`),
  );
  assert.doesNotMatch(html, />Work<\/a>/);
});

test("direct-link project receives a breadcrumb but is not promoted into the primary menu", () => {
  const html = renderSiteNavigation(page("project:awful-cases"));
  const homeLabel = escapeRegExp(escapeHtml(requireLabel("home")));

  assert.match(html, new RegExp(`href="/">${homeLabel}<\\/a>`));
  assert.match(html, /aria-current="page"[^>]*>Awful Cases<\/span>/);
  assert.doesNotMatch(html, /href="\/work\/awful-cases\/"[^>]*>Awful Cases<\/a>/);
});

test("homepage build renders the same live global navigation instead of the legacy hidden Work nav", () => {
  const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const html = renderHomepagePage(source);

  assert.match(html, /data-site-navigation/);
  assert.doesNotMatch(html, /data-site-navigation[^>]*hidden/);
  assert.doesNotMatch(html, />Work<\/a>/);

  for (const [label, href] of primaryDestinations) {
    assert.match(
      html,
      new RegExp(`href="${escapeRegExp(href)}"[^>]*>${escapeRegExp(escapeHtml(label))}<`),
    );
  }
});
