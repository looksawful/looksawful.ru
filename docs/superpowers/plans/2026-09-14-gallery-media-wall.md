# Gallery Mixed-Media Masonry Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a preview-only `/gallery/` mixed-media masonry wall containing the approved STYX, Sensetique, musician, OFFMi, Moves Awful and Jestei media while preserving canonical media ownership, mixed image/video lightbox behavior, accessibility, performance and existing site styling.

**Architecture:** Extend the existing Gallery projection from image-only to a discriminated image/video model over `contextualMediaCatalogItems`. Render one continuous semantic Gallery wall, hand it to one `MasonryInfiniteGrid` runtime controller from the already-installed `@egjs/infinitegrid@4.13.0`, keep video playback under a separate viewport/reduced-motion controller, and extend the existing PhotoSwipe adapter to support both image and video slides without changing History API ownership. Exact approved Jestei/Moves Awful selections use canonical identity sets; STYX/Sensetique use project-family selection rather than copied media URLs.

**Tech Stack:** TypeScript 7, Vite 8, vanilla DOM, `@egjs/infinitegrid@4.13.0`, PhotoSwipe 5.4.4, existing responsive image/video media pipeline, Node test runner, Playwright/Chromium, Cloudflare Pages PR Preview.

**Spec:** `docs/superpowers/specs/2026-09-14-gallery-media-wall-design.md`

## Global Constraints

- Work only on `feature/gallery-media-wall-preview`; do not merge this feature to `prod` before explicit preview approval.
- Gallery primary-navigation button remains hidden; registered label remains `галерея`.
- Keep one continuous public wall: no tabs, filters, search, sort or visible project grouping.
- Keep approved musician photography: OBLADAET, EVASHA, IGGUANA, ESMI, HYPRESSION, OFELIA; restore OFFMi; keep DAVA hidden.
- Include all canonical non-archived/non-retired STYX image MediaEntry content, including design work.
- Include all canonical non-archived/non-retired Sensetique image MediaEntry content except technical poster-only video derivatives; do not include Sensetique video.
- Include exactly the three canonical Moves Awful entries named in the spec.
- Include exactly the five approved Jestei brand/logo entries, the one Jestei landings video, and all eleven approved Jestei promo/banner entries.
- Do not introduce a second Gallery media registry, copied media URLs, runtime folder scanning or destructive duplicate cleanup.
- Use `MasonryInfiniteGrid` from the existing dependency; no new layout dependency and no CSS multi-column / row-span masonry hack.
- Preserve intrinsic aspect ratios; do not crop media merely to normalize the wall.
- Use equal horizontal/vertical Gallery gap and responsive 5/4/3/2-column targets.
- Video wall playback is muted, looping, inline, metadata-preloaded, viewport-controlled, and disabled for reduced motion.
- Mixed-media PhotoSwipe must preserve title/credits, History API item state, Back/Forward and focus restoration.
- Do not invent missing captions/credits/alt text. Report metadata gaps after projection is materialized.
- Keep all existing source text unchanged unless a task explicitly changes generated accessibility fallback behavior.

---

## File Structure

### Existing files to modify

- `src/data/media/gallery.ts` — canonical Gallery selection and discriminated `GalleryItem` projection.
- `src/site/renderers/gallery-page.ts` — semantic image/video card rendering into one continuous wall.
- `src/styles/gallery.css` — wall/card presentation only; remove fixed CSS-grid ownership and expose intrinsic card surfaces for InfiniteGrid.
- `src/components/gallery/gallery-controller.ts` — compose masonry/video/lightbox/history subcontrollers and cleanup.
- `src/components/gallery/gallery-lightbox.ts` — convert image/video Gallery cards into one PhotoSwipe data source and manage video slide lifecycle.
- `src/components/gallery/gallery-entry.ts` — remains thin bootstrap; only change if controller signature needs an option.
- `tools/e2e/run-production.mjs` — extend Gallery browser QA to cover mixed media/masonry/reduced motion/long scroll.
- `test/gallery-prerelease.test.mjs` — canonical composition/data-model tests.
- `test/gallery-renderer.test.mjs` — mixed semantic renderer + styling/runtime ownership contracts.

