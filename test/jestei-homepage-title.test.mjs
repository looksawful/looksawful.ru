import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const approvedTitle = "Главная страница Jestei Pool";
const rejectedTitle = "Экономичная персонализация главной страницы Jestei Pool";
const entriesSource = readFileSync(
  new URL("../src/data/media/entries/jestei.ts", import.meta.url),
  "utf8",
);
const catalogRecord = JSON.parse(
  readFileSync(
    new URL("../src/content/media-catalog/registered/jestei-02-source-01-16x10.json", import.meta.url),
    "utf8",
  ),
);

test("Jestei homepage mockup uses the approved concise title everywhere", () => {
  assert.doesNotMatch(entriesSource, new RegExp(rejectedTitle));
  assert.match(entriesSource, new RegExp(`title: "${approvedTitle}"`));
  assert.equal(catalogRecord.title, approvedTitle);
});
