import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const action = await readFile(".github/actions/setup-browser/action.yml", "utf8");
const responsive = await readFile(".github/workflows/ui-responsive.yml", "utf8");
const pages = await readFile(".github/workflows/pages.yml", "utf8");

test("browser bootstrap installs only the pinned Chromium headless shell and proves launch", () => {
  assert.match(action, /npx playwright install --with-deps --only-shell chromium/);
  assert.match(action, /node tools\/ci\/browser-launch-probe\.mjs/);
  assert.doesNotMatch(action, /actions\/cache/);
  assert.doesNotMatch(action, /package-lock\.json/);
});

test("manual responsive UI is the first isolated consumer of reusable browser setup", () => {
  assert.match(responsive, /uses: \.\/\.github\/actions\/setup-browser/);
  assert.doesNotMatch(responsive, /npx playwright install/);
  assert.doesNotMatch(responsive, /ms-playwright|playwright-chromium-/);
});

test("production browser provisioning stays untouched during the pilot", () => {
  assert.match(pages, /key: playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
  assert.match(pages, /npx playwright install --with-deps chromium/);
});
