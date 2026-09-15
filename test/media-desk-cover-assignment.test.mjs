import assert from "node:assert/strict";
import test from "node:test";

import {
  assignPetCover,
  assignProjectCover,
  assignCharacterCover,
  assignSubprojectCardCoverOverride,
} from "../src/devtools/media-desk/cover-assignment.ts";

const catalog = [
  {
    asset: {
      id: "project-index-jestei-pool-cover",
      type: "image",
      src: "/media/projects/index/jestei-pool-cover.webp",
      width: 1580,
      height: 1360,
    },
  },
  {
    asset: {
      id: "alternate-cover",
      type: "image",
      src: "/media/projects/index/alternate.webp",
      width: 1200,
      height: 900,
    },
  },
];

const entries = [
  { id: "entry-a", assetId: "project-index-jestei-pool-cover" },
  { id: "entry-b", assetId: "alternate-cover" },
];

test("project cover assignment updates only the selected cover from a canonical image asset", () => {
  const projects = [
    { id: "jestei", visible: true, cover: { src: "/old.webp", width: 1, height: 1 } },
    { id: "styx", visible: true, cover: { src: "/styx.webp", width: 2, height: 3 } },
  ];
  const result = assignProjectCover({ projects, ownerId: "jestei", assetId: "alternate-cover", catalog });

  assert.equal(result.sourcePath, "src/content/projects.json");
  assert.deepEqual(result.value[0].cover, {
    src: "/media/projects/index/alternate.webp",
    width: 1200,
    height: 900,
  });
  assert.deepEqual(result.value[1], projects[1]);
  assert.deepEqual(projects[0].cover, { src: "/old.webp", width: 1, height: 1 });
});

test("project cover assignment rejects unknown owners and non-image or incomplete assets", () => {
  assert.throws(
    () => assignProjectCover({ projects: [], ownerId: "missing", assetId: "alternate-cover", catalog }),
    /unknown project cover owner/i,
  );
  assert.throws(
    () => assignProjectCover({
      projects: [{ id: "jestei", visible: true, cover: { src: "/old", width: 1, height: 1 } }],
      ownerId: "jestei",
      assetId: "video",
      catalog: [{ asset: { id: "video", type: "video", src: "/x.mp4" } }],
    }),
    /image asset with dimensions/i,
  );
});

test("pet cover assignment changes only coverEntryId and requires an existing MediaEntry", () => {
  const cards = [
    { id: "awful-cases", title: "Awful Cases", coverEntryId: "entry-a", shape: "landscape", source: "site" },
    { id: "berserk-timer", title: "Berserk", coverEntryId: "entry-a", shape: "landscape", source: "site" },
  ];
  const result = assignPetCover({ cards, ownerId: "awful-cases", entryId: "entry-b", entries });

  assert.equal(result.sourcePath, "src/data/subproject-cards.ts");
  assert.equal(result.value[0].coverEntryId, "entry-b");
  assert.deepEqual(result.value[1], cards[1]);
  assert.equal(cards[0].coverEntryId, "entry-a");
  assert.throws(
    () => assignPetCover({ cards, ownerId: "awful-cases", entryId: "missing", entries }),
    /unknown media entry/i,
  );
});

test("character cover assignment fails closed until a canonical character source exists", () => {
  assert.throws(
    () => assignCharacterCover({ ownerId: "venus", assetId: "alternate-cover" }),
    /character cover source is not configured/i,
  );
});


test("authorable subproject cover override mutates only selected mapping", () => {
  const result = assignSubprojectCardCoverOverride({
    overrides: { other: "old-entry" },
    cards: [{ id: "awful-cases", coverEntryId: "old", title: "A", description: "", shape: "landscape" }],
    ownerId: "awful-cases",
    entryId: "new-entry",
    entries: [{ id: "new-entry", assetId: "asset-new" }],
  });
  assert.equal(result.sourcePath, "src/content/subproject-card-covers.json");
  assert.deepEqual(result.value, { other: "old-entry", "awful-cases": "new-entry" });
  assert.throws(() => assignSubprojectCardCoverOverride({ overrides: {}, cards: [], ownerId: "missing", entryId: "new-entry", entries: [{ id: "new-entry", assetId: "asset-new" }] }), /unknown subproject card cover owner/i);
  assert.throws(() => assignSubprojectCardCoverOverride({ overrides: {}, cards: [{ id: "awful-cases", coverEntryId: "old" }], ownerId: "awful-cases", entryId: "missing-entry", entries: [] }), /unknown media entry/i);
});
