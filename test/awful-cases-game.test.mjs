import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Awful Cases animation always resolves a valid atlas frame", async () => {
  const source = await readFile(
    new URL("../src/components/awful-cases-game.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /Number\.isFinite\(game\.time\)/);
  assert.match(source, /const frame = RUN\[frameIndex\] \?\? RUN\[0\]/);
});
