import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parseNavigationLabels,
} from "../src/data/navigation.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
  getWorkNavigationItems,
} from "../src/site/navigation/model.ts";
import {
  NAVIGATION_LABEL_PAGE_IDS,
  PRIMARY_NAVIGATION_PAGE_IDS,
} from "../src/site/navigation/primary.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

const navigationDataUrl = new URL("../src/data/navigation.ts", import.meta.url);

const fixture = [
  { id: "home", label: "Старт" },
  { id: "work", label: "work" },
  { id: "gallery", label: "gallery" },
  { id: "cv", label: "cv" },
];

const page = (id) => {
  const found = sitePages.find((candidate) => candidate.id === id);
  assert.ok(found, `missing page ${id}`);
  return found;
};

test("navigation label adapter keeps Home copy while primary navigation stays Work / Gallery / CV", async () => {
  const parsed = parseNavigationLabels([...fixture].reverse());
  const source = await readFile(navigationDataUrl, "utf8");

  assert.deepEqual(parsed.map(({ id }) => id), NAVIGATION_LABEL_PAGE_IDS);
  assert.deepEqual(
    parsed.map(({ label }) => label),
    ["Старт", "work", "gallery", "cv"],
  );
  assert.match(source, /NAVIGATION_LABEL_PAGE_IDS/);
});

test("navigation label adapter rejects missing, duplicate, unknown and empty content", () => {
  assert.throws(
    () => parseNavigationLabels(fixture.slice(0, -1)),
    /missing required navigation label id|label count/i,
  );
  assert.throws(
    () => parseNavigationLabels([...fixture, fixture[0]]),
    /duplicate navigation label id/i,
  );
  assert.throws(
    () => parseNavigationLabels(fixture.map((item, index) => (
      index === 0 ? { id: "unknown", label: item.label } : item
    ))),
    /unexpected navigation label id/i,
  );
  assert.throws(
    () => parseNavigationLabels(fixture.map((item, index) => (
      index === 0 ? { ...item, label: "" } : item
    ))),
    /label must be a non-empty string/i,
  );
  assert.throws(
    () => parseNavigationLabels(fixture.map((item, index) => (
      index === 0 ? { ...item, label: "   \t" } : item
    ))),
    /label must be a non-empty string/i,
  );
});

test("edited CMS labels feed menu and breadcrumbs while href and preview stay code-owned", () => {
  const labels = parseNavigationLabels(fixture);
  const menu = getPrimaryNavigationItems(labels);

  assert.deepEqual(
    menu.map(({ id, label, href }) => ({ id, label, href })),
    [
      { id: "work", label: "work", href: "/work/" },
      { id: "gallery", label: "gallery", href: "/gallery/" },
      { id: "cv", label: "cv", href: "/cv/" },
    ],
  );
  assert.ok(
    menu.every(({ previewSrc }) => typeof previewSrc === "string" && previewSrc.startsWith("/media/")),
  );

  assert.deepEqual(getBreadcrumbItems(page("case:jestei-pool"), labels), [
    { id: "home", label: "Старт", href: "/" },
    { id: "case:jestei-pool", label: "Jestei Pool", current: true },
  ]);

  assert.deepEqual(
    getWorkNavigationItems().map(({ id, href }) => ({ id, href })),
    [
      { id: "case:jestei-pool", href: "/work/jestei-pool/" },
      { id: "case:styx", href: "/work/styx/" },
      { id: "case:sensetique", href: "/work/sensetique/" },
      { id: "collection:music-photography", href: "/shootings/" },
    ],
  );
});

test("live navigation content keeps stable Home + primary labels with editable non-empty text", async () => {
  const content = JSON.parse(
    await readFile(new URL("../src/content/navigation.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(content.map(({ id }) => id), NAVIGATION_LABEL_PAGE_IDS);
  assert.ok(content.every(({ label }) => typeof label === "string" && label.trim().length > 0));
});

test("Pages CMS exposes only navigation identity and label, never routing or preview ownership", async () => {
  const cmsConfig = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const block = cmsConfig.match(
    /\n  - name: navigation-labels\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/,
  )?.[0] ?? "";

  assert.match(block, /path: src\/content\/navigation\.json/);
  assert.match(block, /- name: id\b[\s\S]*?readonly: true/);
  assert.match(block, /- name: label\b[\s\S]*?type: string/);
  assert.doesNotMatch(block, /- name: (href|path|route|pageId|slug|canonical|preview|previewSrc)\b/);
});
