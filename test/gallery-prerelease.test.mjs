import assert from "node:assert/strict";
import test from "node:test";

import { contextualMediaCatalogItems } from "../src/data/media/catalog-view.ts";
import { catalogDirectionIdsForTaxonomy } from "../src/data/media/public-catalog.ts";
import { getPageByPath, sitePages } from "../src/site/pages/manifest.ts";
import { PRIMARY_NAVIGATION_PAGE_IDS } from "../src/site/navigation/primary.ts";
import { getPrimaryNavigationItems } from "../src/site/navigation/model.ts";

const galleryPage = () => sitePages.find((page) => page.id === "gallery");

const requiredDefaultProjectIds = [
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-behance-offmi",
];

const defaultHiddenProjectIds = [
  "shootings-dava",
  "shootings-behance-ecobasik",
  "shootings-behance-cinema-stills-2",
  "shootings-behance-anka-model-tests",
  "shootings-behance-choose-your-character",
  "shootings-behance-editorial-photography",
];

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

test("Gallery is a visible primary navigation destination", () => {
  assert.ok(
    PRIMARY_NAVIGATION_PAGE_IDS.includes("gallery"),
    "navigation identity must retain the gallery SitePage id",
  );
  assert.equal(
    getPrimaryNavigationItems().some((candidate) => candidate.id === "gallery"),
    true,
    "Gallery must render in the primary menu",
  );
});

test("Gallery public contract keeps one photo collection plus an explicit 3D series without layer APIs", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.equal(gallery.galleryLayers, undefined, "public Gallery must not expose layer tabs");
  assert.equal(gallery.DEFAULT_GALLERY_LAYER, undefined, "public Gallery must not have a layer state");
  assert.equal(gallery.getGalleryItemsForLayer, undefined, "public Gallery must not filter by production/art layers");
  assert.equal(typeof gallery.getGalleryModelItems, "function");
});

test("Gallery 3D curation exposes exactly the five approved Jestei Pool symbols", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const models = gallery.getGalleryModelItems();

  assert.deepEqual(
    models.map((item) => item.id),
    [
      "jestei-symbol-metal",
      "jestei-symbol-pear",
      "jestei-symbol-orange",
      "jestei-symbol-blue",
      "jestei-symbol-biloba",
    ],
  );
  assert.ok(models.every((item) => item.asset.type === "model"));
  assert.ok(models.every((item) => item.asset.src.endsWith(".glb")));
  assert.ok(models.every((item) => item.posterSrc.endsWith(".png")));
});

test("Gallery defaults to the approved musician photography set including Ofelia and OFFMi plus Styx photography", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  assert.ok(items.length > 0, "Gallery must not be empty");

  for (const projectId of requiredDefaultProjectIds) {
    assert.ok(
      items.some((item) => item.projectIds.includes(projectId)),
      `missing default Gallery photography project ${projectId}`,
    );
  }

  assert.ok(
    items.some((item) => item.projectIds.some((projectId) => projectId.startsWith("styx-"))),
    "missing Styx photography",
  );

  for (const projectId of defaultHiddenProjectIds) {
    assert.equal(
      items.some((item) => item.projectIds.includes(projectId)),
      false,
      `${projectId} must be hidden from Gallery by default`,
    );
  }
});

test("Gallery requires canonical photography work area, not a derived photo direction", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.equal(typeof gallery.getGalleryItemsFromMediaCatalog, "function");

  const designFalsePositive = contextualMediaCatalogItems.find((item) => (
    item.asset.type === "image"
    && !item.archived
    && !item.workAreaIds.includes("photography")
    && catalogDirectionIdsForTaxonomy(item).includes("photo")
  ));
  assert.ok(designFalsePositive, "fixture must contain a non-photo asset with derived photo direction");

  assert.deepEqual(
    gallery.getGalleryItemsFromMediaCatalog([
      { ...designFalsePositive, showInCatalog: true },
    ]),
    [],
    `${designFalsePositive.asset.id} is a design asset and must not enter Gallery`,
  );
});

