import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseJesteiEditorialContent } from "../src/data/content/jestei-editorial.ts";

const source = JSON.parse(
  await readFile(new URL("../src/content/editorial/cases/jestei-pool.json", import.meta.url), "utf8"),
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sectionById(content, id) {
  const section = content.sections.find((candidate) => candidate.id === id);
  assert.ok(section, `Expected Jestei section ${id}`);
  return section;
}

test("Jestei CMS rejects interface copy that cannot feed all three existing overlays", () => {
  const content = clone(source);
  sectionById(content, "interface").paragraphs = sectionById(content, "interface").paragraphs.slice(0, 2);

  assert.throws(
    () => parseJesteiEditorialContent(content),
    /interface.*3|3.*interface|paragraph/i,
  );
});

test("Jestei CMS rejects event copy that cannot feed all four existing overlays", () => {
  const content = clone(source);
  sectionById(content, "event").paragraphs = sectionById(content, "event").paragraphs.slice(0, 3);

  assert.throws(
    () => parseJesteiEditorialContent(content),
    /event.*4|4.*event|paragraph/i,
  );
});

test("Jestei CMS can clear all overlay-fed copy while preserving its fixed slots", () => {
  const content = clone(source);
  sectionById(content, "interface").paragraphs = [];
  delete sectionById(content, "event").paragraphs;

  const parsed = parseJesteiEditorialContent(content);
  assert.deepEqual(sectionById(parsed, "interface").paragraphs, ["", "", ""]);
  assert.deepEqual(sectionById(parsed, "event").paragraphs, ["", "", "", ""]);
});

test("Jestei CMS can leave any individual overlay-fed text slot empty", () => {
  const content = clone(source);
  sectionById(content, "interface").paragraphs[1] = "   ";
  sectionById(content, "event").paragraphs[2] = "";

  const parsed = parseJesteiEditorialContent(content);
  assert.equal(sectionById(parsed, "interface").paragraphs[1], "");
  assert.equal(sectionById(parsed, "event").paragraphs[2], "");
});
