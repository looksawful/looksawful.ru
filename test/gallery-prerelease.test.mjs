import assert from "node:assert/strict";
import test from "node:test";

import { contextualMediaCatalogItems } from "../src/data/media/catalog-view.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";
import { getPageByPath, sitePages } from "../src/site/pages/manifest.ts";
import { PRIMARY_NAVIGATION_PAGE_IDS } from "../src/site/navigation/primary.ts";
import { getPrimaryNavigationItems } from "../src/site/navigation/model.ts";

const galleryPage = () => sitePages.find((page) => page.id === "gallery");

const requiredMusicianProjectIds = [
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-behance-offmi",
];

const hiddenProjectIds = ["shootings-dava"];

const movesAwfulEntryIds = [
  "moves-awful-jestei-landing-animation-01-use-01",
  "moves-awful-jestei-landing-animation-02-use-01",
  "moves-awful-jestei-landing-animation-03-use-01",
];

const jesteiBrandEntryIds = [
  "jestei-system-logo-source-logo-anatomy-slide-use-01",
  "jestei-system-logo-source-logo-color-slide-use-01",
  "jestei-system-logo-source-logo-type-slide-use-01",
  "jestei-system-logo-source-logo-system-01-use-01",
  "jestei-system-type-source-logo-druk-slide-use-01",
];

const jesteiBannerEntryIds = [
  "jestei-05-source-01-701x452-use-01",
  "jestei-05-source-02-1x1-use-01",
  "jestei-05-source-03-1x1-use-01",
  "jestei-05-source-04-1x1-use-01",
  "jestei-05-source-05-1x1-use-01",
  "jestei-05-source-06-1x1-use-01",
  "jestei-05-source-07-1x1-use-01",
  "jestei-05-source-08-1x1-use-01",
  "jestei-05-source-09-1x1-use-01",
  "jestei-05-source-10-1x1-use-01",
  "jestei-05-source-11-3x2-use-01",
];

const jesteiLandingsEntryIds = ["jestei-13-source-13-1280x588-use-01"];

function assetIdsForEntryIds(entryIds) {
  const wanted = new Set(entryIds);
  const matchingEntries = mediaEntries.filter((entry) => wanted.has(entry.id));
  assert.equal(
    matchingEntries.length,
    entryIds.length,
    `expected ${entryIds.length} canonical MediaEntry records, found ${matchingEntries.length}`,
  );
  return new Set(matchingEntries.map((entry) => entry.assetId));
}

const posterAssetIds = new Set(mediaEntries.flatMap((entry) => (
  entry.posterAssetId ? [entry.posterAssetId] : []
)));
const usageAssetIds = new Set(mediaEntries.map((entry) => entry.assetId));
const isTechnicalPosterOnly = (assetId) => posterAssetIds.has(assetId) && !usageAssetIds.has(assetId);

function expectedFamilyImageIds(prefix) {
  return new Set(
    contextualMediaCatalogItems
      .filter((item) => (
        item.asset.type === "image"
        && !item.archived
        && !isTechnicalPosterOnly(item.asset.id)
        && item.projectIds.some((projectId) => projectId.startsWith(prefix))
      ))
      .map((item) => item.asset.id),
  );
}

function assertContainsAssetIds(items, expected, label) {
  const actual = new Set(items.map((item) => item.id));
  for (const assetId of expected) {
    assert.ok(actual.has(assetId), `${label} is missing canonical asset ${assetId}`);
  }
}

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

test("Gallery keeps primary navigation identity but is hidden from rendered primary items", () => {
  assert.ok(
    PRIMARY_NAVIGATION_PAGE_IDS.includes("gallery"),
    "navigation identity must retain the gallery SitePage id",
  );
  assert.equal(
    getPrimaryNavigationItems().some((candidate) => candidate.id === "gallery"),
    false,
    "Gallery must remain hidden from the primary menu",
  );
});

test("Gallery remains one public collection without retired layer APIs", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  assert.equal(gallery.galleryLayers, undefined, "public Gallery must not expose layer tabs");
  assert.equal(gallery.DEFAULT_GALLERY_LAYER, undefined, "public Gallery must not have a layer state");
  assert.equal(gallery.getGalleryItemsForLayer, undefined, "public Gallery must not filter by retired layers");
});

test("Gallery includes approved musicians, restores OFFMi, and keeps DAVA hidden", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  assert.ok(items.length > 0, "Gallery must not be empty");
  for (const projectId of requiredMusicianProjectIds) {
    assert.ok(
      items.some((item) => item.projectIds.includes(projectId)),
      `missing approved musician project ${projectId}`,
    );
  }
  for (const projectId of hiddenProjectIds) {
    assert.equal(
      items.some((item) => item.projectIds.includes(projectId)),
      false,
      `${projectId} must remain hidden from Gallery`,
    );
  }
});

