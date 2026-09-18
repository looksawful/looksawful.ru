import assert from "node:assert/strict";
import test from "node:test";

import { awful3dMockupsPageContent } from "../src/content/pages/projects/awful-3d-mockups.ts";
import { awful3dMockupsDeviceMedia } from "../src/data/content/awful-3d-mockups.ts";
import {
  USEFUL_PROJECT_DEFINITIONS,
  usefulProjectsContent,
} from "../src/data/content/useful-projects.ts";
import { getMediaEntry } from "../src/data/media/index.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Awful 3D Mockups is a managed project with the full device set", () => {
  const page = sitePages.find((item) => item.id === "project:awful-3d-mockups");
  assert.ok(page);
  assert.equal(page.path, "/work/awful-3d-mockups/");
  assert.equal(page.discovery.listed, false);
  assert.equal(page.discovery.indexable, false);

  assert.equal(awful3dMockupsDeviceMedia.length, 4);

  const section = awful3dMockupsPageContent.sections.find(
    (item) => item.id === "awful-3d-mockups-devices",
  );
  assert.ok(section);
  assert.equal(section.blocks.length, 4);

  for (const media of awful3dMockupsDeviceMedia) {
    const entry = getMediaEntry(media.entryId);
    assert.equal(entry.asset.type, "model");
    assert.ok(entry.projectIds?.includes("awful-3d-mockups"));
  }
});

test("Awful 3D Mockups card is live on the canonical route", () => {
  const definition = USEFUL_PROJECT_DEFINITIONS.find(
    (item) => item.id === "awful-3d-mockups",
  );
  assert.ok(definition);
  assert.equal(definition.href, "/work/awful-3d-mockups/");

  const card = usefulProjectsContent.cards.find(
    (item) => item.id === "awful-3d-mockups",
  );
  assert.ok(card);
  assert.equal(card.visible, true);
  assert.equal(card.state, "live");
  assert.notEqual(card.badge, "В разработке");
});
