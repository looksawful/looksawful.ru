import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const action = await readFile(".github/actions/setup-browser/action.yml", "utf8");
const responsive = await readFile(".github/workflows/ui-responsive.yml", "utf8");
const pages = await readFile(".github/workflows/pages.yml", "utf8");

test("responsive UI uses the fixed pinned Chromium headless-shell setup", () => {
  assert.match(action, /npx playwright install --with-deps --only-shell chromium/);
  assert.match(action, /node tools\/ci\/browser-launch-probe\.mjs/);
  assert.doesNotMatch(action, /actions\/cache/);
  assert.doesNotMatch(action, /ms-playwright|playwright-chromium-/);

  assert.match(responsive, /uses: \.\/\.github\/actions\/setup-browser/);
  assert.doesNotMatch(responsive, /npx playwright install/);
  assert.doesNotMatch(responsive, /browser-launch-probe\.mjs/);
});

test("production browser provisioning stays untouched during reusable extraction", () => {
  assert.match(pages, /key: playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
  assert.match(pages, /npx playwright install --with-deps chromium/);
  assert.doesNotMatch(pages, /--only-shell/);
  assert.doesNotMatch(pages, /\.github\/actions\/setup-browser/);
});
