import assert from "node:assert/strict";
import test from "node:test";

import {
  compactRegisteredCatalogRecord,
  inferRegisteredMediaCatalogRecord,
} from "../tools/sync-media-catalog.mjs";

const asset = {
  id: "asset-a",
  type: "image",
  src: "/media/a.webp",
  width: 100,
  height: 120,
};

const legacy = {
  id: "asset-a",
  mediaType: "image",
  src: "/media/a.webp",
  sourceSrc: "",
  width: 100,
  height: 120,
  durationSeconds: 0,
  mimeType: "",
  byteLength: 0,
  title: "Asset A",
  alt: "",
  description: "",
  date: "2026",
  projectIds: ["legacy-project"],
  workAreaIds: ["photography"],
  projectTypeIds: ["shooting"],
  deliverableIds: ["cover"],
  tags: ["фото"],
  credits: [],
  reusable: true,
  archived: false,
};

test("registered catalog sync compacts legacy records to one library metadata source", () => {
  const compact = compactRegisteredCatalogRecord(legacy);

  assert.deepEqual(compact, {
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
  });
  for (const duplicated of [
    "mediaType", "src", "sourceSrc", "width", "height",
    "durationSeconds", "mimeType", "byteLength", "projectIds",
  ]) {
    assert.equal(duplicated in compact, false, duplicated);
  }
});

test("new registered catalog records are emitted in compact shape", () => {
  const inferred = inferRegisteredMediaCatalogRecord(asset, [{
    id: "entry-a",
    assetId: "asset-a",
    projectIds: [],
    caption: { title: "Entry A" },
  }]);

  assert.equal(inferred.id, "asset-a");
  assert.equal(inferred.title, "Entry A");
  assert.equal("src" in inferred, false);
  assert.equal("projectIds" in inferred, false);
});
