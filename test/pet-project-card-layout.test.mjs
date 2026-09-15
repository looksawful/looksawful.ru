import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetUrl = new URL("../src/styles/subproject-cards.css", import.meta.url);

async function readPetProjectStyles() {
  const css = await readFile(stylesheetUrl, "utf8");
  const start = css.indexOf(".pet-projects__grid");
  const end = css.indexOf("@container subproject-card", start);

  assert.notEqual(start, -1, "Pet Projects grid styles must exist");
  assert.notEqual(end, -1, "Pet Projects responsive styles must have a stable boundary");

  return { css, petProjectStyles: css.slice(start, end) };
}

test("Pet Projects cards keep a uniform 4:3 preview frame", async () => {
  const { css } = await readPetProjectStyles();

  assert.match(
    css,
    /\.pet-projects \.subproject-card__media\s*\{\s*aspect-ratio:\s*4\s*\/\s*3;\s*\}/,
  );
});

test("Pet Projects responsive grid remains 1 / 2 / 3 columns", async () => {
  const { petProjectStyles } = await readPetProjectStyles();

  assert.match(
    petProjectStyles,
    /\.pet-projects__grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  );
  assert.match(
    petProjectStyles,
    /@container pet-projects \(width > 42rem\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    petProjectStyles,
    /@container pet-projects \(width > 68rem\)[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/,
  );

  assert.doesNotMatch(petProjectStyles, /repeat\(4,/);
  assert.doesNotMatch(petProjectStyles, /grid-auto-flow:\s*column/);
  assert.doesNotMatch(petProjectStyles, /scroll-snap-type/);
});