test("Gallery includes every canonical STYX and Sensetique image without technical poster-only assets", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  const styxIds = expectedFamilyImageIds("styx-");
  const sensetiqueIds = expectedFamilyImageIds("sensetique-");
  assert.ok(styxIds.size > 0, "expected STYX image fixtures");
  assert.ok(sensetiqueIds.size > 0, "expected Sensetique image fixtures");

  assertContainsAssetIds(items, styxIds, "STYX Gallery projection");
  assertContainsAssetIds(items, sensetiqueIds, "Sensetique Gallery projection");

  assert.equal(
    items.some((item) => item.asset.type === "video" && item.projectIds.some((id) => id.startsWith("sensetique-"))),
    false,
    "Sensetique video is outside this Gallery scope",
  );
  assert.equal(
    items.some((item) => isTechnicalPosterOnly(item.id)),
    false,
    "technical poster-only derivatives must not become standalone Gallery items",
  );
});

test("Gallery includes exact Moves Awful and Jestei mixed-media selections by canonical asset identity", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  const movesAwfulAssetIds = assetIdsForEntryIds(movesAwfulEntryIds);
  const brandAssetIds = assetIdsForEntryIds(jesteiBrandEntryIds);
  const bannerAssetIds = assetIdsForEntryIds(jesteiBannerEntryIds);
  const landingAssetIds = assetIdsForEntryIds(jesteiLandingsEntryIds);

  assertContainsAssetIds(items, movesAwfulAssetIds, "Moves Awful selection");
  assertContainsAssetIds(items, brandAssetIds, "Jestei brand selection");
  assertContainsAssetIds(items, bannerAssetIds, "Jestei banner selection");
  assertContainsAssetIds(items, landingAssetIds, "Jestei landings video selection");

  for (const assetId of movesAwfulAssetIds) {
    assert.equal(items.find((item) => item.id === assetId)?.kind, "video", `${assetId} must be a video Gallery item`);
  }
  for (const assetId of landingAssetIds) {
    assert.equal(items.find((item) => item.id === assetId)?.kind, "video", `${assetId} must be a video Gallery item`);
  }
});

test("Gallery mixed-media projection preserves intrinsic dimensions and video posters", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const items = gallery.getGalleryItems();

  assert.ok(items.some((item) => item.kind === "image"), "Gallery must contain images");
  assert.ok(items.some((item) => item.kind === "video"), "Gallery must contain videos");

  for (const item of items) {
    assert.equal(item.kind, item.asset.type, `${item.id} kind must match canonical asset type`);
    assert.notEqual(item.asset.type, "model", `${item.id} must not expose a model in Gallery`);
    assert.ok(item.width > 0, `${item.id} is missing width`);
    assert.ok(item.height > 0, `${item.id} is missing height`);
    assert.ok(item.aspectRatio > 0, `${item.id} is missing aspect ratio`);
    assert.equal("layers" in item, false, `${item.id} still leaks the retired layer model`);
    assert.equal("seriesId" in item, false, `${item.id} must not expose retired series layout ownership`);
    if (item.kind === "video") {
      assert.ok(item.posterSrc.length > 0, `${item.id} is missing a canonical video poster`);
    }
  }
});

test("Optional photography outside approved families still follows showInCatalog", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const optionalPhoto = contextualMediaCatalogItems.find((item) => (
    item.asset.type === "image"
    && !item.archived
    && item.workAreaIds.includes("photography")
    && item.projectIds.includes("shootings-behance-ecobasik")
  ));
  assert.ok(optionalPhoto, "missing optional photography fixture");

  assert.deepEqual(
    gallery.getGalleryItemsFromMediaCatalog([{ ...optionalPhoto, showInCatalog: false }]),
    [],
    "optional photography must remain hidden while showInCatalog is false",
  );
  const enabled = gallery.getGalleryItemsFromMediaCatalog([{ ...optionalPhoto, showInCatalog: true }]);
  assert.equal(enabled.length, 1, "showInCatalog must enable optional photography");
  assert.equal(enabled[0].id, optionalPhoto.asset.id);
});

test("Non-photographic design outside approved project families does not enter through showInCatalog", async () => {
  const gallery = await import("../src/data/media/gallery.ts");
  const designItem = contextualMediaCatalogItems.find((item) => (
    item.asset.type === "image"
    && !item.archived
    && !item.workAreaIds.includes("photography")
    && !item.projectIds.some((id) => id.startsWith("styx-") || id.startsWith("sensetique-") || id.startsWith("jestei-"))
  ));
  assert.ok(designItem, "missing non-approved design fixture");
  assert.deepEqual(
    gallery.getGalleryItemsFromMediaCatalog([{ ...designItem, showInCatalog: true }]),
    [],
    `${designItem.asset.id} must not enter Gallery merely through showInCatalog`,
  );
});

test("Gallery URL state owns only the open item id and ignores retired layer parameters", async () => {
  const state = await import("../src/components/gallery/gallery-state.ts");

  assert.deepEqual(state.parseGallerySearch(""), { itemId: null });
  assert.deepEqual(state.parseGallerySearch("?layer=production&item=media-42"), { itemId: "media-42" });
  assert.deepEqual(state.parseGallerySearch("?layer=unknown"), { itemId: null });
  assert.equal(state.serializeGalleryState({ itemId: null }), "");
  assert.equal(state.serializeGalleryState({ itemId: "media-42" }), "?item=media-42");
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
      nextItemId: "media-a",
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
