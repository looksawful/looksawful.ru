import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const mainConfigUrl = new URL("../tools/lab/storybook/main.mjs", import.meta.url);

test("Storybook serves production public assets used by canonical stories", async () => {
  const source = await readFile(mainConfigUrl, "utf8");
  assert.match(source, /staticDirs\s*:\s*\[[^\]]*public[^\]]*\]/s);
});