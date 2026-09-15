import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("../src/styles/components.css", import.meta.url);
const expertiseUrl = new URL("../src/styles/expertise.css", import.meta.url);
const experienceUrl = new URL("../src/styles/experience.css", import.meta.url);

const [components, expertise, experience] = await Promise.all([
  readFile(componentsUrl, "utf8"),
  readFile(expertiseUrl, "utf8"),
  readFile(experienceUrl, "utf8"),
]);

test("shared page-section foundation remains in the aggregate", () => {
  assert.match(
    components,
    /\.expertise,\s*\.experience,\s*\.projects-grid,\s*\.portfolio-showcase,\s*\.tools\s*\{[\s\S]*?container:\s*page-section \/ inline-size/,
  );
});

test("expertise component details have exactly one dedicated owner", () => {
  assert.match(expertise, /\.expertise \.expertise__list\s*\{/);
  assert.match(expertise, /\.expertise \.expertise__item\s*\{/);
  assert.match(expertise, /\.expertise \.expertise__title\s*\{/);
  assert.doesNotMatch(components, /\.expertise\s*\{\s*& ol\s*\{/s);
  assert.doesNotMatch(components, /@container page-section \(width > 44rem\)[\s\S]*?\.expertise li\s*\{/);
});

test("experience component details have exactly one dedicated owner", () => {
  assert.match(experience, /\.experience \.experience__list\s*\{/);
  assert.match(experience, /\.experience \.experience__item\s*\{/);
  assert.match(experience, /\.experience__period\s*\{/);
  assert.doesNotMatch(components, /\.experience\s*\{\s*& ol\s*\{/s);
  assert.doesNotMatch(components, /@container page-section \(width > 44rem\)[\s\S]*?\.experience li\s*\{/);
});
