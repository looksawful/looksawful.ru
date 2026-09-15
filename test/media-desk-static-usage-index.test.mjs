import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let indexer = {};
try {
  indexer = await import("../tools/media-desk/index-static-usage.mjs");
} catch {}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const workflow = await readFile(".github/workflows/media-desk-cloudflare.yml", "utf8");

test("static usage index records direct and video-poster blockers deterministically", () => {
  assert.equal(typeof indexer.buildStaticUsageIndex, "function");
  const indexed = indexer.buildStaticUsageIndex([
    { id: "entry-b", assetId: "asset-b", posterAssetId: "poster-a" },
    { id: "entry-a", assetId: "asset-a" },
  ]);
  assert.deepEqual(indexed.bindings.map(({ assetId, usage }) => [assetId, usage.kind, usage.ownerId]), [
    ["asset-a", "direct-placement", "entry-a"],
    ["asset-b", "direct-placement", "entry-b"],
    ["poster-a", "video-poster", "entry-b"],
  ]);
});

test("static usage snapshot has a checked verification path", () => {
  assert.equal(typeof indexer.assertStaticUsageSnapshotFresh, "function");
  const indexed = { bindings: [] };
  const exact = `${JSON.stringify(indexed, null, 2)}\n`;
  assert.doesNotThrow(() => indexer.assertStaticUsageSnapshotFresh(indexed, exact));
  assert.throws(() => indexer.assertStaticUsageSnapshotFresh(indexed, "{}\n"), /static.*usage.*stale|stale.*static.*usage/i);
  assert.match(packageJson.scripts["media-desk:static-usage:check"] ?? "", /index-static-usage\.mjs\s+--check/);
  assert.match(workflow, /npm run media-desk:static-usage:check/);
});

test("static usage snapshot carries code-owned pet cover bases separately from CMS overrides", () => {
  const indexed = indexer.buildStaticUsageIndex(
    [{ id: "entry-a", assetId: "asset-a" }],
    [{ id: "awful-cases", coverEntryId: "entry-a", href: "/pets/awful-cases/" }],
  );
  assert.deepEqual(indexed.petCards, [
    { id: "awful-cases", coverEntryId: "entry-a", href: "/pets/awful-cases/" },
  ]);
});