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
  assert.equal(
    state.serializeGalleryState({ layer: "photography", itemId: null }),
    "",
  );
  assert.equal(
    state.serializeGalleryState({ layer: "production", itemId: "media-42" }),
    "?layer=production&item=media-42",
  );
});
