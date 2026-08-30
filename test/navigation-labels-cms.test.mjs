import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  NAVIGATION_LABEL_IDS,
  parseNavigationLabels,
} from "../src/data/navigation.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
} from "../src/site/navigation/model.ts";

const fixture = [
  { id: "home", label: "Старт" },
  { id: "case:jestei-pool", label: "Музыка" },
  { id: "case:styx", label: "Украшения" },
  { id: "case:sensetique", label: "Студия" },
  { id: "collection:music-photography", label: "Съёмки" },
  { id: "cv", label: "Опыт" },
];

const page = (id) => {
  const found = sitePages.find((candidate) => candidate.id === id);
  assert.ok(found, `missing page ${id}`);
  return found;
};

test("navigation label adapter keeps fixed identity and restores canonical order", () => {
  const parsed = parseNavigationLabels([...fixture].reverse());

  assert.deepEqual(parsed.map(({ id }) => id), NAVIGATION_LABEL_IDS);
  assert.deepEqual(
    parsed.map(({ label }) => label),
    ["Старт", "Музыка", "Украшения", "Студия", "Съёмки", "Опыт"],
  );
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

test("edited CMS labels feed both menu and breadcrumbs while hrefs stay code-owned", () => {
  const labels = parseNavigationLabels(fixture);

  assert.deepEqual(getPrimaryNavigationItems(labels), [
    { id: "home", label: "Старт", href: "/" },
    { id: "case:jestei-pool", label: "Музыка", href: "/work/jestei-pool/" },
    { id: "case:styx", label: "Украшения", href: "/work/styx/" },
    { id: "case:sensetique", label: "Студия", href: "/work/sensetique/" },
    { id: "collection:music-photography", label: "Съёмки", href: "/shootings/" },
    { id: "cv", label: "Опыт", href: "/cv/" },
  ]);

  assert.deepEqual(getBreadcrumbItems(page("case:jestei-pool"), labels), [
    { id: "home", label: "Старт", href: "/" },
    { id: "case:jestei-pool", label: "Музыка", current: true },
  ]);
});

test("live navigation content keeps six stable IDs with editable non-empty labels", async () => {
  const content = JSON.parse(
    await readFile(new URL("../src/content/navigation.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(content.map(({ id }) => id), NAVIGATION_LABEL_IDS);
  assert.ok(content.every(({ label }) => typeof label === "string" && label.trim().length > 0));
});

test("Pages CMS exposes only navigation identity and label, never routing", async () => {
  const cmsConfig = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const block = cmsConfig.match(
    /\n  - name: navigation-labels\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/,
  )?.[0] ?? "";

  assert.match(block, /path: src\/content\/navigation\.json/);
  assert.match(block, /- name: id\b[\s\S]*?readonly: true/);
  assert.match(block, /- name: label\b[\s\S]*?type: string/);
  assert.doesNotMatch(block, /- name: (href|path|route|pageId|slug|canonical)\b/);
});
