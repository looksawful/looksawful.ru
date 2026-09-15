import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_BLOCK_TYPES } from "../src/content/contracts/content-block.ts";
import { projectComponentSurfaces } from "../src/content/contracts/project-component-surfaces.ts";
import { SPECIALIZED_SECTION_KINDS } from "../src/content/contracts/sections.ts";
import { entityShellPresentationRegistry } from "../src/site/pages/entity-presentation.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

function surfaceIds(family) {
  return projectComponentSurfaces
    .filter((surface) => surface.family === family)
    .map((surface) => surface.id)
    .sort();
}

test("project component registry covers every canonical content block and specialized section", () => {
  assert.deepEqual(surfaceIds("content-block"), [...CONTENT_BLOCK_TYPES].sort());
  assert.deepEqual(surfaceIds("specialized-section"), [...SPECIALIZED_SECTION_KINDS].sort());
});

test("every registered project UI surface declares Storybook, CMS and media ownership", () => {
  const ids = new Set();

  for (const surface of projectComponentSurfaces) {
    assert.equal(surface.storybook, "required", `${surface.id} must require Storybook coverage`);
    assert.ok(["editorial", "code", "mixed"].includes(surface.cms), `${surface.id} must declare CMS ownership`);
    assert.ok(
      ["catalog", "none", "mixed", "legacy-path", "external"].includes(surface.media),
      `${surface.id} must declare media ownership`,
    );
    assert.equal(ids.has(`${surface.family}:${surface.id}`), false, `duplicate surface ${surface.family}:${surface.id}`);
    ids.add(`${surface.family}:${surface.id}`);
  }
});

test("enabled entity pages cannot suppress canonical authored intros", () => {
  for (const page of sitePages) {
    if (!page.enabled || !["case", "collection", "project"].includes(page.type)) continue;
    const presentation = entityShellPresentationRegistry.get(page.id);
    assert.ok(presentation, `missing entity presentation for ${page.id}`);
    assert.notEqual(
      presentation.showIntro,
      false,
      `${page.id} hides canonical authored intro content; use an explicit documented accessibility-only primitive instead`,
    );
  }
});

test("release gating stays separate from component and Storybook coverage", () => {
  const awfulStudio = sitePages.find((page) => page.id === "project:awful-studio");
  assert.ok(awfulStudio);
  assert.equal(awfulStudio.enabled, false);
  assert.equal(awfulStudio.discovery.listed, false);
  assert.equal(awfulStudio.discovery.indexable, false);
});
