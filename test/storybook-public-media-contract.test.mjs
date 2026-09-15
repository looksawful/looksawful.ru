import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Storybook serves canonical public media used by production renderers", async () => {
  const source = await readFile("tools/lab/storybook/main.mjs", "utf8");
  assert.match(source, /staticDirs\s*:\s*\[[\s\S]*public/);
});
