# Gallery prerelease design

## Goal

Ship `/gallery/` as a first-class, manifest-owned SitePage on a non-production feature branch, publish it through the existing PR Preview infrastructure, and keep `prod` untouched until manual visual approval.

Gallery is one curated public photography surface. It is not a second media registry, a parallel CMS, an art/production taxonomy browser, or a new visual system.

## Canonical product contract

Gallery v1 contains photographs only. Curated 3D is the next planned extension and must be added through an explicit typed media contract rather than by weakening photography eligibility.

There is exactly one public stream:

- no `photography / production` tabs;
- no `all` layer;
- no direction matrix;
- no sort;
- no search;
- no public category switcher.

The default visible selection is deliberately small and music-focused:

- OBLADAET photography;
- EVASHA photography;
- IGGUANA photography;
- ESMI photography;
- HYPRESSION photography;
- OFELIA photography;
- OFFMi photography;
- DAVA photography;
- STYX photography.

A musician is included only when an actual photographic asset exists in the canonical media registry. A collage, illustration or design asset does not become Gallery-eligible merely because its subject is a musician. Boulevard Depo currently has a collage-art record but no canonical photographic asset in the current media set, so it stays out until a real photograph is registered.

All other genuine photography remains available in the existing Media Catalog but is hidden from Gallery by default. Editors may opt an individual photograph into Gallery using the existing `showInCatalog` field exposed in CMS/MediaDesk as `Показывать в галерее`. No Gallery-specific visibility database or second registry is introduced.

`production` may describe context or role, but it is never a separate Gallery category. Standalone digital art, collage, illustration, graphic design, identity work, UI/product work, equipment/documentation imagery and other non-photographic material remain outside Gallery v1. Curated 3D models/renders are reserved for the explicit next Gallery phase.

A Gallery item must be a canonical image whose direct media metadata contains `workAreaIds: ["photography", ...]`. The broader Public Catalog direction `photo` is not sufficient because project/deliverable taxonomy can derive that direction for non-photographic design assets. Free-form credits, titles, filenames and folder paths are never parsed to guess that an item is a photograph.

## Page ownership

Gallery is a non-entity SitePage owned by the existing page architecture:

- SitePage id `gallery` and renderer `gallery`;
- canonical route `/gallery/` in `src/site/pages/manifest.ts`;
- minimal Vite input at `gallery/index.html`;
- dispatch through `src/site/build/site-pages-plugin.ts`;
- render through `src/site/renderers/gallery-page.ts`;
- wrap with the existing `renderPageShell()` so metadata, navigation, analytics, sitemap and local-link checks remain shared.

Gallery joins primary navigation by SitePage identity. It must not hard-code an independent href or duplicate the global header.

## Data ownership and eligibility

`contextualMediaCatalogItems` remains the canonical contextual media source and `toCatalogItem()` remains the Public Catalog projection boundary. Gallery never scans media folders at runtime, never creates `gallery.json`, and never uses the Google Sheet `Галерея` as a writable source of truth.

`src/data/media/gallery.ts` applies only Gallery presentation eligibility:

1. `asset.type === "image"`;
2. `archived === false`;
3. direct `workAreaIds` contains `photography`;
4. item belongs to one of the canonical default musician projects or a canonical STYX project, **or** `showInCatalog === true`;
5. intrinsic width/height are present;
6. stable contextual project identity is preserved for series grouping where available.

The default musician project set is an explicit product-curation rule, not a media-asset registry. Asset identity, URLs, dimensions, captions, taxonomy and publication metadata remain owned by the existing Media Catalog/MediaEntry system.

For non-default photography, `showInCatalog` is the editor-controlled opt-in. This lets CMS/MediaDesk enable more photographs later without changing Gallery runtime code.

The old prerelease compatibility bridge that force-enabled every derived `photo` item is forbidden. It caused both overpopulation and design-asset false positives and is superseded by this contract.

## Missing-media policy

If a photograph exists in the live media inventory but is absent from the TS media registry, it must be registered through the normal MediaAsset + MediaEntry + Project + Media Catalog path before Gallery can use it.

Do not add direct media URLs to Gallery as a shortcut.

DAVA is the first corrected example: its existing physical file is registered as a normal MediaAsset and MediaEntry under canonical project `shootings-dava` rather than being special-cased in the renderer.

## Duplicate and editorial policy

The public Gallery must not intentionally show duplicate photographs.

- exact duplicate sources/asset registrations must be reconciled to one canonical public item;
- visual/near duplicates are reviewed editorially before one version is selected;
- the more complete caption/credit metadata is retained when duplicate records conflict;
- source files are not automatically deleted as part of Gallery cleanup;
- automatic destructive duplicate cleanup is forbidden.

This is a content-readiness rule, not permission to create a Gallery-specific duplicate registry.

## Series grouping and layout

Every photograph remains an individual card. A shoot/series is not collapsed into an album card.

Series labels are invisible in the public UI, but series are real structural boundaries: one series finishes before the next begins, so two shoots cannot visually interleave.

