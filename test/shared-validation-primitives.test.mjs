import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as validation from "../src/data/content/editorial-validation.ts";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared editorial validation exposes structural boolean and positive-integer primitives", () => {
  assert.equal(typeof validation.expectBoolean, "function");
  assert.equal(typeof validation.expectPositiveInteger, "function");

  assert.equal(validation.expectBoolean(true, "flag"), true);
  assert.equal(validation.expectBoolean(false, "flag"), false);
  assert.throws(() => validation.expectBoolean("true", "flag"), /flag must be a boolean/);

  assert.equal(validation.expectPositiveInteger(1, "width"), 1);
  assert.equal(validation.expectPositiveInteger(2048, "width"), 2048);
  for (const invalid of [0, -1, 1.5, "1", null]) {
    assert.throws(
      () => validation.expectPositiveInteger(invalid, "width"),
      /width must be a positive integer/,
    );
  }
});

test("data and CMS adapters consume shared record validation instead of redefining it", async () => {
  const paths = [
    "src/data/projects.ts",
    "src/data/clients.ts",
    "src/data/navigation.ts",
    "src/data/cv.ts",
  ];

  for (const path of paths) {
    const text = await source(path);
    assert.match(text, /editorial-validation\.ts/);
    assert.doesNotMatch(text, /function isRecord\s*\(/, `${path} must use expectRecord`);
  }

  const cv = await source("src/data/cv.ts");
  assert.doesNotMatch(cv, /function expectAllowedKeys\s*\(/, "CV must use shared key validation");
});

test("boolean structural fields use the same shared primitive across adapters", async () => {
  for (const path of ["src/data/projects.ts", "src/data/clients.ts", "src/data/cv.ts"]) {
    const text = await source(path);
    assert.match(text, /expectBoolean\(/, `${path} must consume expectBoolean`);
  }

  const projects = await source("src/data/projects.ts");
  assert.doesNotMatch(projects, /function requireBoolean\s*\(/);
  assert.doesNotMatch(projects, /function requirePositiveInteger\s*\(/);
  assert.match(projects, /expectPositiveInteger\(/);
});
