# Gallery prerelease design

## Goal

Ship `/gallery/` as a first-class, manifest-owned SitePage on a non-production feature branch, publish it through the existing PR Preview infrastructure, and keep `prod` untouched until manual visual approval.

Gallery is one public photography surface. It is not a second media registry, a parallel CMS, an art/production taxonomy browser, or a new visual system.

## Canonical product contract

Gallery contains photographs only.

There is exactly one public stream:

- no `photography / production` tabs;
- no `all` layer;
- no direction matrix;
- no sort;
- no search;
- no public category switcher.

`production` may describe the context or role of a photographic asset, but it is never a separate Gallery category. A Sensetique image classified canonically as both `photography` and `production` is eligible as a photograph. Production-only material is not eligible.

Standalone digital art, collage, illustration, graphic design, 3D renders, identity work, UI/product work, equipment/documentation imagery and other non-photographic material are outside Gallery. Post-production, compositing, AI treatment or strong styling do not by themselves disqualify an image when the work remains canonically classified as photography. Standalone 3D/digital-art work must not be smuggled back into Gallery by treating a virtual camera as sufficient evidence of photography.

For the prerelease, eligibility is driven by the existing canonical Public Catalog taxonomy: the item must be an image and resolve to the `photo` public direction. Free-form credits, titles, filenames and folder paths are never parsed to guess that an item is a photograph.

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

`getPublicCatalogItems()` remains the public media boundary. Gallery never scans media folders at runtime, never creates `gallery.json`, and never uses the Google Sheet `Галерея` as a writable source of truth.

The Gallery projection in `src/data/media/gallery.ts` is intentionally small. It may temporarily promote historical canonical photo records through the existing Public Catalog converter for the isolated noindex prerelease while `showInCatalog` is still incomplete, but it must:

1. accept only `asset.type === "image"`;
2. reject archived/retired material;
3. accept only items whose canonical taxonomy resolves to Public Catalog direction `photo`;
4. preserve intrinsic width/height;
5. preserve a stable series identity/order where canonical contextual data already provides it;
6. never introduce `galleryLayers`, a Production layer, or a Digital Art layer;
7. never infer eligibility from credits/title/path text.

Final production approval requires publication flags and series metadata to be materialized through the existing media/CMS workflow so the prerelease compatibility bridge can be removed.

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

Masonry is explicitly forbidden for Gallery. This includes:

- CSS multi-column layout;
- dense packing;
- JS row-span masonry;
- global layouts that visually reorder source order.

The prerelease uses ordinary responsive CSS Grid in row-major DOM order inside each invisible series section. Images keep their intrinsic aspect ratio. The layout stays readable without JavaScript; JavaScript does not own card geometry.

No new layout dependency is introduced. Existing `@egjs/infinitegrid` is not used unless later measurement proves that a much larger archive requires virtualization, and any such change requires a separate approved design.

## Visual system

Gallery must look like looksawful.ru, not like a standalone Gallery microsite.

It reuses:

- the shared `.site-nav` and breadcrumbs;
- Inter Variable and shared typography tokens;
- `--page-padding-inline` and semantic spacing tokens;
- `--clr-bg`, `--clr-text`, shared surface/focus behavior;
- the project-title scale (`--fs-800`, `--fw-700`, `--lh-display`, `--ls-heading`) for the Gallery heading;
- zero-radius editorial media;
- existing global focus styling.

Gallery-specific CSS owns only the page composition and photo grid. It must not create a second palette, button system, blur header, pills, counters, custom focus language or giant `fs-900` hero treatment.

Photographs receive no decorative hover zoom/scale/translation. Viewer/open controls may have ordinary interaction states, but the photograph itself stays visually stable.

## Runtime architecture

Runtime is intentionally smaller than the superseded two-layer prototype:

- `gallery-state.ts`: pure parse/serialize for the optional open `item` id only;
- `gallery-lightbox.ts`: adapts Gallery items to the existing PhotoSwipe contract;
- `gallery-controller.ts`: viewer/history/focus coordination and cleanup;
- no Gallery layout runtime;
- no layer controller/state.

The only canonical shareable Gallery state is:

- `/gallery/`;
- `/gallery/?item=<stable-id>`.

Legacy `?layer=...` parameters are ignored and normalized away. Back/Forward restores viewer state. Viewer navigation updates `item` without creating a useless history entry for every arrow press.

The shared project `media-lightbox.ts` DOM scraper is not reused as Gallery's datasource because it scopes items by project DOM. Gallery uses its own thin adapter over the existing PhotoSwipe implementation.

## Accessibility and motion

Build-time HTML contains usable Gallery content before JavaScript.

Requirements:

- meaningful row-major DOM order;
- intrinsic image dimensions;
- valid alt behavior;
- keyboard-openable photographs;
- PhotoSwipe Escape/previous/next behavior;
- focus restoration on viewer close;
- no focus stranded in hidden content, because Gallery has no hidden layer panels;
- no Gallery-specific motion system;
- no image hover transforms;
- reduced-motion behavior inherited from the shared site/viewer contracts.

## Content and CMS boundary

`showInCatalog` remains the publication gate. Photography eligibility remains canonical taxonomy, not a Gallery-only database.

The existing Media Catalog / MediaEntry / MediaDesk / CMS pipeline remains the owner of assets and editorial metadata. For scalable series management, the existing media schema may later gain canonical editorial fields such as:

- stable `seriesId`;
- optional `seriesOrder`.

Do not add `galleryLayers`; that field belongs to the superseded two-layer design and is now forbidden.

The final production content gate requires:

- no intended public duplicates;
- dimensions for every Gallery item;
- reviewed alt text;
- reviewed credits/captions used in the viewer;
- canonical source URLs;
- stable series metadata for all public photographs;
- explicit publication status in the existing catalog/CMS.

## Preview and release flow

Implementation branch: `feature/gallery-prerelease`, created from exact `prod` SHA `415676bc993519c9e2cf3f54b779cd2f421b7946`.

PR #799 remains a draft targeting `prod`. Existing PR Preview builds the exact head SHA and deploys to the isolated Cloudflare Pages preview project. Preview stays `noindex`; production is not changed for visual review.

Merge to `prod` is outside this prerelease task and requires explicit manual visual/content approval after preview QA.

## Verification

Required before calling the corrected preview candidate ready:

- typecheck;
- Fast CI including photo-only Gallery contracts;
- CSS architecture checks;
- production-like build and metadata/local-link checks;
- direct `/gallery/` load;
- no production/art/filter controls in rendered HTML;
- every Gallery item is a canonical `photo` direction image;
- no masonry CSS/runtime mechanics;
- series do not interleave;
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
- no broad unrelated #256 migration;
- no writable Gallery spreadsheet as source of truth;
- no automatic destructive duplicate deletion.
