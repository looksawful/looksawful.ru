# Gallery prerelease implementation plan

> Work only in `feature/gallery-prerelease`, based on `prod@415676bc993519c9e2cf3f54b779cd2f421b7946`. Do not merge to `prod` during this plan.

## Canonical contract

`/gallery/` is one public photography stream.

- photographs only;
- no Production or Digital Art category;
- no tabs, filters, sort, search or `all` mode;
- no masonry, multi-column packing or JS row-span layout;
- every photograph remains an individual card;
- shoot/series boundaries stay invisible but prevent cross-series interleaving where canonical series context exists;
- historical photos without canonical series context remain an explicit metadata blocker rather than being grouped from filenames/titles;
- existing SitePage, page shell, site navigation, Public Catalog, PhotoSwipe and design tokens remain the owners;
- no second media registry, runtime folder scan or new layout/lightbox dependency;
- URL state is only optional `?item=<stable-id>`;
- preview only until explicit visual/content approval.

The detailed source of truth is `docs/superpowers/specs/2026-09-13-gallery-prerelease-design.md`.

## Task 1: SitePage/build ownership

Keep Gallery as a first-class, manifest-owned SitePage:

- `gallery` SitePage id/type/renderer;
- `/gallery/` Vite route;
- central `site-pages-plugin.ts` dispatch;
- semantic build-time renderer in `renderPageShell()`;
- primary navigation identity resolved from the manifest.

Tests must cover route normalization, manifest validation and shared navigation ownership.

## Task 2: Photo-only data projection

`src/data/media/gallery.ts` projects from the existing canonical media/Public Catalog pipeline.

TDD contract:

1. only `asset.type === "image"` is eligible;
2. only canonical taxonomy resolving to Public Catalog direction `photo` is eligible;
3. archived/retired material stays out;
4. dimensions are preserved;
5. stable series id/order is preserved where current contextual data provides it;
6. there is no `galleryLayers`, `DEFAULT_GALLERY_LAYER` or layer-filter API;
7. no credits/title/path parsing is used to infer photography.

For the isolated noindex prerelease only, historical canonical photo records may pass through a compatibility bridge when `showInCatalog` has not yet been materialized. Final production readiness requires that publication/series metadata be authored through the existing CMS/MediaDesk pipeline.

## Task 3: Semantic renderer and site-consistent CSS

Renderer output:

- shared site shell/navigation;
- one `gallery` heading;
- one photo stream;
- invisible series sections;
- individual keyboard-openable photo cards;
- intrinsic width/height and responsive image sources;
- no layer controls/panels, sort/search UI or invented series headings.

Gallery CSS:

- use shared page padding and semantic spacing;
- use project-title scale `--fs-800`, `--fw-700`, `--lh-display`, `--ls-heading`;
- ordinary row-major CSS Grid only;
- 5 → 4 → 3 → 2 responsive columns unless later visual review changes the authored grid contract;
- intrinsic image aspect ratios;
- no `column-count`, dense packing, grid auto-row masonry, row spans or layout-ready JS state;
- no image hover zoom/scale/translation;
- zero-radius editorial media and shared focus behavior.

## Task 4: Viewer/history runtime

Runtime stays deliberately small:

- `gallery-state.ts` parses/serializes only `itemId`;
- legacy `?layer=...` is ignored and normalized away;
- `gallery-lightbox.ts` reads all `[data-gallery-card]` cards from the single stream and adapts them to existing PhotoSwipe;
- `gallery-controller.ts` owns viewer/history/popstate/focus cleanup only;
- there is no Gallery layout runtime and no layer runtime.

TDD covers empty state, `?item=`, ignored retired layer parameters and lightbox independence from layer-panel DOM.

## Task 5: Series and duplicate/content readiness

The prerelease uses existing contextual project identity only where it is already canonical. It does not infer grouping from titles, filenames, URLs or free-form credits. Historical records without contextual project/series identity currently remain individual structural groups. This is acceptable for noindex prerelease inspection but is a blocker for final production grouping.

Final CMS/MediaDeck work may add canonical `seriesId` and optional `seriesOrder`. Do not add `galleryLayers`.

Duplicate policy:

- do not intentionally publish exact duplicate assets;
- review near duplicates editorially;
- keep the record with the stronger metadata where appropriate;
- do not automatically delete source files;
- do not create a Gallery-specific duplicate registry.

## Task 6: Verification and PR Preview

Before declaring the corrected preview ready, require fresh evidence for:

```bash
npm run typecheck
npm run test:fast
npm run css:check
npm run test:media:contract
npm run build:site
```

Plus the existing PR Preview pipeline must prove:

- exact head SHA build;
- Cloudflare asset/media limits;
- isolated noindex deployment;
- direct `/gallery/` load;
- remote Chromium/Playwright smoke against the immutable internet preview.

Review the PR diff for unrelated changes. Keep PR #799 draft and targeting `prod`.

## Task 7: Stop before production

Do not merge.

Manual visual/content review comes next. Production approval additionally requires cleanup of missing alt/credits, duplicate decisions, explicit publication state and stable series metadata through the existing media/CMS/MediaDesk ownership.
