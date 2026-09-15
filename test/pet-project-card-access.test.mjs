import assert from "node:assert/strict";
import test from "node:test";

import { USEFUL_PROJECT_DEFINITIONS } from "../src/data/content/useful-projects.ts";
import { petProjectCards } from "../src/data/pet-project-cards.ts";

test("Berserk Timer is canonically linked while unfinished Useful projects stay gated", () => {
  const berserk = petProjectCards.find((candidate) => candidate.id === "berserk-timer");
  assert.ok(berserk, "missing Berserk Timer card");
  assert.equal(berserk.state, "live");
  assert.equal(berserk.href, "/work/berserk-timer/");

  const studio = petProjectCards.find((candidate) => candidate.id === "awful-studio");
  assert.ok(studio, "missing AWFUL STUDIO card");
  assert.equal(studio.state, "coming-soon");
  assert.equal("href" in studio, false);

  for (const definition of USEFUL_PROJECT_DEFINITIONS) {
    if (definition.state !== "hidden") continue;
    assert.equal(
      petProjectCards.some((card) => card.id === definition.id),
      false,
      `${definition.id} must stay out of public card data while hidden`,
    );
  }
});
