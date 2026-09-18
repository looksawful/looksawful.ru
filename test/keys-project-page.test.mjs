import assert from "node:assert/strict";
import test from "node:test";

import { keysPageContent } from "../src/content/pages/projects/keys.ts";
import { keysIntro } from "../src/data/content/keys.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("KEYS is a managed direct-link pet project page", () => {
  const project = projects.find((item) => item.id === "keys");
  assert.ok(project);
  assert.equal(project.name, "KEYS");
  assert.equal(project.summary, keysIntro.summary);
  assert.ok(project.collectionIds?.includes("pet-projects"));

  const page = sitePages.find((item) => item.id === "project:keys");
  assert.ok(page);
  assert.equal(page.path, "/work/keys/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});

test("KEYS page preserves the public browser architecture facts", () => {
  assert.equal(keysPageContent.intro.period, "2026");
  assert.match(keysPageContent.intro.summary, /горячих клавиш/i);

  const section = keysPageContent.sections.find(
    (item) => item.id === "keys-browser-runtime",
  );
  assert.ok(section);
  assert.equal(section.blocks[0]?.type, "code-block");
  assert.match(section.blocks[0].data.code, /npm run check/);
  assert.match(section.blocks[0].data.code, /npm start/);
});
