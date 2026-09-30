import assert from "node:assert/strict";
import test from "node:test";

import { shadersPageContent } from "../src/content/pages/projects/shaders.ts";
import { shadersIntro } from "../src/data/content/shaders.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Shaders is a managed direct-link pet project page", () => {
  const project = projects.find((item) => item.id === "shaders");
  assert.ok(project);
  assert.equal(project.name, "Shaders");
  assert.equal(project.summary, shadersIntro.summary);
  assert.ok(project.collectionIds?.includes("pet-projects"));

  const page = sitePages.find((item) => item.id === "project:shaders");
  assert.ok(page);
  assert.equal(page.path, "/work/shaders/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});

test("Shaders page stays source-safe until curated media is attached", () => {
  assert.equal(shadersPageContent.sections.length, 0);
  assert.equal(shadersPageContent.intro.period, "2024–2026");
  assert.match(shadersPageContent.intro.lead ?? "", /GLSL|Three\.js/);
  assert.doesNotMatch(JSON.stringify(shadersPageContent), /github\.com/);
});
