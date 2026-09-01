import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("completed Shootings hash freeze remains opt-in; normal isolation coverage stays active", async () => {
  const isolationTest = await read("test/shootings-data-isolation.test.mjs");

  assert.match(isolationTest, /SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION/);
  assert.match(isolationTest, /process\.env\.SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION\s*===\s*["']1["']/);

  assert.match(isolationTest, /all 80 imported Behance WebP assets must be present/);
  const pkg = JSON.parse(await read("package.json"));
  assert.match(pkg.scripts["test:core"], /node --test/);
  for (const file of ["verify-dev.yml", "verify-pr.yml", "verify-full.yml"]) {
    assert.doesNotMatch(await read(`.github/workflows/${file}`), /SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION/);
  }
});