### New focused files

- `src/components/gallery/gallery-masonry.ts` — owns `MasonryInfiniteGrid`, responsive column resolution, relayout and destroy.
- `src/components/gallery/gallery-video-playback.ts` — owns wall video IntersectionObserver/reduced-motion playback and cleanup.
- `test/gallery-masonry.test.mjs` — cheap source/behavior contracts for responsive masonry config and cleanup surface.
- `test/gallery-video-playback.test.mjs` — reduced-motion/observer playback contracts.
- `docs/reports/2026-09-14-gallery-media-wall-inventory.md` — generated/verified release inventory containing exact counts and missing metadata groups after implementation.

The existing `gallery-state.ts` remains the sole History state machine and should not be structurally changed unless a mixed-media test exposes a real media-type assumption.

---

### Task 1: Expand the Gallery projection to canonical mixed media

**Files:**
- Modify: `src/data/media/gallery.ts`
- Modify: `test/gallery-prerelease.test.mjs`

**Interfaces:**
- Consumes: `contextualMediaCatalogItems: readonly MediaCatalogItem[]`, `toCatalogItem(item): CatalogItem`.
- Produces:
  - `export type GalleryItem = GalleryImageItem | GalleryVideoItem`
  - `export interface GalleryImageItem extends GalleryBaseItem { kind: "image"; asset: Extract<CatalogItem["asset"], { type: "image" }> }`
  - `export interface GalleryVideoItem extends GalleryBaseItem { kind: "video"; asset: Extract<CatalogItem["asset"], { type: "video" }>; posterSrc: string }`
  - `export function getGalleryItemsFromMediaCatalog(mediaItems?: readonly MediaCatalogItem[]): readonly GalleryItem[]`
  - `export function getGalleryItems(): readonly GalleryItem[]`

- [ ] **Step 1: Replace the old photo-only assertions with failing composition contracts**

Add explicit constants and assertions to `test/gallery-prerelease.test.mjs`:

```js
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

const requiredMovesAwfulEntryIds = [
  "moves-awful-jestei-landing-animation-01-use-01",
  "moves-awful-jestei-landing-animation-02-use-01",
  "moves-awful-jestei-landing-animation-03-use-01",
];

const requiredJesteiBrandEntryIds = [
  "jestei-system-logo-source-logo-anatomy-slide-use-01",
  "jestei-system-logo-source-logo-color-slide-use-01",
  "jestei-system-logo-source-logo-type-slide-use-01",
  "jestei-system-logo-source-logo-system-01-use-01",
  "jestei-system-type-source-logo-druk-slide-use-01",
];

const requiredJesteiBannerEntryIds = [
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
```

Add tests that derive expected STYX/Sensetique canonical **usage-backed** assets from `contextualMediaCatalogItems`, then require every expected image to appear exactly once in `getGalleryItems()` while requiring Sensetique videos to be absent. Require the exact three Moves Awful videos, the five Jestei brand images, `jestei-13-source-13-1280x588-use-01`, and all eleven Jestei promo entries. Require `item.kind` to agree with `item.asset.type` and require intrinsic dimensions for both kinds.

The test must compare canonical IDs rather than paths. For bulk families, compute expected IDs by `projectIds.some(id => id.startsWith("styx-"))` and `projectIds.some(id => id.startsWith("sensetique-"))`, then filter `asset.type === "image" && !archived`.

- [ ] **Step 2: Run the focused data test and confirm RED**

Run:

```bash
node --test test/gallery-prerelease.test.mjs
```

Expected: FAIL because the current projection rejects videos, OFFMi and non-photographic STYX/Sensetique images.

