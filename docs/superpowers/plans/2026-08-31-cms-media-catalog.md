# CMS Media Catalog — Implementation Plan

> Execute test-first. Preserve all existing rendered copy, routes, media ordering and presentation contracts.

**Goal:** Add a searchable, typed, CMS-managed catalog for every current media asset plus new photo/video uploads, using the repository's canonical taxonomies.

**Architecture:** Keep current asset modules authoritative for registered media. Store one editable JSON record per asset, generate a static import index, parse records into `MediaCatalogItem` values and add only CMS-uploaded assets to the physical registry. Use a sync tool for import-index generation and upload technical metadata.

**Stack:** TypeScript, native Node test runner, Pages CMS, Sharp, ffprobe, Vite and the existing GitHub Actions publication path.

---

## Task 1: Lock the catalog contract with failing tests

**Files:**

- Create: `test/media-catalog-cms.test.mjs`
- Create: `test/media-catalog-sync.test.mjs`

**Steps:**

1. Assert that the curated taxonomy contains the requested work areas, shooting types and deliverables.
2. Assert that every current registered asset has exactly one registered JSON record.
3. Assert representative semantic classifications for music photography, Sensetique production, Styx scanography, Jestei mockups and motion/video.
4. Assert strict parser failures for unknown IDs, fields and taxonomy values.
5. Assert that a valid upload record becomes a normal `MediaAsset` and catalog item.
6. Assert query intersections and tag matching.
7. Assert Pages CMS exposes searchable registered records, createable uploads, photo/video storage, editable properties and controlled taxonomy fields.
8. Run the focused test and confirm it fails because the implementation does not yet exist.

## Task 2: Complete and curate canonical taxonomy

**Files:**

- Modify: `src/data/taxonomy/project-types.ts`
- Modify: `src/data/taxonomy/deliverables.ts`
- Implement: `src/data/taxonomy/media-taxonomy.ts`
- Modify: `src/data/catalog/projects/shootings.ts`

**Steps:**

1. Add only missing canonical IDs (`music-shooting` and requested deliverable formats).
2. Build the media-specific curated subsets and hierarchy by selecting from canonical arrays.
3. Add shooting project-type metadata where existing shooting records already make the meaning explicit.
4. Run taxonomy-focused tests.

## Task 3: Implement typed catalog records and upload assets

**Files:**

- Modify: `src/types/media.ts`
- Create: `src/data/media/assets/registered.ts`
- Modify: `src/data/media/assets/index.ts`
- Create: `src/data/media/catalog-records.generated.ts`
- Create: `src/data/media/catalog.ts`
- Modify: `src/data/media/index.ts`

**Steps:**

1. Add catalog record/item/filter types without changing `MediaEntry` behavior.
2. Extract the current asset aggregation into `registeredMediaAssets`.
3. Parse registered and uploaded records with exact-key and canonical-ID validation.
4. Convert uploaded records to `MediaAsset` values and include them in `mediaAssets`.
5. Implement stable lookup and faceted query functions.
6. Run parser and query tests.

## Task 4: Seed and synchronize CMS data

**Files:**

- Create: `tools/sync-media-catalog.mjs`
- Create: `src/content/media-catalog/registered/*.json`
- Create: `src/content/media-catalog/uploads/.gitkeep`
- Modify: `package.json`

**Steps:**

1. Generate one deterministic initial record per current asset from entries and project metadata.
2. Preserve authored title/caption strings byte-for-byte when they are copied as catalog defaults.
3. Implement missing-record seeding that never overwrites manually edited classification fields.
4. Implement technical probing for uploaded image/video records.
5. Generate a deterministic static TypeScript import index.
6. Add `media:catalog:sync` before video and responsive media generation.
7. Run sync twice and assert the second run is clean.

## Task 5: Expose the catalog and upload flow in Pages CMS

**Files:**

- Modify: `.pages.yml`
- Modify: `docs/cms-content-map.md`

**Steps:**

1. Add a photo/video media source scoped to `public/media/catalog`.
2. Add a searchable readonly-identity collection for registered media.
3. Add a searchable createable collection for new uploads.
4. Expose shared metadata, free tags, projects and curated canonical taxonomy selections.
5. Keep route, renderer, layout, classes, media-entry ordering and current captions outside CMS.
6. Update the ownership map.
7. Run CMS configuration tests.

## Task 6: Integrate synchronization with dev verification

**Files:**

- Modify: `.github/workflows/verify-dev.yml`
- Modify: `.github/workflows/verify-pr.yml`

**Steps:**

1. Run catalog synchronization before TypeScript and media generation.
2. On direct CMS commits to `dev`, persist only synchronized catalog technical metadata and the generated import index when the source change is confined to approved catalog/media paths.
3. Make pull-request verification fail on stale generated catalog data.
4. Keep existing project-cover and generated-media safety checks intact.

## Task 7: Verify, review and publish

**Steps:**

1. Run focused media catalog tests.
2. Run typecheck and core integrity tests.
3. Run the production build and available browser smoke tests.
4. Inspect the complete diff for authored-copy, workflow and generated-file safety.
5. Commit and push the feature branch.
6. Open and merge a reviewed PR to `dev` after required checks pass.
7. Verify `dev`, open and merge `dev -> prod`, then verify GitHub Pages deployment and live pages.
