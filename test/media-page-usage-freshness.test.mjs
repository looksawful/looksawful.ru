import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as pageIndexer from "../tools/media/index-page-media.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const workflow = await readFile(".github/workflows/ci-fast.yml", "utf8");

test("page usage freshness check rejects stale generated snapshots", () => {
  assert.equal(typeof pageIndexer.assertPageUsageSnapshotFresh, "function");
  const indexed = { records: [{ assetId: "a" }], unresolved: [] };
  assert.doesNotThrow(() => pageIndexer.assertPageUsageSnapshotFresh(indexed, `${JSON.stringify(indexed, null, 2)}\n`));
  assert.throws(
    () => pageIndexer.assertPageUsageSnapshotFresh(indexed, "{\"records\":[],\"unresolved\":[]}\n"),
    /page-usage.*stale|stale.*page-usage/i,
  );
});

test("Fast CI verifies the retained page usage snapshot", () => {
  assert.match(packageJson.scripts["media:page-usage:check"] ?? "", /index-page-media\.mjs\s+--check/);
  assert.match(workflow, /npm run media:page-usage:check/);
});