- [ ] **Step 3: Implement explicit selection predicates without copied URLs**

Refactor `src/data/media/gallery.ts` around identity predicates:

```ts
const DEFAULT_MUSICIAN_PROJECT_IDS = new Set([
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-behance-offmi",
]);

const HIDDEN_PROJECT_IDS = new Set(["shootings-dava"]);

const MOVES_AWFUL_ENTRY_IDS = new Set([
  "moves-awful-jestei-landing-animation-01-use-01",
  "moves-awful-jestei-landing-animation-02-use-01",
  "moves-awful-jestei-landing-animation-03-use-01",
]);

const JESTEI_BRAND_ENTRY_IDS = new Set([
  "jestei-system-logo-source-logo-anatomy-slide-use-01",
  "jestei-system-logo-source-logo-color-slide-use-01",
  "jestei-system-logo-source-logo-type-slide-use-01",
  "jestei-system-logo-source-logo-system-01-use-01",
  "jestei-system-type-source-logo-druk-slide-use-01",
]);

const JESTEI_BANNER_ENTRY_IDS = new Set([
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
]);

const JESTEI_LANDINGS_VIDEO_ENTRY_ID = "jestei-13-source-13-1280x588-use-01";
```

Use `MediaCatalogItem.id` / contextual entry identity if the type exposes it; if contextual items expose only asset identity, derive the exact approved entry selections before `toCatalogItem()` from the existing MediaEntry join rather than falling back to path matching. Preserve one canonical public item per contextual usage/identity and dedupe only already-canonicalized duplicate identities.

Implement:

```ts
function belongsToFamily(item: MediaCatalogItem, prefix: string): boolean {
  return item.projectIds.some((projectId) => projectId.startsWith(prefix));
}

function isApprovedGalleryItem(item: MediaCatalogItem): boolean {
  if (item.archived) return false;
  if (item.projectIds.some((id) => HIDDEN_PROJECT_IDS.has(id))) return false;

  if (item.asset.type === "image") {
    if (belongsToFamily(item, "styx-")) return true;
    if (belongsToFamily(item, "sensetique-")) return true;
    if (item.projectIds.some((id) => DEFAULT_MUSICIAN_PROJECT_IDS.has(id))) return true;
    if (isApprovedJesteiEntry(item)) return true;
    return item.showInCatalog && item.workAreaIds.includes("photography");
  }

  if (item.asset.type === "video") {
    return isApprovedMovesAwfulEntry(item) || isApprovedJesteiLandingsVideo(item);
  }

  return false;
}
```

Do not include model assets. For video output, require `posterSrc` and width/height before it becomes a `GalleryVideoItem`; if an approved video lacks these, let the focused test fail and repair canonical metadata rather than inventing Gallery metadata.

- [ ] **Step 4: Run focused data tests and confirm GREEN**

Run:

```bash
node --test test/gallery-prerelease.test.mjs
```

Expected: PASS with exact mixed-media composition contracts.

- [ ] **Step 5: Commit the projection**

```bash
git add src/data/media/gallery.ts test/gallery-prerelease.test.mjs
git commit -m "feat(gallery): project approved mixed media"
```

---

### Task 2: Render one semantic mixed-media wall

**Files:**
- Modify: `src/site/renderers/gallery-page.ts`
- Modify: `src/styles/gallery.css`
- Modify: `test/gallery-renderer.test.mjs`

**Interfaces:**
- Consumes: `GalleryItem` union from Task 1.
- Produces DOM contract:
  - root `[data-gallery]`
  - one wall `[data-gallery-grid]`
  - card `[data-gallery-card][data-gallery-kind="image|video"]`
  - common identity/metadata data attributes
  - image cards contain `<img>`
  - video cards contain `<video muted loop playsinline preload="metadata" poster="...">`

- [ ] **Step 1: Write failing renderer tests for one wall and semantic video cards**

Replace the old invisible-series assertion with:

