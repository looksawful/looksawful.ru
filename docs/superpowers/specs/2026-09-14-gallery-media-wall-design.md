# Gallery mixed-media masonry preview design

## Goal

Rebuild `/gallery/` as a dense mixed-media portfolio wall for preview, without changing `prod` until the preview is manually approved.

This supersedes the earlier photo-only / non-masonry Gallery contract for this new preview branch.

The Gallery remains a first-class SitePage and continues to use the existing site shell, navigation identity, Media Catalog, MediaEntry records, responsive media pipeline, PhotoSwipe-based viewer, Cloudflare PR Preview, and existing design tokens.

## Release boundary

Implementation branch: `feature/gallery-media-wall-preview`, created from current `prod` SHA `eb8609347fc7fc6ff1db08580bdd9c577b3bf0f9`.

The deliverable is a Cloudflare PR Preview only.

Do not merge this feature to `prod` until the user has reviewed and explicitly approved the final preview.

The Gallery primary-navigation button remains hidden. The registered Gallery label remains `галерея` for breadcrumb/CMS/future menu use.

## Public Gallery composition

The Gallery becomes one continuous mixed-media wall. It is not split into public tabs, categories, filters, project sections, or visible series groups.

### Existing musician photography kept

Keep the currently approved musician/project photography already shown by default:

- OBLADAET;
- EVASHA;
- IGGUANA;
- ESMI;
- HYPRESSION;
- OFELIA.

Re-enable OFFMi.

Keep DAVA hidden.

### STYX

Include all canonical STYX image media, including photography and design work.

For this scope, `all STYX images` means all non-archived, non-retired canonical image MediaEntry usages associated with `styx-*` projects. The Gallery does not restrict STYX to `workAreaIds: photography`.

If a STYX source image exists physically or as a registered MediaAsset but has no normal MediaEntry/context registration, register it through the existing MediaAsset + MediaEntry + Media Catalog path before it can enter Gallery.

Do not create direct Gallery-only URLs.

### Sensetique

Include all canonical Sensetique image media.

For this scope, `all Sensetique images` means all non-archived, non-retired canonical image MediaEntry usages associated with `sensetique-*` projects, including studio/equipment/design/catalogue imagery if it is a real canonical image entry.

Exclude only:

- retired canonical identities;
- exact duplicate identities already reconciled by the media system;
- technical poster-only derivatives whose only purpose is to represent a video and which are not independently authored MediaEntry content.

Near-duplicates remain visible unless there is an existing canonical retirement decision. No automatic destructive duplicate deletion is allowed.

Sensetique video is not part of this request.

### Moves Awful

Include the three existing canonical Moves Awful/Jestei landing animation entries:

- `moves-awful-jestei-landing-animation-01-use-01`;
- `moves-awful-jestei-landing-animation-02-use-01`;
- `moves-awful-jestei-landing-animation-03-use-01`.

These remain owned by the existing `moves-awful` / `jestei-landings` MediaEntry data. No Gallery-only duplicate records are introduced.

### Jestei brand/logo media

Include these five existing Jestei brand-system image entries:

1. `jestei-system-logo-source-logo-anatomy-slide-use-01`;
2. `jestei-system-logo-source-logo-color-slide-use-01`;
3. `jestei-system-logo-source-logo-type-slide-use-01`;
4. `jestei-system-logo-source-logo-system-01-use-01`;
5. `jestei-system-type-source-logo-druk-slide-use-01`.

Do not include the sixth audience/product slide (`jestei-10-source-17-101x50-use-01`) as part of this logo request.

The existing text/captions remain unchanged.

### Jestei landings video

Include the existing canonical `Лендинги Jestei Pool.` video entry:

- `jestei-13-source-13-1280x588-use-01`;
- media asset `jestei-13-source-13-1280x588`;
- existing poster asset remains the grid/loading poster.

### Jestei banners — `Новый подход к дизайну`

Include the complete existing `jesteiPromoSequence` as individual Gallery image items:

- leading: `jestei-05-source-01-701x452-use-01`;
- middle: `jestei-05-source-02-1x1-use-01` through `jestei-05-source-10-1x1-use-01`;
- trailing: `jestei-05-source-11-3x2-use-01`.

This is 11 banner entries total.

## Canonical data ownership

Gallery remains a projection over the existing media system.

Do not create:

- a second Gallery asset registry;
- a Gallery JSON file containing copied media URLs;
- a runtime filesystem scan;
- a writable Gallery spreadsheet as the source of truth;
- duplicated captions, credits, dimensions, poster URLs, or project metadata.

The Gallery projection may contain small explicit product-curation sets for exact approved selections such as the five Jestei brand entries and eleven Jestei banner entries. Those sets contain canonical MediaEntry/asset identities only; they do not duplicate media metadata.

Bulk project families such as STYX and Sensetique are selected through canonical project/context identity, not hundreds of copied asset paths.

## Gallery item model

Replace the current image-only Gallery item assumption with a discriminated mixed-media model:

- image Gallery item;
- video Gallery item.

Shared fields:

- stable item id;
- canonical MediaAsset / contextual catalog data;
- title/alt/caption/credits;
- intrinsic width/height/aspect ratio;
- project/context identity;
- optional poster identity for video.

Image-specific behavior uses responsive `srcset` from the current image delivery pipeline.

Video-specific behavior uses the canonical video source/poster/dimensions from MediaAsset and MediaEntry data.

## Masonry layout

The new Gallery intentionally restores masonry behavior.

Use the already installed `@egjs/infinitegrid` package and its `MasonryInfiniteGrid` implementation rather than adding another layout dependency or building a custom packing engine.

### Layout contract

- one continuous wall across all Gallery items;
- no per-project wrapper that interrupts packing;
- equal horizontal and vertical gap;
- no artificial fixed card height;
- every image/video keeps its own intrinsic aspect ratio;
- card width is determined by the active masonry column width;
- card height follows media ratio;
- elements may land in different visual columns than their source-order neighbors to fill the shortest available column;
- empty rectangular holes between cards are not intentionally preserved;
- do not crop media merely to normalize the grid;
- do not use CSS multi-column layout;
- do not use the old hand-built `grid-row-end` row-span masonry hack.

The DOM keeps a deterministic canonical item order for accessibility and viewer navigation. Masonry determines visual placement, not semantic ownership or metadata order.

### Responsive behavior

Use a small set of layout targets rather than hard-coded media heights. Exact values are implementation details to tune in preview, but the intended density is approximately:

- wide desktop: 5 columns;
- desktop/tablet landscape: 4 columns;
- tablet: 3 columns;
- mobile: 2 columns.

The same site page padding and Gallery gap token remain the source of spacing. No separate mobile visual system is introduced.

The masonry controller must relayout after media dimensions are available, on container-width changes, and after font/UI viewport changes that alter the available inline size. It must clean up listeners/controllers on destroy.

## Video cards in the wall

Video cards participate in masonry using their intrinsic video ratio or canonical poster ratio.

Grid behavior:

- render semantic `<video>` content, not an image pretending to be video;
- use canonical poster where available;
- muted;
- loop;
- plays inline;
- preload metadata, not full eager download for every video;
- use a shared IntersectionObserver/controller so videos play only when sufficiently visible and pause when leaving the viewport;
- respect reduced-motion by keeping autoplay off when reduced motion is requested;
- keep the card keyboard-openable like image cards.

This prevents all videos from decoding continuously off-screen while preserving motion in the visible wall.

## Lightbox / viewer

Keep the existing PhotoSwipe-based Gallery viewer as the common fullscreen experience.

### Images

Existing image behavior remains:

- full-resolution source;
- responsive `srcset` where supported by PhotoSwipe;
- title and credits caption;
- item deep-link state;
- Back/Forward integration;
- focus restoration.

### Videos

Extend the viewer adapter to support video slides.

Video fullscreen behavior:

- use the canonical video source;
- use canonical poster before playback;
- show native playback controls in the fullscreen slide;
- play inline where supported;
- do not force autoplay with sound;
- pause a video when its slide is no longer active;
- pause/destroy playback on lightbox close;
- keep title + credits caption using the same caption surface as image slides.

The viewer data source remains one continuous mixed-media sequence.

## Captions and credits

Do not invent or rewrite content.

Use canonical title/caption/credits already owned by MediaEntry/Media Catalog.

The existing readable PhotoSwipe caption surface remains.

Missing credits are a content-quality issue, not permission to infer authorship. The preview may contain items with incomplete credits; report those groups separately after the Gallery projection is materialized.

## Accessibility

Requirements:

- deterministic DOM order;
- keyboard-openable cards;
- non-empty accessible labels when canonical title exists;
- image `alt` behavior remains canonical/fallback-based;
- video cards expose a meaningful accessible label and do not trap focus;
- PhotoSwipe Escape/previous/next works across image and video slides;
- Back/Forward deep-link behavior remains intact;
- focus returns to the originating card;
- reduced-motion prevents autoplay motion in the wall;
- no horizontal overflow at supported breakpoints.

Masonry visual placement must not rewrite the semantic order into an inaccessible source-order trick.

## Performance

The expanded Gallery may be much larger than the current 91-item preview, especially after full STYX + Sensetique inclusion.

Requirements:

- use canonical responsive image derivatives rather than original images for wall thumbnails;
- lazy/deferred image decoding remains enabled;
- video preload is metadata-only in the wall;
- viewport-controlled video playback;
- do not eagerly instantiate a separate player for every video;
- use one masonry controller for the wall;
- no duplicate asset downloads caused by hidden parallel Gallery DOM;
- Cloudflare Preview packaging must remain under asset limits;
- browser QA must include a long-scroll sanity check, not just first viewport rendering.

Infinite loading / pagination is not introduced unless the measured preview demonstrates that rendering the canonical set at once creates an actual performance problem. Avoid speculative virtualization.

## Styling

Keep the Gallery visually consistent with looksawful.ru:

- no large Gallery page heading;
- existing site shell and page padding;
- no filters/tabs/pills;
- zero-radius editorial media treatment unless the global token changes;
- equal masonry gap;
- no decorative hover zoom/scale;
- no captions permanently occupying wall space unless required for a specific video accessibility affordance;
- titles/credits remain primarily in the lightbox.

## Testing strategy

TDD is required for the implementation.

### Data projection tests

Verify:

- current approved musician projects remain;
- OFFMi is restored;
- DAVA stays hidden;
- all canonical STYX image MediaEntry items are included, including non-photographic design images;
- all canonical Sensetique image MediaEntry items are included under the stated exclusions;
- Sensetique video is not included;
- the three exact Moves Awful video entries are included;
- the five exact Jestei brand/logo entries are included;
- the one exact Jestei landings video is included;
- all 11 Jestei promo/banner entries are included;
- poster-only technical assets do not become separate Gallery items;
- retired identities do not return;
- no direct Gallery-only source URLs are introduced.

### Renderer/runtime tests

Verify:

- image and video cards render different semantic media elements;
- canonical poster/source/dimensions are emitted for videos;
- no visible project/category grouping interrupts the wall;
- `MasonryInfiniteGrid` owns layout;
- old fixed CSS grid / row-span masonry mechanics are absent;
- equal gap configuration is stable;
- runtime relayout/destroy behavior is covered;
- reduced-motion suppresses video autoplay.

### Viewer tests

Verify:

- image slides still work;
- video slides open and receive canonical source/poster;
- video pauses when leaving its slide and on close;
- captions/credits work for both media types;
- item URL state, Back/Forward and focus restoration work across mixed media.

### Browser preview QA

Run exact-head Cloudflare preview QA for desktop and mobile:

- direct `/gallery/` load;
- all required content families present;
- masonry leaves no systematic grid holes;
- same gap between cards;
- mixed portrait/landscape/square/video ratios survive without crop distortion;
- long-scroll through the full wall;
- no horizontal overflow;
- visible video autoplay/pause behavior;
- reduced-motion behavior;
- open image lightbox;
- open video lightbox and playback controls;
- credits visible;
- Arrow navigation across image/video boundaries;
- Back/Forward deep links;
- Escape and focus restoration.

## Preview acceptance

The implementation is ready for user review only after:

- typecheck passes;
- Fast CI passes;
- data projection contracts pass;
- production-like build passes;
- CodeQL / Dependency Review pass;
- exact-head Cloudflare PR Preview publishes successfully;
- remote Chromium Gallery QA passes;
- a content inventory report states exact counts by source family and lists missing credits/metadata without inventing replacements.

Then provide the preview URL and immutable exact-SHA preview URL.

No production merge occurs until the user explicitly approves the preview.

## Non-goals

- no Gallery filters/search/sort;
- no new public category navigation;
- no duplicate Gallery media registry;
- no destructive source cleanup;
- no automatic near-duplicate editorial decisions;
- no full Sensetique video import;
- no DAVA re-enable;
- no sixth Jestei audience/product brand slide from the current brand-system group;
- no all-Jestei-media dump beyond the explicitly approved Jestei logo/brand, landings-video and banner selections;
- no production merge before visual approval.
