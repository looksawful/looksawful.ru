# Gallery v1 release plan

> Work only in `feature/gallery-prerelease` until the verified PR merge. Never use `dev`. The release target is `prod`.

## Canonical contract

`/gallery/` is one curated public photography stream.

- photographs only;
- default curation: OBLADAET, EVASHA, IGGUANA, ESMI, HYPRESSION, OFFMi, DAVA and STYX photography;
- other genuine photography is hidden by default and can be enabled through the existing `showInCatalog` / `Показывать в галерее` editorial control;
- direct canonical `workAreaIds` membership `photography` is required;
- a derived Public Catalog `photo` direction alone never proves that an asset is a photograph;
- no Production or Digital Art category;
- no tabs, filters, sort, search or `all` mode;
- no masonry, dense packing or JavaScript layout engine;
- every photograph remains an individual card;
- shoot/series boundaries stay invisible but prevent cross-series interleaving where canonical project context exists;
- existing SitePage, page shell, site navigation, Media Catalog, responsive-media pipeline, PhotoSwipe and design tokens remain the owners;
- no second media registry, runtime folder scan or new layout/lightbox dependency;
- URL state is only optional `?item=<stable-id>`.

Detailed source of truth: `docs/superpowers/specs/2026-09-13-gallery-prerelease-design.md`.

## Task 1: SitePage/build ownership

Keep Gallery as a first-class manifest-owned SitePage:

- `gallery` SitePage id/type/renderer;
- `/gallery/` Vite route;
- central `site-pages-plugin.ts` dispatch;
- semantic build-time renderer in `renderPageShell()`;
- primary navigation identity resolved from the manifest.

Tests cover route normalization, manifest validation and shared navigation ownership.

## Task 2: Curated photo projection

`src/data/media/gallery.ts` projects from the canonical contextual Media Catalog.

Required contract:

1. `asset.type === "image"`;
2. `archived === false`;
3. direct `workAreaIds` contains `photography`;
4. default musician/STYX photography is included;
5. non-default photography requires `showInCatalog === true`;
6. intrinsic dimensions are preserved;
7. stable series identity/order is preserved where canonical contextual data provides it;
8. there is no `galleryLayers`, Production layer or Digital Art layer;
9. credits/title/path strings are never parsed to infer photography.

DAVA is registered through the normal MediaAsset + MediaEntry + Project + Media Catalog path and has canonical responsive derivatives. Boulevard Depo stays out until a real canonical photographic asset exists; the current record is collage art.

## Task 3: Semantic renderer and site-consistent CSS

Renderer output:

- shared site shell/navigation;
- one `gallery` heading;
- one photo stream;
- invisible series sections;
- individual keyboard-openable photo cards;
- intrinsic width/height and responsive image sources;
- no layer controls, filters, sort/search UI or invented series headings.

Gallery CSS:

- shared page padding and semantic spacing;
- project-title typography scale;
- ordinary row-major CSS Grid only;
- responsive columns;
- intrinsic image aspect ratios;
- no CSS columns, dense packing, row-span masonry or layout-ready JS state;
- no image hover zoom/scale/translation;
- shared focus behavior.

## Task 4: Viewer/history runtime

Runtime stays small:

- `gallery-state.ts` parses/serializes only `itemId`;
- legacy `?layer=...` is ignored/normalized away;
- `gallery-lightbox.ts` adapts the single Gallery stream to existing PhotoSwipe;
- `gallery-controller.ts` owns viewer/history/popstate/focus cleanup only;
- there is no Gallery layout runtime and no layer runtime.

Tests cover empty state, `?item=`, retired layer parameters, Back/Forward and viewer independence from layer-panel DOM.

## Task 5: Content readiness

Before production merge, inspect the actual projected Gallery set for:

- unexpected project IDs;
- duplicate item IDs and duplicate source URLs;
- missing intrinsic dimensions;
- non-photographic false positives;
- missing alt/title/credit metadata that would make the public viewer unusable or inaccessible.

Broad #58 Media Catalog taxonomy cleanup is not a release blocker for records outside the curated Gallery subset.

## Task 6: Fresh production integration

Before final verification, merge current `prod` into the feature branch without using `dev` and without dropping unrelated production work.

The Gallery release candidate must be based on the then-current production history, not only the original prerelease base.

## Task 7: Verification and PR Preview

Require fresh exact-head evidence for:

```bash
npm run typecheck
npm run test:fast
npm run css:check
npm run test:media:contract
npm run build:site
```

Existing PR Preview must additionally prove:

- exact head SHA build;
- clean tracked generated-media state;
- Cloudflare asset/media limits;
- isolated noindex deployment;
- direct `/gallery/` load;
- remote Chromium/Playwright smoke against the immutable internet preview.

Review PR diff and confirm no temporary workflow remains.

## Task 8: Release

After all exact-head gates are green:

1. update PR #799 with exact SHA and preview evidence;
2. mark the PR ready for review;
3. merge PR #799 to `prod` using the verified expected head SHA;
4. monitor the production deployment for that exact merge SHA;
5. verify public `https://looksawful.ru/gallery/`, canonical/indexability and direct reload;
6. close Gallery implementation issue #263 and umbrella #59 only after production verification.

Issue #58 remains a separate editorial catalog cleanup task. Issue #259 is superseded by the native CSS Grid decision and stays closed.
