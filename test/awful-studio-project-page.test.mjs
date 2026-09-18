import assert from "node:assert/strict";
import test from "node:test";

import { awfulStudioPageContent } from "../src/content/pages/projects/awful-studio.ts";
import {
  awfulStudioDeviceMedia,
} from "../src/data/content/awful-studio.ts";
import {
  USEFUL_PROJECT_DEFINITIONS,
  usefulProjectsContent,
} from "../src/data/content/useful-projects.ts";
import { getMediaEntry } from "../src/data/media/index.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Awful Studio publishes a curated production model showcase", () => {
  const page = sitePages.find((item) => item.id === "project:awful-studio");
  assert.ok(page);
  assert.equal(page.path, "/work/awful-studio/");

  assert.equal(awfulStudioDeviceMedia.length, 3);

  const section = awfulStudioPageContent.sections.find(
    (item) => item.id === "awful-studio-devices",
  );
  assert.ok(section);
  assert.equal(section.blocks.length, 3);

  for (const media of awfulStudioDeviceMedia) {
    const entry = getMediaEntry(media.entryId);
    assert.equal(entry.asset.type, "model");
    assert.ok(entry.projectIds?.includes("awful-studio"));
    assert.ok(entry.alt);
  }
});

test("Awful Studio card is live only on its canonical managed route", () => {
  const definition = USEFUL_PROJECT_DEFINITIONS.find(
    (item) => item.id === "awful-studio",
  );
  assert.ok(definition);
  assert.equal(definition.href, "/work/awful-studio/");

  const card = usefulProjectsContent.cards.find(
    (item) => item.id === "awful-studio",
  );
  assert.ok(card);
  assert.equal(card.visible, true);
  assert.equal(card.state, "live");
  assert.notEqual(card.badge, "В разработке");
});
