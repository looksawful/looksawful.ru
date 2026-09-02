import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CV_EXPERIENCE_IDS, cvContent, parseCvContent } from "../src/data/cv.ts";
import { transformCvContent } from "../tools/lib/cv-content.mjs";

const expectedCounts = {
  jestei: { cases: 18, facts: 0, links: 2 }, styx: { cases: 8, facts: 1, links: 2 },
  illumihand: { cases: 3, facts: 2, links: 0 }, madcow: { cases: 2, facts: 0, links: 2 },
  sensetique: { cases: 0, facts: 0, links: 1 }, line: { cases: 3, facts: 0, links: 1 },
  berry: { cases: 3, facts: 2, links: 0 }, ss: { cases: 5, facts: 1, links: 1 },
  olovo: { cases: 6, facts: 2, links: 2 }, theatre: { cases: 3, facts: 2, links: 1 },
  soroka: { cases: 3, facts: 2, links: 0 }, kursovoy: { cases: 0, facts: 2, links: 0 },
  ran: { cases: 4, facts: 2, links: 0 }, progress: { cases: 2, facts: 0, links: 1 }, ria: { cases: 0, facts: 0, links: 0 },
};

const clone = (value) => structuredClone(value);
const editorialUrl = new URL("../src/content/editorial/cv.json", import.meta.url);
const structureUrl = new URL("../src/content/cv.json", import.meta.url);

function experienceSheet(html) {
  const match = html.match(/<section\b[^>]*class="experience-sheet"[\s\S]*?<\/section>/i);
  assert.ok(match);
  return match[0];
}
const hrefs = (html) => [...experienceSheet(html).matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
function articleFor(html, id) {
  const matches = [...html.matchAll(new RegExp(`<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${id}\\b[^"']*["'])[^>]*>[\\s\\S]*?<\\/article>`, "gi"))];
  assert.equal(matches.length, 1);
  return matches[0][0];
}

test("experience authored source owns copy only while IDs, visibility and links stay structural", async () => {
  const editorial = JSON.parse(await readFile(editorialUrl, "utf8"));
  const structure = JSON.parse(await readFile(structureUrl, "utf8"));
  assert.deepEqual(Object.keys(editorial.experience), [...CV_EXPERIENCE_IDS]);
  assert.deepEqual(Object.keys(structure.experience), [...CV_EXPERIENCE_IDS]);

  for (const id of CV_EXPERIENCE_IDS) {
    const copy = editorial.experience[id];
    const state = structure.experience[id];
    assert.deepEqual(Object.keys(state).sort(), ["links", "visible"]);
    assert.equal(typeof state.visible, "boolean");
    assert.equal("id" in copy, false);
    assert.equal("visible" in copy, false);
    assert.equal("links" in copy, false);
    assert.ok(["company", "context", "period", "role", "description", "cases", "facts"].every((key) => key in copy));
  }
});

test("composed experience retains fixed presentation counts and approved copy", () => {
  assert.deepEqual(cvContent.experience.map(({ id }) => id), [...CV_EXPERIENCE_IDS]);
  for (const entry of cvContent.experience) {
    const counts = expectedCounts[entry.id];
    assert.equal(entry.cases.length, counts.cases, `${entry.id} cases`);
    assert.equal(entry.facts.length, counts.facts, `${entry.id} facts`);
    assert.equal(entry.links.length, counts.links, `${entry.id} links`);
  }
  const byId = new Map(cvContent.experience.map((entry) => [entry.id, entry]));
  assert.equal(byId.get("ria")?.role, "Дизайнер");
  assert.equal(byId.get("ria")?.description, "Работал верстальщиком в ежедневной городской общественно-политической газете о Москве");
  assert.deepEqual(byId.get("line")?.facts, []);
  assert.deepEqual(byId.get("progress")?.facts, []);
});

test("full runtime parser accepts copy edits but rejects architecture and shape drift", () => {
  const source = clone(cvContent);
  assert.deepEqual(parseCvContent(clone(source)), source);
  const edited = clone(source);
  edited.experience[0].company = "JESTEI & POOL";
  edited.experience[0].description = "Новый <текст>";
  assert.equal(parseCvContent(edited).experience[0].company, "JESTEI & POOL");

  const routeLeak = clone(source);
  routeLeak.experience[0].route = "/changed-by-cms/";
  assert.throws(() => parseCvContent(routeLeak), /unexpected|field|key/i);
  const countDrift = clone(source);
  countDrift.experience[0].cases.pop();
  assert.throws(() => parseCvContent(countDrift), /count|length|cases/i);
});

test("experience transform changes copy while preserving code-owned hrefs and classes", async () => {
  const originalHtml = await readFile(new URL("../public/cv/index.html", import.meta.url), "utf8");
  const edited = clone(cvContent);
  const jestei = edited.experience.find(({ id }) => id === "jestei");
  const styx = edited.experience.find(({ id }) => id === "styx");
  jestei.role = "Арт-директор & дизайн-лид";
  jestei.cases[0] = "Кейс & исследование";
  styx.facts[0].text = "Факт <сохранён> & обновлён";
  const transformed = transformCvContent(originalHtml, parseCvContent(edited)).html;
  assert.deepEqual(hrefs(transformed), hrefs(originalHtml));
  assert.match(articleFor(transformed, "jestei"), /Арт-директор &amp; дизайн-лид/);
  assert.match(articleFor(transformed, "styx"), /Факт &lt;сохранён&gt; &amp; обновлён/);
});

test("Pages CMS experience editor exposes copy fields only", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const cvConfig = cms.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  assert.match(cvConfig, /path: src\/content\/editorial\/cv\.json/);
  for (const forbidden of ["visible", "links", "href", "route", "className", "target", "rel", "layout"]) {
    assert.doesNotMatch(cvConfig, new RegExp(`- name: ${forbidden}\\b`));
  }
});
