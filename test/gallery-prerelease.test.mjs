import assert from "node:assert/strict";
import test from "node:test";

import { getPageByPath, sitePages } from "../src/site/pages/manifest.ts";
import { PRIMARY_NAVIGATION_PAGE_IDS } from "../src/site/navigation/primary.ts";
import { getPrimaryNavigationItems } from "../src/site/navigation/model.ts";

const galleryPage = () => sitePages.find((page) => page.id === "gallery");

test("Gallery is a first-class manifest-owned SitePage", () => {
  const page = galleryPage();
  assert.ok(page, "missing gallery SitePage");
  assert.deepEqual(
    {
      id: page.id,
      type: page.type,
      path: page.path,
      enabled: page.enabled,
      renderer: page.renderer,
      build: page.build,
      listed: page.discovery.listed,
      indexable: page.discovery.indexable,
    },
    {
      id: "gallery",
      type: "gallery",
      path: "/gallery/",
      enabled: true,
      renderer: "gallery",
      build: { kind: "vite" },
      listed: true,
      indexable: true,
    },
  );
  assert.equal(getPageByPath("/gallery")?.id, "gallery");
});

test("Gallery participates in primary navigation by SitePage identity", () => {
  assert.ok(
    PRIMARY_NAVIGATION_PAGE_IDS.includes("gallery"),
    "primary navigation must contain the gallery SitePage id",
  );

  const item = getPrimaryNavigationItems().find((candidate) => candidate.id === "gallery");
  assert.ok(item, "missing gallery primary navigation item");
  assert.equal(item.label, "Gallery");
  assert.equal(item.href, "/gallery/");
  assert.match(item.previewSrc, /^\/media\//);
});

test("Gallery public contract is one photo-only collection without layer APIs", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.equal(gallery.galleryLayers, undefined, "public Gallery must not expose layer tabs");
  assert.equal(gallery.DEFAULT_GALLERY_LAYER, undefined, "public Gallery must not have a layer state");
  assert.equal(gallery.getGalleryItemsForLayer, undefined, "public Gallery must not filter by production/art layers");
});

test("Gallery projection keeps only canonical photo-direction images with dimensions and stable series", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  assert.ok(items.length >= 140, `expected a full photo archive, got only ${items.length} items`);

  for (const item of items) {
    assert.equal(item.asset.type, "image", `${item.id} must be an image`);
    assert.ok(item.directions.includes("photo"), `${item.id} is not classified as photography`);
    assert.ok(item.width && item.width > 0, `${item.id} is missing width`);
    assert.ok(item.height && item.height > 0, `${item.id} is missing height`);
    assert.equal("layers" in item, false, `${item.id} still leaks the retired layer model`);
    assert.ok(item.seriesId.length > 0, `${item.id} has no stable series id`);
    assert.ok(Number.isInteger(item.seriesOrder) && item.seriesOrder >= 0, `${item.id} has invalid series order`);
  }
});

test("Gallery URL state owns only the open photo id and ignores retired layer parameters", async () => {
  const state = await import("../src/components/gallery/gallery-state.ts");

  assert.deepEqual(state.parseGallerySearch(""), {
    itemId: null,
  });
  assert.deepEqual(state.parseGallerySearch("?layer=production&item=media-42"), {
    itemId: "media-42",
  });
  assert.deepEqual(state.parseGallerySearch("?layer=unknown"), {
    itemId: null,
  });
  assert.equal(
    state.serializeGalleryState({ itemId: null }),
    "",
  );
  assert.equal(
    state.serializeGalleryState({ itemId: "media-42" }),
    "?item=media-42",
  );
});