```js
assert.equal((html.match(/data-gallery-grid/g) ?? []).length, 1);
assert.doesNotMatch(html, /data-gallery-series=/);
assert.match(html, /data-gallery-kind="image"/);
assert.match(html, /data-gallery-kind="video"/);
assert.match(html, /<video[^>]*muted[^>]*loop[^>]*playsinline[^>]*preload="metadata"/);
assert.match(html, /<video[^>]*poster="\/media\//);
```

Require every video card to expose `data-gallery-src`, `data-gallery-poster`, width/height, title and credits. Require the page to keep no page-level `<h1>`.

Update CSS source assertions so `.gallery__content` is not the layout engine and the old `grid-template-columns: repeat(...)` rules are absent.

- [ ] **Step 2: Run renderer test and confirm RED**

```bash
node --test test/gallery-renderer.test.mjs
```

Expected: FAIL because the renderer still groups images by series and cannot render videos.

- [ ] **Step 3: Implement focused image/video card renderers**

In `gallery-page.ts`, replace `groupBySeries()` and `renderGallerySeries()` with one wall:

```ts
function renderImageCard(item: GalleryImageItem): string { /* canonical attrs + img */ }
function renderVideoCard(item: GalleryVideoItem): string { /* canonical attrs + video */ }
function renderGalleryCard(item: GalleryItem): string {
  return item.kind === "video" ? renderVideoCard(item) : renderImageCard(item);
}
```

Common card attributes must include:

```html
data-gallery-card
data-gallery-kind="image|video"
data-gallery-item-id="..."
data-gallery-src="..."
data-gallery-width="..."
data-gallery-height="..."
data-gallery-title="..."
data-gallery-credits="[...]"
tabindex="0"
role="button"
aria-haspopup="dialog"
```

Video adds `data-gallery-poster`. Use `aria-label="Открыть видео"` for video and existing image label for images. Render:

```html
<div class="gallery__content" data-gallery-grid>
  ...cards...
</div>
```

Keep `responsiveImageSrcSet()` only for image cards.

- [ ] **Step 4: Change CSS from fixed grid to runtime-owned wall surface**

Use:

```css
.gallery__content {
  position: relative;
  min-inline-size: 0;
}

.gallery-card {
  position: absolute;
  display: block;
  min-inline-size: 0;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-editorial);
  background: var(--clr-surface-raised);
  cursor: zoom-in;
}

.gallery-card__image,
.gallery-card__video {
  display: block;
  inline-size: 100%;
  block-size: auto;
  border-radius: inherit;
}
```

Do not encode column count in CSS; Task 3 owns it. Preserve page padding/gap token and no decorative hover transform.

- [ ] **Step 5: Run renderer tests and confirm GREEN**

```bash
node --test test/gallery-renderer.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit semantic mixed-media rendering**

```bash
git add src/site/renderers/gallery-page.ts src/styles/gallery.css test/gallery-renderer.test.mjs
git commit -m "feat(gallery): render mixed media wall"
```

---

### Task 3: Add the MasonryInfiniteGrid controller

**Files:**
- Create: `src/components/gallery/gallery-masonry.ts`
- Create: `test/gallery-masonry.test.mjs`
- Modify: `src/components/gallery/gallery-controller.ts`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces:

```ts
export interface GalleryMasonryOptions {
  root: HTMLElement;
  gap: number;
}

export interface GalleryMasonryController {
  relayout: () => void;
  destroy: () => void;
}

export function galleryColumnCount(inlineSize: number): 2 | 3 | 4 | 5;
export function createGalleryMasonry(options: GalleryMasonryOptions): GalleryMasonryController;
```

- [ ] **Step 1: Add failing pure column-count and source ownership tests**

Create `test/gallery-masonry.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { galleryColumnCount } from "../src/components/gallery/gallery-masonry.ts";

