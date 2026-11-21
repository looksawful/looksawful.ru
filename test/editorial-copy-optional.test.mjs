import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { cvContent, parseCvContent } from "../src/data/cv.ts";
import { parseProjectCardPresentations } from "../src/data/projects.ts";
import { renderProjectCard } from "../src/templates/project-card.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";
import { transformCvContent } from "../tools/lib/cv-content.mjs";

const clone = (value) => structuredClone(value);

test("project-card copy derives omitted canonical values while explicit teaser overrides stay editable", async () => {
  const [structure, copy] = await Promise.all([
    readFile(new URL("../src/content/projects.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../src/content/editorial/home-project-cards.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const editedCopy = clone(copy);
  delete editedCopy.jestei.title;
  editedCopy.jestei.focus = "   ";
  editedCopy.jestei.role = "";
  delete editedCopy.jestei.period;
  delete editedCopy.jestei.ariaLabel;
  editedCopy.jestei.coverAlt = "   ";

  const parsed = parseProjectCardPresentations(structure, editedCopy);
  assert.equal(parsed[0].title, "Jestei Pool");
  assert.equal(parsed[0].focus, "");
  assert.equal(parsed[0].role, "");
  assert.equal(parsed[0].period, "2024–2026");
  assert.equal(parsed[0].cover.alt, "");

  const html = renderProjectCard(parsed[0]);
  assert.match(html, /aria-label="Перейти к проекту Jestei Pool"/);
  assert.match(html, /project-card__name/);
  assert.doesNotMatch(html, /project-card__focus/);
  assert.doesNotMatch(html, /project-card__role/);

  const invalidCopy = clone(copy);
  invalidCopy.jestei.title = 42;
  assert.throws(() => parseProjectCardPresentations(structure, invalidCopy), /title.*string/i);

  const missingTechnicalSource = clone(structure);
  delete missingTechnicalSource[0].cover.src;
  assert.throws(() => parseProjectCardPresentations(missingTechnicalSource, copy), /cover.*src/i);
});

test("empty project and section copy produces no empty editorial wrappers", () => {
  assert.equal(
    renderProjectIntro({
      head: { type: "text", text: "" },
      title: { type: "text", text: "" },
      role: "",
      period: "",
      summary: "",
      lead: "",
    }),
    "",
  );
  assert.equal(renderSectionIntro({ title: "", paragraphs: [""] }), "");
});

test("empty composed CV copy is normalized and hidden without generating broken contact links", async () => {
  const sourceHtml = await readFile(new URL("../public/cv/index.html", import.meta.url), "utf8");
  const edited = clone(cvContent);

  for (const key of ["name", "role", "aboutPrimary", "aboutSecondary"]) delete edited.profile[key];
  edited.profile.contacts = {};
  edited.profile.principles = edited.profile.principles.map(({ id }) => ({ id }));
  edited.profile.languages = edited.profile.languages.map(({ id }) => ({ id }));

  for (const section of Object.values(edited.skills)) {
    delete section.title;
    section.rows = section.rows.map(({ id }) => ({ id }));
  }

  delete edited.education.higherTitle;
  edited.education.higher = { id: edited.education.higher.id };
  delete edited.education.additionalTitle;
  edited.education.additional = edited.education.additional.map(({ id }) => ({ id }));

  edited.experience = edited.experience.map(({ id, visible }) => ({ id, visible, cases: [], facts: [], links: [] }));

  const parsed = parseCvContent(edited);
  const html = transformCvContent(sourceHtml, parsed).html;
  assert.equal(parsed.profile.name, "");
  assert.match(html, /<h1\b[^>]*class="name"[^>]* hidden>/);
  assert.match(html, /<div\b[^>]*class="contacts"[^>]* hidden>/);
  assert.match(html, /<div\b[^>]*class="url"[^>]* hidden>/);
  assert.doesNotMatch(html, /href="tel:"/);
  assert.doesNotMatch(html, /href="mailto:"/);
  assert.doesNotMatch(html, /href="https:\/\/t\.me\/"/);
  assert.match(html, /<section\b[^>]*class="[^"]*\bhard\b[^"]*"[^>]* hidden>/);
  assert.match(html, /<section\b[^>]*class="education"[^>]* hidden>/);
  assert.match(html, /<div class="course" hidden>/);
  assert.match(html, /<article\b[^>]*experience-card--jestei[^>]* hidden>/);
  assert.match(html, /<h3\b[^>]*class="experience-company"[^>]* hidden>/);
  assert.match(html, /<div\b[^>]*class="experience-cases"[^>]* hidden>/);
});
