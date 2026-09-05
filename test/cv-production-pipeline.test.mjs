import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production deploy verifies CV exactly once without a prepare alias", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  const { scripts } = JSON.parse(await read("package.json"));

  assert.equal(scripts["cv:prod:prepare"], undefined);
  assert.equal(scripts["cv:prod:verify"], "node tools/verify-cv-production.mjs");
  assert.doesNotMatch(workflow, /cv:prod:prepare/);
  assert.equal((workflow.match(/npm run cv:prod:verify/g) ?? []).length, 1);
});