test("Gallery masonry resolves 5/4/3/2 responsive columns", () => {
  assert.equal(galleryColumnCount(1600), 5);
  assert.equal(galleryColumnCount(1200), 4);
  assert.equal(galleryColumnCount(900), 3);
  assert.equal(galleryColumnCount(600), 2);
});
```

Also source-check `gallery-masonry.ts` for `MasonryInfiniteGrid`, `gap`, `column`, `renderItems`, `updateItems`, `destroy`, and source-check Gallery CSS to ensure no CSS multi-column or row-span masonry returns.

Add this test to `fastTests` in `tools/ci/run-tests.mjs` because it is cheap and protects a long-lived layout contract.

- [ ] **Step 2: Run the new test and confirm RED**

```bash
node --test test/gallery-masonry.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement responsive MasonryInfiniteGrid ownership**

Create `gallery-masonry.ts` using the installed API:

```ts
import { MasonryInfiniteGrid } from "@egjs/infinitegrid";

export function galleryColumnCount(inlineSize: number): 2 | 3 | 4 | 5 {
  if (inlineSize > 1500) return 5;
  if (inlineSize > 1050) return 4;
  if (inlineSize > 720) return 3;
  return 2;
}

export function createGalleryMasonry({ root, gap }: GalleryMasonryOptions): GalleryMasonryController {
  const grid = root.querySelector<HTMLElement>("[data-gallery-grid]");
  if (!grid) return { relayout: () => {}, destroy: () => {} };

  const masonry = new MasonryInfiniteGrid(grid, {
    gap: { horizontal: gap, vertical: gap },
    column: galleryColumnCount(grid.clientWidth),
    align: "stretch",
    useResizeObserver: true,
    observeChildren: true,
    autoResize: true,
    preserveUIOnDestroy: false,
  });

  masonry.renderItems();

  const resizeObserver = new ResizeObserver(() => {
    masonry.column = galleryColumnCount(grid.clientWidth);
    masonry.updateItems();
  });
  resizeObserver.observe(grid);

  return {
    relayout: () => masonry.updateItems(),
    destroy: () => {
      resizeObserver.disconnect();
      masonry.destroy();
    },
  };
}
```

If TypeScript shows `column` is not writable on the InfiniteGrid class, rebuild the instance only when `galleryColumnCount()` changes rather than forcing the type. Do not cast to `any`.

Read the equal gap from the computed Gallery CSS custom property in `gallery-controller.ts`:

```ts
const gap = Number.parseFloat(getComputedStyle(root).getPropertyValue("--gallery-gap")) || 8;
const masonry = createGalleryMasonry({ root, gap });
```

Call `masonry.destroy()` during Gallery controller cleanup.

- [ ] **Step 4: Run focused tests and typecheck**

```bash
node --test test/gallery-masonry.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit masonry runtime**

```bash
git add src/components/gallery/gallery-masonry.ts src/components/gallery/gallery-controller.ts test/gallery-masonry.test.mjs tools/ci/run-tests.mjs
git commit -m "feat(gallery): add responsive masonry runtime"
```

---

### Task 4: Add viewport-controlled wall video playback

**Files:**
- Create: `src/components/gallery/gallery-video-playback.ts`
- Create: `test/gallery-video-playback.test.mjs`
- Modify: `src/components/gallery/gallery-controller.ts`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces:

```ts
export interface GalleryVideoPlaybackController {
  destroy: () => void;
}

export function galleryVideoShouldAutoplay(reducedMotion: boolean, visibleRatio: number): boolean;
export function createGalleryVideoPlayback(root: HTMLElement): GalleryVideoPlaybackController;
```

- [ ] **Step 1: Write RED tests for motion and visibility policy**

```js
assert.equal(galleryVideoShouldAutoplay(false, 0.75), true);
assert.equal(galleryVideoShouldAutoplay(false, 0.25), false);
assert.equal(galleryVideoShouldAutoplay(true, 1), false);
```

Source-check that the implementation uses one `IntersectionObserver`, watches `matchMedia("(prefers-reduced-motion: reduce)")`, pauses on non-visible entries, and disconnects/removes listeners on destroy.

Add the test to the Fast set.

- [ ] **Step 2: Run the test and confirm RED**

```bash
node --test test/gallery-video-playback.test.mjs
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement one observer for all wall videos**

