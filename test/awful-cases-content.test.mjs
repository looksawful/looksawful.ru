import assert from "node:assert/strict";
import test from "node:test";

let content = null;
try {
  content = await import("../src/components/awful-cases-content.js");
} catch {}

const requireContent = () => {
  assert.ok(content, "canonical Awful Cases content module must exist");
  return content;
};

function task(locale, type, input) {
  const { DICTIONARIES } = requireContent();
  return DICTIONARIES[locale].find((item) => item.type === type && item.input === input);
}

test("Awful Cases typography examples preserve enabled real Unicode output", () => {
  assert.equal(task("en", "lint", "\"hello\"")?.output, "«hello»");
  assert.equal(task("ru", "lint", "(c) test")?.output, "© test");
  assert.equal(task("ru", "lint", "(tm) brand")?.output, "™ brand");
});

test("each locale exposes guidance for all actions and learning phases", () => {
  const { COPY } = requireContent();
  const actions = ["upper", "lower", "toggle", "title", "lint", "sentence"];
  const phases = ["tutorial", "practice", "exam"];
  for (const locale of ["en", "ru"]) {
    assert.deepEqual(Object.keys(COPY[locale].actionTitles).sort(), [...actions].sort(), locale);
    assert.deepEqual(Object.keys(COPY[locale].phaseLabels).sort(), [...phases].sort(), locale);
  }
});

test("each locale teaches all six real actions", () => {
  const { DICTIONARIES } = requireContent();
  const required = new Set(["upper", "lower", "toggle", "title", "lint", "sentence"]);
  for (const locale of ["en", "ru"]) {
    const available = new Set(DICTIONARIES[locale].map((item) => item.type));
    assert.deepEqual([...required].filter((type) => !available.has(type)), [], locale);
  }
});
