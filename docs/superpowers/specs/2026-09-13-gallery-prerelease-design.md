# Gallery prerelease design

## Goal

Ship `/gallery/` as a first-class, manifest-owned SitePage on a non-production feature branch, publish it through the existing PR Preview infrastructure, and keep `prod` untouched until manual visual approval.

The prerelease is an exhaustive authorial visual surface, not a second media registry or a parallel CMS.

## Product contract

Gallery exposes exactly two user-facing layers:

- `photography`: Ivan's photographs plus authored digital art, collage, and mixed media.
- `production`: work Ivan produced.

A media item may belong to both layers. There is no `all` layer, no eight-direction filter UI, no sorting UI, and no search in this prerelease.

The default route is `/gallery/` and the default layer is `photography`. Production is shareable as `/gallery/?layer=production`. A viewer item may be deep-linked with `?item=<catalog-id>` and combined with the production layer.

## Page ownership

Gallery is a non-entity SitePage owned by the existing page architecture:

- add SitePage id `gallery` and renderer `gallery`;
- add canonical route `/gallery/` to `src/site/pages/manifest.ts`;
- add a minimal Vite input at `gallery/index.html`;
- dispatch through `src/site/build/site-pages-plugin.ts`;
- render through `src/site/renderers/gallery-page.ts`;
- wrap with the existing `renderPageShell()` so metadata, navigation, analytics, sitemap and local-link checks remain shared.

Gallery joins primary navigation by SitePage identity. It must not hard-code an independent href or duplicate the global header.

## Data ownership

`getPublicCatalogItems()` remains the only public media source. Gallery never scans media folders at runtime, never creates `gallery.json`, and never uses the existing empty Google Sheet `Галерея` as a writable source of truth.

A small pure projection in `src/data/media/gallery.ts` maps public catalog items into Gallery presentation items and two layers. The projection owns layer membership, series identity and series order; DOM/runtime code does not infer these values from card text or URLs.

For prerelease, only image items are rendered publicly. Video support remains in the shared catalog and PhotoSwipe architecture but is deferred until poster/accessibility metadata is cleaned.

Where canonical explicit Gallery editorial metadata is not yet available for every historical asset, the prerelease may use stable existing contextual project/collection identity as a temporary migration fallback. It must not parse free-form credit strings, titles or file paths to infer authorship. Final production approval requires explicit editorial layer/series metadata and content cleanup.

## Series grouping and layout

Every media item remains an individual card. Series/shoot group labels are invisible in the public UI.

Visual ordering is series-bounded: one series must finish before the next series begins. A global CSS multi-column layout is forbidden because it can visually interleave two shoots despite correct DOM order.

The semantic build-time fallback is grouped sections containing card grids. Runtime layout enhancement is isolated behind `gallery-layout.ts`. No new layout dependency is introduced for the first prerelease. Existing `@egjs/infinitegrid` may be evaluated only if measured full-volume performance requires virtualization/recycling.

## Visual system

Gallery reuses the site's existing design system:

- global `.site-nav` and breadcrumbs;
- Inter Variable and shared typography tokens;
- `--page-padding-inline` and semantic spacing tokens;
- `--clr-bg`, `--clr-text`, muted text and focus tokens;
- project-title typography for the `gallery` heading;
- text-only layer controls visually aligned with `project-nav__link` states, without importing project-nav docking behavior;
- zero-radius editorial media;
- no custom blur header, pill controls, counter chrome, hover image scaling, or parallel UI theme.

Gallery-specific selectors live in a dedicated `src/styles/gallery.css` owner file imported through the existing stylesheet graph.

## Runtime architecture

Runtime modules are deliberately small:

- `gallery-state.ts`: pure parse/serialize/normalize for layer and viewer URL state.
- `gallery-layout.ts`: sole owner of card geometry and resize/reflow.
- `gallery-lightbox.ts`: converts Gallery/Catalog items to the existing PhotoSwipe item contract.
- `gallery-controller.ts`: DOM events, layer changes, history, focus, layout/viewer coordination and cleanup.

The Gallery runtime is dynamically imported only when `[data-gallery]` exists. It follows the existing shared runtime cleanup convention and tears down listeners on page lifecycle cleanup.

The shared project `media-lightbox.ts` DOM scraper is not reused as Gallery's datasource because it scopes items by project DOM. Gallery creates PhotoSwipe data directly from typed catalog data.

## Accessibility and motion

Build-time HTML contains usable Gallery content before JavaScript.

Requirements:

- meaningful DOM order;
- keyboard-operable layer controls;
- visible/current layer state exposed with ARIA;
- valid image alt behavior;
- no focus stranded on hidden content;
- PhotoSwipe Escape/previous/next and focus restoration retained;
- existing `createMotionPreference()` owns reduced-motion state;
- Gallery does not create an independent `matchMedia` contract;
- no layout animation when reduced motion is requested;
- mobile remains two columns unless measured evidence requires a different fallback.

## URL/history contract

The state module supports:

- `/gallery/` → photography;
- `?layer=production` → production;
- `?item=<stable-id>` → deep-linked viewer item;
- combined `layer` and `item` state.

Unknown layers normalize to photography. Unknown/retired item ids fail safely without trapping history. Back/Forward restores layer and viewer state. Viewer navigation updates `item` without creating an unusable history entry for every arrow press.

## Content and CMS boundary

`showInCatalog` remains the publication gate. Final production readiness should materialize explicit editorial fields in the existing media catalog, conceptually:

- `galleryLayers: ("photography" | "production")[]`;
- stable `seriesId`;
- optional `seriesOrder`.

MediaDesk/CMS should edit those fields in the existing catalog instead of creating a Gallery-specific database. The prerelease must remain compatible with that migration.

Final production content gate requires no duplicate physical Gallery assets, dimensions for every item, meaningful alt text, reviewed credits, canonical media URLs and stable series metadata.

## Preview and release flow

Implementation branch: `feature/gallery-prerelease`, created from exact `prod` SHA `415676bc993519c9e2cf3f54b779cd2f421b7946`.

Open a draft PR targeting `prod`. Existing PR Preview must build the exact head SHA and deploy to the isolated Cloudflare Pages preview project. Preview must remain `noindex` and production must not be merged or deployed for visual review.

Merge to `prod` is explicitly outside this prerelease task and requires manual visual/content approval after preview QA.

## Verification

Required before declaring the preview candidate ready:

- typecheck;
- fast tests including Gallery contracts;
- CSS ownership/checks;
- media contracts;
- production build and postbuild metadata/link checks;
- direct `/gallery/` load;
- both layer states and reload persistence;
- Back/Forward;
- viewer open/close/next/previous and focus restoration;
- reduced-motion behavior;
- responsive desktop/tablet/mobile;
- resize/reflow and no horizontal overflow;
- full current catalog volume without cross-series interleaving;
- Cloudflare PR Preview exact-SHA/noindex/browser smoke.

## Explicit non-goals

- no merge to `prod`;
- no rewrite of project/case pages;
- no second media registry;
- no runtime folder scan;
- no new SPA router;
- no new lightbox dependency;
- no Muuri/justified-layout dependency without benchmark evidence;
- no broad unrelated #256 migration;
- no writable Gallery spreadsheet as source of truth.