```ts
export function galleryVideoShouldAutoplay(reducedMotion: boolean, visibleRatio: number): boolean {
  return !reducedMotion && visibleRatio >= 0.6;
}
```

`createGalleryVideoPlayback()` must:

1. query `video[data-gallery-video]`;
2. force `muted = true`, `loop = true`, `playsInline = true`;
3. create one IntersectionObserver with thresholds `[0, 0.6, 1]`;
4. call `void video.play().catch(() => {})` only when policy returns true;
5. otherwise `video.pause()`;
6. on reduced-motion preference change, pause all videos immediately when enabled;
7. on destroy, disconnect observer, remove media-query listener and pause all videos.

- [ ] **Step 4: Compose video playback in Gallery controller**

Instantiate after masonry:

```ts
const videoPlayback = createGalleryVideoPlayback(root);
```

Destroy before masonry/lightbox cleanup so videos stop before DOM layout is released.

- [ ] **Step 5: Run focused tests + typecheck**

```bash
node --test test/gallery-video-playback.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit video wall playback**

```bash
git add src/components/gallery/gallery-video-playback.ts src/components/gallery/gallery-controller.ts test/gallery-video-playback.test.mjs tools/ci/run-tests.mjs
git commit -m "feat(gallery): control wall video playback"
```

---

### Task 5: Extend the PhotoSwipe adapter to mixed image/video slides

**Files:**
- Modify: `src/components/gallery/gallery-lightbox.ts`
- Modify: `test/gallery-renderer.test.mjs`

**Interfaces:**
- `GallerySlide` becomes discriminated:

```ts
type GalleryImageSlide = SlideData & {
  galleryItemId: string;
  kind: "image";
  captionHtml: string;
};

type GalleryVideoSlide = SlideData & {
  galleryItemId: string;
  kind: "video";
  html: string;
  captionHtml: string;
};

type GallerySlide = GalleryImageSlide | GalleryVideoSlide;
```

- [ ] **Step 1: Write failing source/runtime contracts for video slide support**

Extend `test/gallery-renderer.test.mjs` to require:

- `gallery-lightbox.ts` reads `data-gallery-kind` and `data-gallery-poster`;
- video slide HTML contains `<video controls playsinline preload="metadata"`;
- video source is escaped before insertion;
- a pause helper is called from PhotoSwipe `change`, `close` and `destroy` lifecycle paths;
- captions still combine title + canonical credits for both kinds.

- [ ] **Step 2: Run renderer/lightbox tests and confirm RED**

```bash
node --test test/gallery-renderer.test.mjs
```

Expected: FAIL because `slideFor()` assumes an `<img>`.

- [ ] **Step 3: Split card parsing by kind**

Implement:

```ts
function imageSlideFor(card: HTMLElement): GalleryImageSlide | null { /* current image path */ }
function videoSlideFor(card: HTMLElement): GalleryVideoSlide | null { /* canonical video path */ }
function slideFor(card: HTMLElement): GallerySlide | null {
  return card.dataset.galleryKind === "video"
    ? videoSlideFor(card)
    : imageSlideFor(card);
}
```

Video HTML must be generated from escaped dataset values:

```ts
const html = `<video class="gallery-lightbox__video" controls playsinline preload="metadata" poster="${escapeAttribute(poster)}"><source src="${escapeAttribute(src)}"></video>`;
```

Do not autoplay video in the fullscreen viewer by default. Native controls own user playback.

- [ ] **Step 4: Pause non-active/fullscreen videos on lifecycle transitions**

Implement a scoped helper:

```ts
function pauseViewerVideos(root: ParentNode): void {
  root.querySelectorAll<HTMLVideoElement>(".gallery-lightbox__video").forEach((video) => video.pause());
}
```

On PhotoSwipe `change`, pause all viewer videos before syncing caption/item state. On `close` and `destroy`, pause all viewer videos. Do not touch wall videos outside the PhotoSwipe root.

- [ ] **Step 5: Run focused tests + typecheck**

```bash
node --test test/gallery-renderer.test.mjs test/gallery-prerelease.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit mixed-media viewer**

