import assert from "node:assert/strict";
import test from "node:test";

import { seaPageContent } from "../src/content/pages/projects/sea.ts";
import { seaIntro } from "../src/data/content/sea.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("SEA is a managed private-source pet project page", () => {
  const project = projects.find((item) => item.id === "sea");
  assert.ok(project);
  assert.equal(project.name, "SEA");
  assert.equal(project.summary, seaIntro.summary);
  assert.ok(project.collectionIds?.includes("pet-projects"));

  const page = sitePages.find((item) => item.id === "project:sea");
  assert.ok(page);
  assert.equal(page.path, "/work/sea/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});

test("SEA page exposes only the public product link, not the private repository", () => {
  assert.equal(seaPageContent.sections.length, 0);
  assert.equal(seaPageContent.intro.links?.length, 1);
  assert.equal(
    seaPageContent.intro.links?.[0]?.href,
    "https://sea-eta.vercel.app/",
  );
  assert.doesNotMatch(
    JSON.stringify(seaPageContent),
    /github\.com\/looksawful\/SEA/i,
  );
});