The prerelease uses current canonical contextual project identity as the series boundary when it exists. Historical photo records without contextual project/series identity fall back to individual boundaries rather than title/path heuristics. Final production readiness requires canonical `seriesId` / `seriesOrder` to be authored for those records through the existing media/CMS boundary.

Masonry is explicitly forbidden for Gallery. This includes:

- CSS multi-column layout;
- dense packing;
- JS row-span masonry;
- global layouts that visually reorder source order.

The prerelease uses ordinary responsive CSS Grid in row-major DOM order inside each invisible series section. Images keep their intrinsic aspect ratio. JavaScript does not own card geometry.

No new layout dependency is introduced.

## Visual system

Gallery must look like looksawful.ru, not like a standalone Gallery microsite.

It reuses:

- shared `.site-nav` and breadcrumbs;
- Inter Variable and shared typography tokens;
- `--page-padding-inline` and semantic spacing tokens;
- shared colors/surfaces/focus behavior;
- project-title scale for the Gallery heading;
- zero-radius editorial media;
- existing global focus styling.

Gallery-specific CSS owns only page composition and photo grid. It must not create a second palette, button system, blur header, pills, counters, custom focus language or giant hero treatment.

Photographs receive no decorative hover zoom/scale/translation.

## Runtime architecture

Runtime remains intentionally small:

- `gallery-state.ts`: pure parse/serialize for optional open `item` id only;
- `gallery-lightbox.ts`: adapts Gallery items to the existing PhotoSwipe contract;
- `gallery-controller.ts`: viewer/history/focus coordination and cleanup;
- no Gallery layout runtime;
- no layer controller/state.

The only canonical shareable Gallery states are `/gallery/` and `/gallery/?item=<stable-id>`.

Legacy `?layer=...` parameters are ignored and normalized away. Back/Forward restores viewer state. Viewer navigation updates `item` without creating a useless history entry for every arrow press.

## Accessibility and motion

Build-time HTML contains usable Gallery content before JavaScript.

Requirements:

- meaningful row-major DOM order;
- intrinsic image dimensions;
- valid alt behavior;
- keyboard-openable photographs;
- PhotoSwipe Escape/previous/next behavior;
- focus restoration on viewer close;
- no focus stranded in hidden content;
- no Gallery-specific motion system;
- no image hover transforms;
- reduced-motion behavior inherited from shared site/viewer contracts.

## Content and CMS boundary

The existing Media Catalog / MediaEntry / MediaDesk / CMS pipeline owns assets and editorial metadata.

`showInCatalog` remains the existing editor-visible `Показывать в галерее` switch for optional photography. Do not add `showInGallery` or `galleryLayers`.

For scalable series management, the existing media schema may later gain canonical editorial fields such as stable `seriesId` and optional `seriesOrder`.

The final production content gate requires:

- all intended musician and STYX photographs present in the canonical media registry;
- no intended public duplicates;
- no non-photographic design assets;
- dimensions for every Gallery item;
- reviewed alt text;
- reviewed credits/captions used in the viewer;
- canonical source URLs;
- stable series metadata for all public photographs;
- optional non-default photos controlled through the existing `showInCatalog` field.

## Preview and release flow

Implementation branch: `feature/gallery-prerelease`, created from exact `prod` SHA `415676bc993519c9e2cf3f54b779cd2f421b7946`.

PR #799 remains a draft targeting `prod`. Existing PR Preview builds the exact head SHA and deploys to the isolated Cloudflare Pages preview project. Preview stays `noindex`; production is not changed for visual review.

Merge to `prod` is outside this prerelease task and requires explicit manual visual/content approval after preview QA.

## Verification

Required before calling the curated preview candidate ready:

- typecheck;
- Fast CI including curated Gallery contracts;
- default Gallery includes OBLADAET, EVASHA, IGGUANA, ESMI, HYPRESSION, OFELIA, OFFMi, DAVA and STYX photography;
- non-default Shootings projects such as Ecobasik, cinema stills, model tests and editorial photography are absent unless explicitly opted in;
- direct `workAreaIds` photography guard rejects design false positives even if their broader direction resolves to `photo`;
- `showInCatalog=false` hides optional photography and `showInCatalog=true` enables it;
- CSS architecture checks;
- production-like build and metadata/local-link checks;
- direct `/gallery/` load;
- no filters/layers in rendered HTML;
- no masonry CSS/runtime mechanics;
- series do not interleave where canonical boundaries exist;
- `?item=` deep link and Back/Forward;
- viewer open/close/next/previous and focus restoration;
- responsive desktop/tablet/mobile;
- no image hover transform;
- no horizontal overflow;
- Cloudflare PR Preview exact-SHA/noindex/browser smoke.

## Explicit non-goals

- no merge to `prod`;
- no Production Gallery category;
- no Digital Art Gallery category;
- no filters, sort or search;
- no masonry;
- no second media registry;
- no runtime folder scan;
- no new SPA router;
- no new lightbox dependency;
- no new layout dependency;
- no writable Gallery spreadsheet as source of truth;
- no automatic destructive duplicate deletion.