```bash
git add src/components/gallery/gallery-lightbox.ts test/gallery-renderer.test.mjs
git commit -m "feat(gallery): support video lightbox slides"
```

---

### Task 6: Add browser QA for masonry and mixed media

**Files:**
- Modify: `tools/e2e/run-production.mjs`
- Modify: `test/e2e-production-pipeline.test.mjs` if the workflow contract asserts existing QA steps.

**Interfaces:**
- Consumes current `runProductionE2E` Gallery flow.
- Produces deterministic browser assertions for mixed media and masonry on local/Cloudflare preview targets.

- [ ] **Step 1: Add failing source-contract assertions for new browser coverage**

If `test/e2e-production-pipeline.test.mjs` inspects production QA, add strings/functions requiring the Gallery flow to inspect:

- both `[data-gallery-kind="image"]` and `[data-gallery-kind="video"]`;
- long-scroll to the bottom and back;
- horizontal overflow at desktop and mobile widths;
- masonry gap variance;
- reduced-motion video paused state;
- normal-motion visible video playback attempt/state;
- image lightbox;
- video lightbox with `controls`;
- Arrow navigation across a media-kind boundary;
- credits surface;
- Back/Forward deep-link state;
- Escape/focus restoration.

- [ ] **Step 2: Run the focused contract test and confirm RED**

```bash
node --test test/e2e-production-pipeline.test.mjs
```

Expected: FAIL on missing mixed-media Gallery QA markers.

- [ ] **Step 3: Extend the Gallery browser QA flow**

In `tools/e2e/run-production.mjs`, add assertions using actual DOM geometry. For equal gaps, collect visible masonry cards sorted by their rendered column/row positions and assert that horizontal/vertical gap values cluster within a small pixel tolerance (for example `<= 2px`) around the computed `--gallery-gap`, rather than expecting a mathematically identical float.

Check density by asserting no systematic empty rectangular holes larger than one normal card-width/gap region within the masonry container. Do not assert exact card coordinates because viewport fonts/media decode timing can vary.

For reduced motion:

```js
await page.emulateMedia({ reducedMotion: "reduce" });
await page.reload();
const playing = await page.locator("[data-gallery-kind=video] video").evaluateAll((videos) =>
  videos.some((video) => !video.paused)
);
assert.equal(playing, false);
```

Restore normal motion before subsequent tests.

For video lightbox, find a video card, activate it via keyboard, assert `.gallery-lightbox__video[controls]`, then close and verify wall focus returns to the originating card.

- [ ] **Step 4: Run browser QA against a local production-like build in CI-compatible mode**

Run:

```bash
npm run build:site
npm run test:e2e:production
```

Expected: PASS.

- [ ] **Step 5: Commit browser QA**

```bash
git add tools/e2e/run-production.mjs test/e2e-production-pipeline.test.mjs
git commit -m "test(gallery): cover mixed media masonry in browser qa"
```

---

### Task 7: Produce the exact content inventory and metadata-gap report

**Files:**
- Create: `docs/reports/2026-09-14-gallery-media-wall-inventory.md`
- Modify tests only if inventory exposes a canonical-registration defect that blocks the approved content.

**Interfaces:**
- Consumes `getGalleryItems()` after Tasks 1–5.
- Produces a committed factual report, not runtime data.

