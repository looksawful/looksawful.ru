import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyReference,
  findCandidateReferences,
  removeAssetDeclarations,
  rewriteAssetIdentityProperties,
} from "../tools/media/apply-dedupe-migration.mjs";

const OLD_ASSET = "styx-05-source-14-4x5";
const NEW_ASSET = "styx-03-source-01-4x5";
const OLD_PATH = "public/media/projects/styx/05/source/14-4x5.webp";

test("reference scan does not mistake preserved MediaEntry IDs for asset references", () => {
  const workspace = new Map([
    [
      "src/data/subproject-cards.ts",
      `const card = { coverEntryId: "${OLD_ASSET}-use-01" };`,
    ],
    [
      "src/data/content/styx.ts",
      `const figure = { entryId: "${OLD_ASSET}-use-02" };`,
    ],
  ]);

  const refs = findCandidateReferences(workspace, {
    removeAssetIds: [OLD_ASSET],
    removePhysicalPaths: [OLD_PATH],
  });

  assert.deepEqual(refs, []);
});

test("reference scan finds exact retired asset and physical path literals", () => {
  const workspace = new Map([
    ["src/example.ts", `const assetId = "${OLD_ASSET}";`],
    ["src/example-path.ts", `const src = "/media/projects/styx/05/source/14-4x5.webp";`],
  ]);

  const refs = findCandidateReferences(workspace, {
    removeAssetIds: [OLD_ASSET],
    removePhysicalPaths: [OLD_PATH],
  });

  assert.deepEqual(
    refs.map(({ path, needle }) => [path, needle]),
    [
      ["src/example.ts", OLD_ASSET],
      ["src/example-path.ts", "/media/projects/styx/05/source/14-4x5.webp"],
    ],
  );
});

test("Behance inventory manifest is generated evidence, not a runtime blocker", () => {
  assert.equal(
    classifyReference("public/media/projects/shootings/behance/manifest.json"),
    "GENERATED",
  );
});

test("asset identity rewrite covers assetId, mediaAssetId and posterAssetId only", () => {
  const source = [
    `const a = { assetId: "${OLD_ASSET}" };`,
    `const b = { mediaAssetId: "${OLD_ASSET}" };`,
    `const c = { posterAssetId: "${OLD_ASSET}" };`,
    `const d = { entryId: "${OLD_ASSET}-use-01" };`,
    `const e = { coverEntryId: "${OLD_ASSET}-use-02" };`,
  ].join("\n");

  const rewritten = rewriteAssetIdentityProperties(
    source,
    "fixture.ts",
    new Map([[OLD_ASSET, NEW_ASSET]]),
  );

  assert.match(rewritten, new RegExp(`assetId: "${NEW_ASSET}"`));
  assert.match(rewritten, new RegExp(`mediaAssetId: "${NEW_ASSET}"`));
  assert.match(rewritten, new RegExp(`posterAssetId: "${NEW_ASSET}"`));
  assert.match(rewritten, new RegExp(`entryId: "${OLD_ASSET}-use-01"`));
  assert.match(rewritten, new RegExp(`coverEntryId: "${OLD_ASSET}-use-02"`));
});

test("asset declaration removal preserves syntax across adjacent retired assets", () => {
  const source = `export const assets = [
  {
    id: "keep-13",
    type: "image",
    src: "/keep-13.webp",
  },
  {
    id: "drop-14",
    type: "image",
    src: "/drop-14.webp",
  },
  {
    id: "drop-15",
    type: "image",
    src: "/drop-15.webp",
  },
  {
    id: "drop-16",
    type: "image",
    src: "/drop-16.webp",
  },
  {
    id: "drop-17",
    type: "image",
    src: "/drop-17.webp",
  },
  {
    id: "keep-18",
    type: "image",
    src: "/keep-18.webp",
  },
];`;

  const rewritten = removeAssetDeclarations(
    source,
    "fixture.ts",
    new Set(["drop-14", "drop-15", "drop-16", "drop-17"]),
  );

  assert.match(rewritten, /id: "keep-13"/);
  assert.match(rewritten, /id: "keep-18"/);
  assert.doesNotMatch(rewritten, /id: "drop-(14|15|16|17)"/);
  assert.match(rewritten, /\},\s*\{\s*id: "keep-18"/);
});
