import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("permanent dedupe integrity check does not depend on runtime alias scaffolding", async () => {
  const source = await readFile("tools/media/check-dedupe-integrity.mjs", "utf8");
  assert.doesNotMatch(source, /src\/data\/media\/asset-aliases/);
  assert.match(source, /logical-assets\.json/);
});
