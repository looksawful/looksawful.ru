import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const responsive = await readFile(".github/workflows/ui-responsive.yml", "utf8");
const pages = await readFile(".github/workflows/pages.yml", "utf8");

test("manual responsive UI pilots only the pinned Chromium headless shell and proves launch", () => {
  assert.match(responsive, /npx playwright install --with-deps --only-shell chromium/);
  assert.match(responsive, /node tools\/ci\/browser-launch-probe\.mjs/);
  assert.doesNotMatch(responsive, /actions\/cache/);
  assert.doesNotMatch(responsive, /ms-playwright|playwright-chromium-/);
  assert.doesNotMatch(responsive, /\.github\/actions\/setup-browser/);
});

test("production browser provisioning stays untouched during the pilot", () => {
  assert.match(pages, /key: playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
  assert.match(pages, /npx playwright install --with-deps chromium/);
  assert.doesNotMatch(pages, /--only-shell/);
});
