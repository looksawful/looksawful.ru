import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexUrl = new URL("../src/styles/index.css", import.meta.url);
const componentsUrl = new URL("../src/styles/components.css", import.meta.url);
const ownerUrl = new URL("../src/styles/code-block.css", import.meta.url);

const [indexCss, componentsCss] = await Promise.all([
  readFile(indexUrl, "utf8"),
  readFile(componentsUrl, "utf8"),
]);

test("code-block owner stays between the aggregate and project header in the components layer", () => {
  const aggregateIndex = indexCss.indexOf('@import "./components.css" layer(components);');
  const ownerIndex = indexCss.indexOf('@import "./code-block.css" layer(components);');
  const projectHeaderIndex = indexCss.indexOf('@import "./project-header.css" layer(components);');

  assert.ok(aggregateIndex >= 0, "components aggregate import should exist");
  assert.ok(ownerIndex > aggregateIndex, "code-block owner should follow the components aggregate");
  assert.ok(projectHeaderIndex > ownerIndex, "project header should follow the code-block owner");
});

test("components.css no longer physically owns code-block presentation", () => {
  assert.doesNotMatch(componentsCss, /(?:^|\n)\.code-block(?:\s|__|\{|\.)/);
});

test("dedicated code-block owner preserves the public selector and custom-property contract", async () => {
  assert.equal(existsSync(ownerUrl), true, "src/styles/code-block.css should exist");
  if (!existsSync(ownerUrl)) return;

  const ownerCss = await readFile(ownerUrl, "utf8");
  for (const contract of [
    /\.code-block\s*\{[\s\S]*--code-block-surface:\s*#111;/,
    /\.code-block__head\s*\{/,
    /\.code-block__heading\s*\{/,
    /\.code-block__index\s*\{/,
    /\.code-block__title\s*\{/,
    /\.code-block__copy\s*\{/,
    /\.code-block pre\s*\{/,
    /\.code-block code\s*\{/,
    /\.code-block__meta\s*\{/,
  ]) {
    assert.match(ownerCss, contract);
  }
});

test("index.css contains no late code-block presentation patch", () => {
  const withoutImport = indexCss.replace(/@import "\.\/code-block\.css" layer\(components\);\n?/, "");
  assert.doesNotMatch(withoutImport, /(?:^|\n)\s*\.code-block(?:\s|__|\{|\.)/);
});
