import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { entityPageContents } from "../src/content/pages/index.ts";
import * as visibility from "../src/data/content/section-visibility.ts";
import { CMS_PUBLICATION_CLASS, classifyCmsPublicationPath } from "../tools/cms-publication-scope.mjs";
import { renderEntityShell } from "../src/site/renderers/entity/entity-shell.ts";

const controlledPageIds = [
  "case:jestei-pool",
  "case:styx",
  "case:sensetique",
  "collection:music-photography",
];

function page(pageId) {
  const value = entityPageContents.find((candidate) => candidate.pageId === pageId);
  assert.ok(value, `missing canonical PageContent for ${pageId}`);
  return value;
}

function clone(value) {
  return structuredClone(value);
}

test("page visibility sources strictly cover canonical sections and fixed blocks without changing the default output", () => {
  assert.equal(typeof visibility.getEntityPageVisibilitySource, "function");
  assert.equal(typeof visibility.parseEntityPageVisibility, "function");
  assert.equal(typeof visibility.applyEntityPageVisibility, "function");

  for (const pageId of controlledPageIds) {
    const content = page(pageId);
    const source = visibility.getEntityPageVisibilitySource(pageId);
    const parsed = visibility.parseEntityPageVisibility(source, content);
    assert.deepEqual(visibility.applyEntityPageVisibility(content, parsed), content);
  }
});

test("visibility validation rejects unknown, duplicate and missing section or block IDs", () => {
  assert.equal(typeof visibility.getEntityPageVisibilitySource, "function");
  assert.equal(typeof visibility.parseEntityPageVisibility, "function");

  const content = page("case:jestei-pool");
  const source = clone(visibility.getEntityPageVisibilitySource(content.pageId));

  const unknownSection = clone(source);
  unknownSection.sections[0].id = "unknown-section";
  assert.throws(() => visibility.parseEntityPageVisibility(unknownSection, content), /unexpected section visibility id/i);

  const duplicateSection = clone(source);
  duplicateSection.sections.push(clone(duplicateSection.sections[0]));
  assert.throws(() => visibility.parseEntityPageVisibility(duplicateSection, content), /duplicate section visibility id/i);

  const missingSection = clone(source);
  missingSection.sections.pop();
  assert.throws(() => visibility.parseEntityPageVisibility(missingSection, content), /missing section visibility id/i);

  const brand = source.sections.find(({ id }) => id === "jestei-brand");
  assert.ok(brand);

  const unknownBlock = clone(source);
  unknownBlock.sections.find(({ id }) => id === "jestei-brand").blocks[0].id = "jestei-brand:unknown";
  assert.throws(() => visibility.parseEntityPageVisibility(unknownBlock, content), /unexpected block visibility id/i);

  const duplicateBlock = clone(source);
  const duplicateBrand = duplicateBlock.sections.find(({ id }) => id === "jestei-brand");
  duplicateBrand.blocks.push(clone(duplicateBrand.blocks[0]));
  assert.throws(() => visibility.parseEntityPageVisibility(duplicateBlock, content), /duplicate block visibility id/i);

  const missingBlock = clone(source);
  missingBlock.sections.find(({ id }) => id === "jestei-brand").blocks.pop();
  assert.throws(() => visibility.parseEntityPageVisibility(missingBlock, content), /missing block visibility id/i);
});

test("the same canonical visibility state removes hidden sections and blocks before both home and standalone rendering", () => {
  assert.equal(typeof visibility.getEntityPageVisibilitySource, "function");
  assert.equal(typeof visibility.parseEntityPageVisibility, "function");
  assert.equal(typeof visibility.applyEntityPageVisibility, "function");

  const content = page("case:jestei-pool");
  const source = clone(visibility.getEntityPageVisibilitySource(content.pageId));
  source.sections.find(({ id }) => id === "jestei-event").visible = false;
  source.sections
    .find(({ id }) => id === "jestei-brand")
    .blocks.find(({ id }) => id === "jestei-brand:jestei-theme").visible = false;

  const parsed = visibility.parseEntityPageVisibility(source, content);
  const filtered = visibility.applyEntityPageVisibility(content, parsed);
  assert.equal(filtered.pageId, content.pageId, "visibility must not mutate route/page identity");
  assert.equal(filtered.sections.some(({ id }) => id === "jestei-event"), false);

  const brand = filtered.sections.find(({ id }) => id === "jestei-brand");
  assert.ok(brand && "blocks" in brand);
  assert.deepEqual(brand.blocks.map(({ type }) => type), ["media-group"]);

  const render = (introHeadingLevel) => renderEntityShell(filtered, {
    articleId: `visibility-${introHeadingLevel}`,
    introHeadingLevel,
    specialized: { jesteiTrackFilter: () => '<section data-jestei-track-filter></section>' },
  });
  const home = render(2);
  const standalone = render(1);

  for (const html of [home, standalone]) {
    assert.doesNotMatch(html, /id="jestei-event"/);
    assert.doesNotMatch(html, /data-jestei-theme-organism/);
    assert.match(html, /id="jestei-brand"/);
  }
});

test("Pages CMS exposes readonly technical IDs and publication scope authorizes only the canonical visibility files", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const paths = [
    "src/content/visibility/jestei-pool.json",
    "src/content/visibility/styx.json",
    "src/content/visibility/sensetique.json",
    "src/content/visibility/shootings.json",
  ];

  for (const path of paths) {
    assert.match(cms, new RegExp(path.replaceAll("/", "\\/")));
    assert.equal(classifyCmsPublicationPath(path), CMS_PUBLICATION_CLASS.CMS_CONTENT);
  }
  assert.match(cms, /name: id[\s\S]*?readonly: true/);
  assert.match(cms, /name: visible[\s\S]*?type: boolean/);
  assert.equal(classifyCmsPublicationPath("src/content/visibility/unregistered.json"), CMS_PUBLICATION_CLASS.UNKNOWN);
});
