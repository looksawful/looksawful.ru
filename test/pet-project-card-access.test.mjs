import assert from "node:assert/strict";
import test from "node:test";

import { petProjectCards } from "../src/data/pet-project-cards.ts";

test("Berserk Timer is publicly linked while future Useful projects stay gated", () => {
  const berserk = petProjectCards.find((candidate) => candidate.id === "berserk-timer");
  assert.ok(berserk, "missing Berserk Timer card");
  assert.equal(berserk.state, "live");
  assert.equal(berserk.href, "/pets/berserk-timer/");

  for (const id of ["awful-studio", "awful-mockups", "awful-3d-mockups"]) {
    const card = petProjectCards.find((candidate) => candidate.id === id);
    assert.ok(card, `missing ${id} card`);
    assert.equal(card.state, "coming-soon");
    assert.equal("href" in card, false);
  }
});
