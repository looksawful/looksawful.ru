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

test("Gallery prerelease exposes only photography and production as public layers", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.deepEqual(gallery.galleryLayers, ["photography", "production"]);
  assert.equal(gallery.DEFAULT_GALLERY_LAYER, "photography");
});

test("Gallery projection keeps full-volume image media, dimensions and stable series", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();
  const photography = gallery.getGalleryItemsForLayer("photography", items);
  const production = gallery.getGalleryItemsForLayer("production", items);

  assert.ok(
    photography.length >= 150,
    `expected at least 150 photography items in prerelease, got ${photography.length}`,
  );
  assert.ok(
    production.length >= 150,
    `expected at least 150 production items in prerelease, got ${production.length}`,
  );

  for (const item of items) {
    assert.equal(item.asset.type, "image", `${item.id} must be an image in the first prerelease`);
    assert.ok(item.width && item.width > 0, `${item.id} is missing width`);
    assert.ok(item.height && item.height > 0, `${item.id} is missing height`);
    assert.ok(item.layers.length > 0, `${item.id} has no Gallery layer`);
    assert.ok(item.seriesId.length > 0, `${item.id} has no stable series id`);
    assert.ok(Number.isInteger(item.seriesOrder) && item.seriesOrder >= 0, `${item.id} has invalid series order`);
  }
});

test("Gallery URL state keeps photography implicit and production shareable", async () => {
  const state = await import("../src/components/gallery/gallery-state.ts");

  assert.deepEqual(state.parseGallerySearch(""), {
    layer: "photography",
    itemId: null,
  });
  assert.deepEqual(state.parseGallerySearch("?layer=production&item=media-42"), {
    layer: "production",
    itemId: "media-42",
  });
  assert.deepEqual(state.parseGallerySearch("?layer=unknown"), {
    layer: "photography",
    itemId: null,
  });
  assert.equal(
    state.serializeGalleryState({ layer: "photography", itemId: null }),
    "",
  );
  assert.equal(
    state.serializeGalleryState({ layer: "production", itemId: "media-42" }),
    "?layer=production&item=media-42",
  );
});
