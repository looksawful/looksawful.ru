import assert from "node:assert/strict";
import test from "node:test";

let guard = {};
try {
  guard = await import("../tools/cloudflare/media-desk/cms-delete-guard.mjs");
} catch {}

const uuid = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
const assetId = `cms-${uuid}`;
const src = `/media/catalog/${uuid}.webp`;

const sources = {
  "src/content/projects.json": JSON.stringify([
    { id: "jestei", cover: { src, width: 1200, height: 1600 } },
  ]),
  "src/data/media/page-usage.generated.json": JSON.stringify({
    records: [{ assetId, ownerId: "awful-cases", route: "/pets/awful-cases/", sourcePath: "public/pets/awful-cases/app.js", referencedPath: src }],
    unresolved: [],
  }),
  "src/data/media/static-usage.generated.json": JSON.stringify({
    bindings: [{ assetId, usage: { kind: "direct-placement", ownerId: "entry-a", sourcePath: "src/data/media/entries", fieldPath: "entry-a", blockingDelete: true } }],
  }),
};

test("current CMS delete guard derives blockers only from branch snapshots", () => {
  assert.equal(typeof guard.deriveCmsDeleteBlockers, "function");
  const blockers = guard.deriveCmsDeleteBlockers({
    assetId,
    record: { src, showInCatalog: true, archived: false },
    projects: JSON.parse(sources["src/content/projects.json"]),
    coverOverrides: { "awful-cases": "entry-a" },
    pageUsage: JSON.parse(sources["src/data/media/page-usage.generated.json"]),
    staticUsage: {
      ...JSON.parse(sources["src/data/media/static-usage.generated.json"]),
      petCards: [{ id: "awful-cases", coverEntryId: "entry-old", href: "/pets/awful-cases/" }],
    },
  });
  assert.deepEqual(blockers.map(({ kind }) => kind).sort(), [
    "direct-placement", "gallery", "page-media", "pet-cover", "project-cover",
  ]);
  assert.ok(blockers.every(({ blockingDelete }) => blockingDelete === true));
});

test("client-supplied usage arrays cannot affect CMS delete guard", () => {
  assert.equal(guard.deriveCmsDeleteBlockers.length, 1);
  const blockers = guard.deriveCmsDeleteBlockers({
    assetId,
    record: { src, showInCatalog: false, archived: false },
    projects: [], coverOverrides: {}, pageUsage: { records: [] },
    staticUsage: { bindings: [], petCards: [] },
    usages: [{ kind: "fake", blockingDelete: true }],
  });
  assert.deepEqual(blockers, []);
});