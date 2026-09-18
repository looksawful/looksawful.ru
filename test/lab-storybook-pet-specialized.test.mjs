import assert from "node:assert/strict";
import test from "node:test";

import { storybookInventory } from "../src/lab/storybook/inventory.ts";

function fixture(id) {
  const item = storybookInventory.find((candidate) => candidate.id === id);
  assert.ok(item, `missing Storybook fixture ${id}`);
  return item;
}

test("pet project specialized sections are present in the private Storybook", () => {
  const awfulCases = fixture(
    "template:project:awful-cases:awful-cases-demo",
  );
  const movesAwful = fixture(
    "template:project:moves-awful:moves-awful-canvas-demo",
  );

  const awfulHtml = awfulCases.render();
  assert.match(awfulHtml, /class="runner-game-shell"/);
  assert.match(awfulHtml, /id="startButton"/);

  const movesHtml = movesAwful.render();
  assert.match(movesHtml, /data-moves-awful-tabs=""/);
  assert.match(movesHtml, /data-animated-canvas-gallery/);
});

test("specialized pet fixtures inherit canonical route discovery", () => {
  const awfulCases = fixture(
    "template:project:awful-cases:awful-cases-demo",
  );
  const movesAwful = fixture(
    "template:project:moves-awful:moves-awful-canvas-demo",
  );

  assert.deepEqual(awfulCases.route, {
    path: "/work/awful-cases/",
    listed: false,
    indexable: false,
  });
  assert.deepEqual(movesAwful.route, {
    path: "/work/moves-awful/",
    listed: false,
    indexable: false,
  });
});
