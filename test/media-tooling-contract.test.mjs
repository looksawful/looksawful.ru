import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("responsive manifest is byte-stable across unchanged builds", async () => {
  const builder = await read("tools/build-responsive-media.mjs");

  assert.doesNotMatch(builder, /generatedAt:\s*new Date\(\)\.toISOString\(\)/);
  assert.match(builder, /previousContents\s*===\s*contents/);
  assert.match(builder, /manifestChanged/);
});

test("video builder has a fingerprinted incremental transcode contract", async () => {
  const builder = await read("tools/build-video-media.mjs");

  assert.match(builder, /sourceHash/);
  assert.match(builder, /configHash/);
  assert.match(builder, /previousInventory/);
  assert.match(builder, /skippedCount/);
  assert.doesNotMatch(builder, /generatedAt:\s*new Date\(\)\.toISOString\(\)/);
});
