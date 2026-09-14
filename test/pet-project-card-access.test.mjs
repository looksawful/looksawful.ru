import assert from "node:assert/strict";
import test from "node:test";

import { petProjectCards } from "../src/data/pet-project-cards.ts";

const unfinishedProjectIds = ["berserk-timer", "awful-studio"];

test("unfinished Pet Project cards never expose public hrefs", () => {
  for (const id of unfinishedProjectIds) {
    const card = petProjectCards.find((candidate) => candidate.id === id);
    assert.ok(card, `missing Pet Project card ${id}`);
    assert.equal(card.state, "coming-soon");
    assert.equal("href" in card, false);
  }
});
