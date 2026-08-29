import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Moves Awful legacy infinite reel explicitly opts nested renderers out of global reveal", async () => {
  const [index, composition] = await Promise.all([
    read("index.html"),
    read("src/site/renderers/home/home-slots.ts"),
  ]);

  assert.match(
    index,
    /<section[^>]*data-infinite-reel[^>]*>[\s\S]*<!-- MOVES_AWFUL_ANIMATIONS_INTRO -->[\s\S]*<!-- MOVES_AWFUL_MEDIA_01 -->[\s\S]*<!-- MOVES_AWFUL_MEDIA_02 -->[\s\S]*<!-- MOVES_AWFUL_MEDIA_03 -->[\s\S]*<\/section>/,
    "the legacy Moves Awful slots must remain inside the infinite-reel owner",
  );

  assert.match(
    composition,
    /renderSectionIntro\(movesAwfulAnimationsIntro, \{ reveal: false \}\)/,
    "nested intro must not enter the global reveal layer",
  );

  for (const index of [0, 1, 2]) {
    assert.match(
      composition,
      new RegExp(`renderMediaFigure\\(movesAwfulLandingMedia\\[${index}\\], \\{ reveal: false \\}\\)`),
      `Moves Awful media ${index + 1} must remain component-owned`,
    );
  }
});
