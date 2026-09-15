import assert from "node:assert/strict";
import test from "node:test";

import { USEFUL_PROJECT_DEFINITIONS } from "../src/data/content/useful-projects.ts";
import { petProjectCards } from "../src/data/pet-project-cards.ts";

const hiddenFuturePetIds = [
  "awful-mockups",
  "awful-3d-mockups",
  "awful-textures",
  "photoshop-translation",
  "keys",
  "sea",
  "comfy-workflows",
  "photoshop-workflows",
  "blender-scenes",
  "shaders",
  "3d-assets",
];

test("Berserk Timer uses its canonical work route while AWFUL STUDIO stays gated", () => {
  const berserk = petProjectCards.find((candidate) => candidate.id === "berserk-timer");
  assert.ok(berserk, "missing Berserk Timer card");
  assert.equal(berserk.state, "live");
  assert.equal(berserk.href, "/work/berserk-timer/");

  const awfulStudio = petProjectCards.find((candidate) => candidate.id === "awful-studio");
  assert.ok(awfulStudio, "missing awful-studio card");
  assert.equal(awfulStudio.state, "coming-soon");
  assert.equal("href" in awfulStudio, false);
});

test("future Pet Projects are registered but hidden until explicitly published", () => {
  for (const id of hiddenFuturePetIds) {
    const definition = USEFUL_PROJECT_DEFINITIONS.find((candidate) => candidate.id === id);
    assert.ok(definition, `missing future Pet Project definition: ${id}`);
    assert.equal(definition.state, "hidden");
    assert.equal(definition.visible, false);
    assert.equal(petProjectCards.some((candidate) => candidate.id === id), false);
  }
});
