# Gallery prerelease implementation plan

> Implement from `feature/gallery-prerelease`, based on `prod@415676bc993519c9e2cf3f54b779cd2f421b7946`. Do not merge to `prod` during this plan.

## Task 1: Lock the SitePage contract with RED tests

**Files**
- Modify: `test/site-pages.test.mjs`
- Modify: `tools/ci/run-tests.mjs` only if a new cheap Gallery test file is added

**RED assertions**
1. Add `gallery -> /gallery/` to the canonical route map.
2. Assert Gallery is an enabled, listed, indexable, Vite-owned SitePage with renderer `gallery`.
3. Assert normalized lookup resolves `/gallery` to `gallery`.

Commit the test-only change. Open a draft PR to `prod`. Confirm Fast CI fails for the expected missing Gallery manifest/type implementation rather than syntax or harness setup.

## Task 2: Add minimal manifest/build ownership

**Files**
- Modify: `src/site/pages/types.ts`
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/build/site-pages-plugin.ts`
- Create: `src/site/renderers/gallery-page.ts`
- Create: `gallery/index.html`

**Implementation**
1. Add `gallery` SitePage id/type/renderer without changing entity semantics.
2. Add `/gallery/` Vite SitePage to manifest.
3. Add renderer dispatch in central site-pages plugin.
4. Add a minimal build-time Gallery renderer wrapped with `renderPageShell()`.
5. Add the physical Vite input expected by existing input generation.

Run/observe `test/site-pages.test.mjs`, typecheck and build. Keep implementation minimal until tests are green.

## Task 3: Lock and implement navigation integration

**Files**
- Modify: `src/site/navigation/primary.ts`
- Modify: `src/site/navigation/model.ts`
- Modify: `src/content/navigation.json`
- Modify/add relevant navigation tests

**RED assertions**
1. Gallery appears in primary navigation by SitePage id.
2. Label is `Gallery`.
3. Navigation href resolves from manifest to `/gallery/`.
4. Gallery has a stable preview image override and breadcrumb label.

**Implementation**
Add the Gallery id, content label and a canonical existing media preview asset. Extend domain label handling for the new page type. Do not hard-code a second href.

## Task 4: Lock the two-layer data projection

**Files**
- Create: `src/data/media/gallery.ts`
- Create: `test/gallery-data.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**RED assertions**
1. Only `photography` and `production` are public layers.
2. Default layer is photography.
3. Only public, non-archived image catalog items enter prerelease output.
4. Items retain stable catalog ids and dimensions.
5. Series order is deterministic and groups remain contiguous.
6. No title/path/free-form credit parsing is used for layer membership.

**Implementation**
Build a pure projection over `getPublicCatalogItems()`. Prefer canonical explicit Gallery editorial metadata where present; use only stable contextual identity as a migration fallback for historical prerelease content. Preserve an interface that can move fully to explicit `galleryLayers/seriesId/seriesOrder` without runtime changes.

## Task 5: Build semantic Gallery HTML and consistent CSS

**Files**
- Modify: `src/site/renderers/gallery-page.ts`
- Create: `src/styles/gallery.css`
- Modify: `src/styles/index.css`
- Create/modify Gallery render/style contract tests

**RED assertions**
1. Build-time output contains heading, two layer controls and semantic image cards.
2. No custom Gallery site header, pills, sort/search/all controls or visible series labels.
3. Cards carry stable item/series identity and intrinsic dimensions.
4. CSS does not use multi-column masonry for Gallery.
5. Gallery styles use shared page/color/type tokens and zero editorial radius.

**Implementation**
Use existing site shell/navigation. Render a project-title-like `gallery` heading, text-only layer controls and invisible series-bounded grids. Provide a JS-off photography baseline.

## Task 6: Lock and implement URL/history state

**Files**
- Create: `src/components/gallery/gallery-state.ts`
- Create: `test/gallery-state.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**RED assertions**
1. Empty query normalizes to photography.
2. `layer=production` round-trips.
3. Unknown layers normalize safely.
4. `item` preserves stable ids and combines with layer.
5. Serialization omits default photography from URL.

**Implementation**
Pure functions only; no DOM or global history access in this module.

## Task 7: Layout runtime with bounded series

**Files**
- Create: `src/components/gallery/gallery-layout.ts`
- Create: relevant cheap unit/contract test where practical

**Implementation**
Own only card sizing/reflow. Keep series as independent layout boundaries so a new series never starts in a free column of the previous one. Start with existing platform/CSS capabilities and no new dependency. Respect intrinsic dimensions and resize events.

## Task 8: PhotoSwipe adapter and controller

**Files**
- Inspect/reuse existing PhotoSwipe wrapper
- Create: `src/components/gallery/gallery-lightbox.ts`
- Create: `src/components/gallery/gallery-controller.ts`
- Modify: shared runtime entry only to dynamically import Gallery when `[data-gallery]` exists
- Add tests for adapter/state/lifecycle contracts

**RED assertions**
1. Gallery viewer datasource comes from typed Gallery/Catalog items, not DOM scraping.
2. Open item state updates URL.
3. Close restores URL and focus.
4. next/previous replaces current item state without flooding history.
5. layer changes push meaningful history state.
6. popstate restores layer/viewer state.
7. reduced motion uses existing motion preference contract.

**Implementation**
Use existing PhotoSwipe runtime and cleanup conventions. Do not modify project-page lightbox behavior unless a tiny reusable extraction is required and covered by regression tests.

## Task 9: Responsive/full-volume and content safety

**Files**
- Extend existing e2e/responsive smoke tools only as needed
- No production content migration beyond the minimum needed for prerelease rendering

**Checks**
1. Current full Gallery dataset renders without cross-series mixing.
2. Desktop/tablet/mobile layouts have no horizontal overflow.
3. Mobile keeps two columns where viable.
4. Broken/missing metadata fails safely.
5. Images have intrinsic dimensions; current source URLs remain canonical.
6. Document remaining alt/credits/duplicate/editorial-tagging blockers for final production approval.

## Task 10: Full verification and PR Preview

Run or require green results for:

```bash
npm run typecheck
npm run test:fast
npm run css:check
npm run lint:style
npm run test:media:contract
npm run build:site
npm run test:e2e:smoke
npm run test:ui:responsive
```

Review changed files and PR diff for unrelated changes. Confirm branch still targets `prod` and does not include `dev` history.

Let the existing PR Preview workflow deploy the exact head SHA to `looksawful-ru-preview`. Verify noindex, exact SHA and browser smoke. Return the live PR Preview URL for manual visual approval.

## Task 11: Stop before production

Do not merge. Record remaining content/CMS/MediaDeck/performance findings on the PR. Production merge happens only after visual approval and final content/editorial cleanup.