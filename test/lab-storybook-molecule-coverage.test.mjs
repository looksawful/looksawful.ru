import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const storyUrl = (name) => new URL(`../src/lab/stories/${name}.stories.js`, import.meta.url);

async function readStory(name) {
  return readFile(storyUrl(name), "utf8");
}

function assertCanonicalMolecule(source, expectedSources) {
  assert.match(source, /layer:\s*"molecule"/);
  assert.match(source, /policy:\s*"isolated"/);
  assert.match(source, /canonical:\s*true/);
  for (const expected of expectedSources) assert.ok(source.includes(`"${expected}"`), `missing ${expected}`);
}

test("Media Figure story uses the production renderer and real Awful Cases media", async () => {
  const source = await readStory("media-figure");
  assert.match(source, /renderMediaFigure/);
  assert.match(source, /awfulCasesDemo/);
  assertCanonicalMolecule(source, ["src/templates/media-figure.ts", "src/components/content/media-figure.ts"]);
  assert.doesNotMatch(source, /<figure\b/);
});
test("Mockup story uses the production renderer and typed site fixtures", async () => {
  const source = await readStory("mockup");
  assert.match(source, /renderMockup/);
  assert.match(source, /berryStoryMockups/);
  assert.match(source, /awfulCasesSettingsMockup/);
  assertCanonicalMolecule(source, ["src/templates/mockup.ts", "src/components/content/mockup.ts"]);
  assert.doesNotMatch(source, /<figure\b/);
});

test("Resource Links story uses the production composition renderer and real page resources", async () => {
  const source = await readStory("resource-links");
  assert.match(source, /renderResourceLinks/);
  assert.match(source, /jesteiEditorialResources/);
  assert.match(source, /sensetiqueEquipmentResources/);
  assertCanonicalMolecule(source, [
    "src/components/composition/resource-links.ts",
    "src/data/content/jestei-page-presentation.ts",
    "src/data/content/sensetique-page-presentation.ts",
  ]);
  assert.doesNotMatch(source, /<a\s+class=["']resource-row__action/);
});
test("molecule stories name only production-backed variant axes", async () => {
  const mockup = await readStory("mockup");
  const resources = await readStory("resource-links");
  assert.match(mockup, /state:\s*"device-variants"/);
  assert.doesNotMatch(mockup, /device-theme-variants/);
  assert.match(resources, /state:\s*"production-resource-sets"/);
  assert.doesNotMatch(resources, /resource-variants/);
});
