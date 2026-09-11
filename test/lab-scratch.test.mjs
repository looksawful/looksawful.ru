import test from "node:test";
import assert from "node:assert/strict";

import {
  LAB_SCRATCH_STORAGE_KEY,
  LAB_SCRATCH_STYLE_ID,
  applyScratchCss,
  readScratchCss,
  resetScratchCss,
  writeScratchCss,
} from "../src/devtools/lab/scratch.ts";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function createDocumentFixture() {
  const elements = new Map();
  const doc = {
    getElementById(id) {
      return elements.get(id) ?? null;
    },
    createElement(tagName) {
      assert.equal(tagName, "style");
      const style = {
        id: "",
        dataset: {},
        textContent: "",
        remove() {
          elements.delete(style.id);
        },
      };
      return style;
    },
    head: {
      append(style) {
        elements.set(style.id, style);
      },
    },
  };
  return { doc, elements };
}

test("Lab scratch uses a fresh v2 storage namespace", () => {
  assert.equal(LAB_SCRATCH_STORAGE_KEY, "looksawful:lab:scratch-css:v2");
  assert.equal(LAB_SCRATCH_STYLE_ID, "looksawful-lab-scratch-style");
});

test("scratch storage preserves exact non-empty CSS and removes empty CSS", () => {
  const storage = createStorage();
  const css = ".project-card { border-radius: 24px; }\n";

  writeScratchCss(storage, css);
  assert.equal(readScratchCss(storage), css);
  assert.equal(storage.values.get(LAB_SCRATCH_STORAGE_KEY), css);

  writeScratchCss(storage, "");
  assert.equal(storage.values.has(LAB_SCRATCH_STORAGE_KEY), false);
  assert.equal(readScratchCss(storage), "");
});

test("applyScratchCss owns only the Lab scratch style node", () => {
  const { doc, elements } = createDocumentFixture();

  applyScratchCss(doc, "body { outline: 1px solid red; }");

  const style = elements.get(LAB_SCRATCH_STYLE_ID);
  assert.ok(style);
  assert.equal(style.dataset.labOwned, "scratch-css");
  assert.equal(style.textContent, "body { outline: 1px solid red; }");
});

test("reset removes stored CSS and only the Lab-owned scratch style", () => {
  const storage = createStorage({
    [LAB_SCRATCH_STORAGE_KEY]: ".x { opacity: .5; }",
  });
  const { doc, elements } = createDocumentFixture();

  const unrelated = {
    id: "site-runtime-style",
    dataset: {},
    textContent: ".site { display: block; }",
    remove() {
      elements.delete(unrelated.id);
    },
  };
  elements.set(unrelated.id, unrelated);

  applyScratchCss(doc, ".x { opacity: .5; }");
  resetScratchCss(doc, storage);

  assert.equal(storage.values.has(LAB_SCRATCH_STORAGE_KEY), false);
  assert.equal(elements.has(LAB_SCRATCH_STYLE_ID), false);
  assert.equal(elements.get("site-runtime-style"), unrelated);
});