- [ ] **Step 1: Generate exact counts from the canonical projection**

Use a one-shot Node invocation importing `getGalleryItems()` and output counts by these source families:

- musician photography total and per project;
- OFFMi;
- STYX images;
- Sensetique images;
- Moves Awful videos;
- Jestei brand images;
- Jestei landings video;
- Jestei banners;
- total images;
- total videos;
- total Gallery items.

Do not count poster assets as separate Gallery items.

- [ ] **Step 2: Audit exact duplicates and metadata gaps in the projected set**

Report:

- repeated canonical item IDs (must be zero);
- repeated exact asset `src` values and whether they are already canonical aliases;
- items missing intrinsic width/height (must be zero for release candidate);
- image items whose canonical alt and title are both empty;
- video items missing poster;
- items with empty credits;
- suspicious placeholder credits such as `/ 2023.` or `/ 2024.` without an author/role.

Do not modify metadata in this task unless missing dimensions/poster make the approved item technically unusable. Human/editorial credit corrections remain a report.

- [ ] **Step 3: Write the report with IDs grouped by family**

The report must include the exact branch/head used for the audit and the exact commands used to generate it. No estimates such as “about 200”.

- [ ] **Step 4: Commit inventory**

```bash
git add docs/reports/2026-09-14-gallery-media-wall-inventory.md
git commit -m "docs(gallery): record mixed media inventory"
```

---

### Task 8: Run full exact-head verification and publish preview only

**Files:**
- No production source changes unless verification finds a real defect.
- Create/update PR metadata for `feature/gallery-media-wall-preview` -> `prod`.

**Interfaces:**
- Produces an exact-head Cloudflare Preview and immutable deployment URL for manual review.

- [ ] **Step 1: Run the complete local/repository gate**

```bash
npm run typecheck
npm run test:fast
node tools/check-repository-structure.mjs
npm run build:site
npm run test:e2e:production
```

Expected: all PASS. If repository structure uses a different direct script path in current `prod`, use the same command invoked by Fast CI rather than creating another checker.

- [ ] **Step 2: Self-review the diff against the spec**

Verify manually from `git diff prod...HEAD`:

- no new media URLs hard-coded into Gallery selection;
- no DAVA enablement;
- no Sensetique video enablement;
- no sixth Jestei audience/product slide;
- no filters/tabs/search/sort;
- no CSS columns/row-span masonry;
- no production-navigation Gallery button enablement;
- no source-text rewrites unrelated to Gallery;
- no destructive media deletion.

- [ ] **Step 3: Open a draft PR to `prod`**

Use title:

```text
gallery: mixed-media masonry preview
```

PR body must summarize exact inventory counts from Task 7 and state explicitly: `Preview only. Do not merge before manual visual approval.`

- [ ] **Step 4: Wait for exact-head checks**

Require:

- Fast CI success;
- production build success;
- Dependency Review success;
- CodeQL success;
- PR Preview exact-SHA build success;
- isolated Cloudflare deploy success;
- remote Chromium QA success.

Do not claim readiness while any required run is queued/in-progress/failed.

- [ ] **Step 5: Verify preview from the outside**

On the immutable exact-SHA preview URL, verify:

- `/gallery/` returns 200;
- response is noindex;
- page contains the exact expected total Gallery card count from Task 7;
- image/video counts match report;
- long scroll reaches final card;
- no horizontal overflow desktop/mobile;
- visible masonry spacing is consistent;
- opening at least one image and one video works;
- video slide has controls and pauses after close;
- credits render;
- deep-link `?item=` works;
- Back/Forward works.

- [ ] **Step 6: Hand off preview without merging**

Report:

- PR number;
- exact verified head SHA;
- human preview alias;
- immutable preview URL;
- exact inventory counts;
- missing credits/metadata groups from Task 7;
- statement that `prod` is unchanged.

Stop there. Production merge requires a new explicit user approval after visual review.
