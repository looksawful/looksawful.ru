import assert from "node:assert/strict";
import test from "node:test";

import { petProjectCards } from "../src/data/pet-project-cards.ts";

test("Berserk Timer is publicly linked while AWFUL STUDIO stays gated", () => {
  const berserk = petProjectCards.find((candidate) => candidate.id === "berserk-timer");
  assert.ok(berserk, "missing Berserk Timer card");
  assert.equal(berserk.state, "live");
  assert.equal(berserk.href, "/work/berserk-timer/");

  const awfulStudio = petProjectCards.find((candidate) => candidate.id === "awful-studio");
  assert.ok(awfulStudio, "missing AWFUL STUDIO card");
  assert.equal(awfulStudio.state, "coming-soon");
  assert.equal("href" in awfulStudio, false);
});