test("Other real photography is off by default and can be enabled with showInCatalog", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.equal(typeof gallery.getGalleryItemsFromMediaCatalog, "function");

  const optionalPhoto = contextualMediaCatalogItems.find((item) => (
    item.asset.type === "image"
    && !item.archived
    && item.workAreaIds.includes("photography")
    && item.projectIds.includes("shootings-behance-ecobasik")
  ));
  assert.ok(optionalPhoto, "missing optional photography fixture");

  assert.deepEqual(
    gallery.getGalleryItemsFromMediaCatalog([
      { ...optionalPhoto, showInCatalog: false },
    ]),
    [],
    "optional photography must remain hidden while showInCatalog is false",
  );

  const enabled = gallery.getGalleryItemsFromMediaCatalog([
    { ...optionalPhoto, showInCatalog: true },
  ]);
  assert.equal(enabled.length, 1, "showInCatalog must enable optional photography");
  assert.equal(enabled[0].id, optionalPhoto.asset.id);
});

test("Gallery projection keeps intrinsic dimensions and stable series", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  for (const item of items) {
    assert.equal(item.asset.type, "image", `${item.id} must be an image`);
    assert.ok(item.width && item.width > 0, `${item.id} is missing width`);
    assert.ok(item.height && item.height > 0, `${item.id} is missing height`);
    assert.equal("layers" in item, false, `${item.id} still leaks the retired layer model`);
    assert.ok(item.seriesId.length > 0, `${item.id} has no stable series id`);
    assert.ok(Number.isInteger(item.seriesOrder) && item.seriesOrder >= 0, `${item.id} has invalid series order`);
  }
});

test("Gallery URL state owns canonical item id plus optional 1-based slide", async () => {
  const state = await import("../src/components/gallery/gallery-state.ts");

  assert.deepEqual(state.parseGallerySearch(""), {
    itemId: null,
    slide: null,
  });
  assert.deepEqual(state.parseGallerySearch("?layer=production&item=media-42&slide=4"), {
    itemId: "media-42",
    slide: 4,
  });
  assert.deepEqual(state.parseGallerySearch("?item=media-42&slide=0"), {
    itemId: "media-42",
    slide: null,
  });
  assert.deepEqual(state.parseGallerySearch("?item=media-42&slide=wat"), {
    itemId: "media-42",
    slide: null,
  });
  assert.deepEqual(state.parseGallerySearch("?slide=2"), {
    itemId: null,
    slide: null,
  });
  assert.deepEqual(state.parseGallerySearch("?layer=unknown"), {
    itemId: null,
    slide: null,
  });
  assert.equal(
    state.serializeGalleryState({ itemId: null, slide: 3 }),
    "",
  );
  assert.equal(
    state.serializeGalleryState({ itemId: "media-42", slide: null }),
    "?item=media-42",
  );
  assert.equal(
    state.serializeGalleryState({ itemId: "media-42", slide: 4 }),
    "?item=media-42&slide=4",
  );
});

test("Gallery viewer history pushes once, replaces slides, and closes without ejecting deep links", async () => {
  const state = await import("../src/components/gallery/gallery-state.ts");
  assert.equal(typeof state.galleryViewerHistoryTransition, "function");

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: null,
      nextItemId: "media-a",
      ownsViewerEntry: false,
      cause: "viewer-change",
    }),
    { action: "push", ownsViewerEntry: true },
  );

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: "media-a",
      nextItemId: "media-b",
      ownsViewerEntry: true,
      cause: "viewer-change",
    }),
    { action: "replace", ownsViewerEntry: true },
  );

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: "media-a",
      currentSlide: 1,
      nextItemId: "media-a",
      nextSlide: 2,
      ownsViewerEntry: true,
      cause: "viewer-change",
    }),
    { action: "replace", ownsViewerEntry: true },
  );

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: "media-a",
      currentSlide: 2,
      nextItemId: "media-a",
      nextSlide: 2,
      ownsViewerEntry: true,
      cause: "viewer-change",
    }),
    { action: "none", ownsViewerEntry: true },
  );

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: "media-a",
      nextItemId: null,
      ownsViewerEntry: true,
      cause: "viewer-close",
    }),
    { action: "back", ownsViewerEntry: false },
  );

  assert.deepEqual(
    state.galleryViewerHistoryTransition({
      currentItemId: "media-a",
      nextItemId: null,
      ownsViewerEntry: false,
      cause: "viewer-close",
    }),
    { action: "replace", ownsViewerEntry: false },
  );
});
