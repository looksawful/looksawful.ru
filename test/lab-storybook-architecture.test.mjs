import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Lab Storybook inventory is derived from canonical production owners", async () => {
  const [inventory, manifest, entityPage, sectionRenderer] = await Promise.all([
    read("src/lab/storybook/inventory.ts"),
    read("src/site/pages/manifest.ts"),
    read("src/site/renderers/entity-page.ts"),
    read("src/site/renderers/entity/section.ts"),
  ]);

  assert.match(inventory, /sitePages/);
  assert.match(inventory, /entityPageContentRegistry/);
  assert.match(inventory, /getEntityShellPresentation/);
  assert.match(inventory, /renderSection/);
  assert.match(inventory, /renderEntityShell/);
  assert.match(manifest, /type: "case"/);
  assert.match(manifest, /type: "collection"/);
  assert.match(manifest, /type: "project"/);
  assert.match(entityPage, /renderStandaloneEntityPage/);
  assert.match(sectionRenderer, /export function renderSection/);
});

test("Lab Storybook exposes template, composition and representative page archetypes", async () => {
  const [inventory, labClient, labHtml] = await Promise.all([
    read("src/lab/storybook/inventory.ts"),
    read("src/lab/index.ts"),
    read("lab/index.html"),
  ]);

  assert.match(inventory, /kind: "template"/);
  assert.match(inventory, /kind: "composition"/);
  assert.match(inventory, /kind: "page"/);
  assert.match(inventory, /variant: "compact"/);
  assert.match(inventory, /variant: "standalone"/);
  assert.match(inventory, /listed/);
  assert.match(inventory, /indexable/);
  assert.match(labClient, /renderStorybook/);
  assert.match(labHtml, /id="lab-storybook"/);
});

test("Lab Storybook declares desktop, tablet and mobile inspection viewports", async () => {
  const source = await read("src/lab/storybook/inventory.ts");
  assert.match(source, /desktop/);
  assert.match(source, /tablet/);
  assert.match(source, /mobile/);
});
