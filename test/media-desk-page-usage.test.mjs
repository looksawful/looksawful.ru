import assert from "node:assert/strict";
import test from "node:test";

import { indexPageMediaSources } from "../tools/media-desk/index-page-media.mjs";
import { pageMediaUsages } from "../src/devtools/media-desk/usage-sources.ts";

function catalogItem(id, src) {
  return {
    origin: "registered",
    asset: { id, type: "image", src },
    title: id,
    alt: "",
    description: "",
    date: "",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    showInCatalog: false,
    reusable: false,
    archived: false,
  };
}

test("standalone page index joins only repository references that resolve to canonical assets", () => {
  const indexed = indexPageMediaSources({
    sources: [
      {
        ownerId: "awful-cases",
        route: "/pets/awful-cases/",
        sourcePath: "public/pets/awful-cases/awful-cases.js",
        text: `const screenshot = "/pets/awful-cases/assets/screenshot.png";\nconst ground = "/pets/awful-cases/assets/ground.png";`,
      },
    ],
    catalog: [catalogItem("screenshot", "/pets/awful-cases/assets/screenshot.png")],
  });

  assert.deepEqual(indexed.records, [
    {
      assetId: "screenshot",
      ownerId: "awful-cases",
      route: "/pets/awful-cases/",
      sourcePath: "public/pets/awful-cases/awful-cases.js",
      referencedPath: "/pets/awful-cases/assets/screenshot.png",
    },
  ]);
  assert.deepEqual(indexed.unresolved, [
    {
      ownerId: "awful-cases",
      route: "/pets/awful-cases/",
      sourcePath: "public/pets/awful-cases/awful-cases.js",
      referencedPath: "/pets/awful-cases/assets/ground.png",
    },
  ]);
});

test("page usage adapter emits blocking page-media provenance without inventing identities", () => {
  const bindings = pageMediaUsages([
    {
      assetId: "screenshot",
      ownerId: "awful-cases",
      route: "/pets/awful-cases/",
      sourcePath: "public/pets/awful-cases/index.html",
      referencedPath: "/pets/awful-cases/assets/screenshot.png",
    },
  ]);

  assert.deepEqual(bindings, [
    {
      assetId: "screenshot",
      usage: {
        kind: "page-media",
        ownerId: "awful-cases",
        route: "/pets/awful-cases/",
        sourcePath: "public/pets/awful-cases/index.html",
        fieldPath: "/pets/awful-cases/assets/screenshot.png",
        blockingDelete: true,
      },
    },
  ]);
});

test("page index ignores external URLs and deduplicates repeated canonical references", () => {
  const indexed = indexPageMediaSources({
    sources: [
      {
        ownerId: "berserk-timer",
        route: "/pets/berserk-timer/",
        sourcePath: "public/pets/berserk-timer/index.html",
        text: `<img src="/media/projects/berserk-timer/cover.webp"><img src="/media/projects/berserk-timer/cover.webp"><img src="https://example.com/nope.jpg">`,
      },
    ],
    catalog: [catalogItem("berserk-cover", "/media/projects/berserk-timer/cover.webp")],
  });

  assert.equal(indexed.records.length, 1);
  assert.deepEqual(indexed.unresolved, []);
});
