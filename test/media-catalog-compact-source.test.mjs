import assert from "node:assert/strict";
import test from "node:test";

import { parseRegisteredMediaCatalogRecord } from "../src/data/media/catalog.ts";

const asset = {
  id: "asset-a",
  type: "image",
  src: "/media/a.webp",
  width: 100,
  height: 120,
};

test("registered catalog source no longer duplicates MediaAsset technical fields or project membership", () => {
  const source = {
    id: "asset-a",
    title: "Asset A",
    alt: "",
    description: "",
    date: "2026",
    workAreaIds: ["photography"],
    projectTypeIds: ["shooting"],
    deliverableIds: ["cover"],
    tags: ["фото"],
    credits: [],
    reusable: true,
    archived: false,
  };

  const parsed = parseRegisteredMediaCatalogRecord(source, [asset]);

  assert.equal(parsed.id, "asset-a");
  assert.equal(parsed.title, "Asset A");
  assert.deepEqual(parsed.projectIds, []);
  assert.equal("src" in parsed, false);
  assert.equal("width" in parsed, false);
  assert.equal("mediaType" in parsed, false);
});
