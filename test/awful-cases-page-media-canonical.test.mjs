import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { awfulCasesMediaAssets } from "../src/data/media/assets/awful-cases.ts";
import { mediaCatalogItems } from "../src/data/media/catalog-view.ts";
import { indexPageMediaSources } from "../tools/media-desk/index-page-media.mjs";

const expectedPaths = [
  "/media/interactive/awful-cases-atlas.png",
  "/pets/awful-cases/assets/decor-1.png",
  "/pets/awful-cases/assets/decor-2.png",
  "/pets/awful-cases/assets/decor-3.png",
  "/pets/awful-cases/assets/fall1.png",
  "/pets/awful-cases/assets/fall2.png",
  "/pets/awful-cases/assets/flag.png",
  "/pets/awful-cases/assets/ground.png",
  "/pets/awful-cases/assets/pit.png",
  "/pets/awful-cases/assets/victory.png",
];

test("Awful Cases standalone runtime media is canonical Media Desk inventory", async () => {
  const registeredPaths = new Set(awfulCasesMediaAssets.map(({ src }) => src));
  for (const path of expectedPaths) assert.equal(registeredPaths.has(path), true, path);

  const text = await readFile("public/pets/awful-cases/awful-cases.js", "utf8");
  const indexed = indexPageMediaSources({
    sources: [{ ownerId: "awful-cases", route: "/pets/awful-cases/", sourcePath: "public/pets/awful-cases/awful-cases.js", text }],
    catalog: mediaCatalogItems,
  });
  assert.equal(indexed.records.length, 10);
  assert.deepEqual(indexed.unresolved, []);
  assert.deepEqual(indexed.records.map(({ referencedPath }) => referencedPath).sort(), [...expectedPaths].sort());
});
