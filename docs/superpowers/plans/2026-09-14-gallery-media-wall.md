# Gallery Mixed-Media Masonry Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a preview-only `/gallery/` mixed-media masonry wall containing the approved STYX, Sensetique, musician, OFFMi, Moves Awful and Jestei media while preserving canonical media ownership, mixed image/video lightbox behavior, accessibility, performance and existing site styling.

**Architecture:** Extend the existing Gallery projection from image-only to a discriminated image/video model over the canonical `MediaEntry -> MediaAsset -> MediaCatalogItem` graph. Render one continuous semantic wall, hand it to one `MasonryInfiniteGrid` controller from the already-installed `@egjs/infinitegrid@4.13.0`, keep wall video playback in a separate observer/reduced-motion controller, and extend the existing PhotoSwipe adapter to support both image and video slides without changing History API ownership. Exact Jestei/Moves Awful selections resolve approved MediaEntry IDs to canonical asset IDs; STYX/Sensetique bulk inclusion uses project-family context, never copied paths.

**Tech Stack:** TypeScript 7, Vite 8, vanilla DOM, `@egjs/infinitegrid@4.13.0`, PhotoSwipe 5.4.4, existing responsive media pipeline, Node test runner, Playwright/Chromium, Cloudflare Pages PR Preview.

**Spec:** `docs/superpowers/specs/2026-09-14-gallery-media-wall-design.md`

## Global Constraints

- Work only on `feature/gallery-media-wall-preview`; do not merge this feature to `prod` before explicit preview approval.
- Gallery primary-navigation button remains hidden; registered label remains `галерея`.
- One continuous wall only: no tabs, filters, search, sort or visible project grouping.
- Keep OBLADAET, EVASHA, IGGUANA, ESMI, HYPRESSION and OFELIA; restore OFFMi; keep DAVA hidden.
- Include all canonical non-archived/non-retired STYX image content, including design work.
- Include all canonical non-archived/non-retired Sensetique image content except technical poster-only video derivatives; do not include Sensetique video.
- Include exactly three approved Moves Awful entries, five Jestei brand/logo entries, one Jestei landings video and eleven Jestei promo/banner entries from the spec.
- Do not introduce a second Gallery registry, copied media URLs, runtime folder scanning or destructive duplicate cleanup.
- Use the existing `MasonryInfiniteGrid`; no new layout dependency, CSS columns or `grid-row-end` masonry.
- Preserve intrinsic aspect ratios; do not crop media merely to normalize the wall.
- Use equal horizontal/vertical Gallery gap and responsive 5/4/3/2-column targets.
- Wall videos are muted, looping, inline, metadata-preloaded, viewport-controlled and do not autoplay under reduced motion.
- Mixed-media PhotoSwipe preserves title/credits, `?item=` History state, Back/Forward and focus restoration.
- Never infer missing captions, credits or alt text. Report metadata gaps separately.
- Keep existing authored text unchanged.

---

## File Map

**Modify**
- `src/data/media/gallery.ts` — mixed-media selection and projection.
- `src/site/renderers/gallery-page.ts` — one semantic image/video wall.
- `src/styles/gallery.css` — wall/card visual surface, no layout algorithm.
- `src/components/gallery/gallery-controller.ts` — compose masonry, wall-video, lightbox and history cleanup.
- `src/components/gallery/gallery-lightbox.ts` — mixed image/video PhotoSwipe data source.
- `test/gallery-prerelease.test.mjs` — content/data contracts.
- `test/gallery-renderer.test.mjs` — renderer/viewer/style contracts.
- `tools/ci/run-tests.mjs` — register new cheap Gallery tests in Fast CI.
- `tools/e2e/run-production.mjs` — browser QA for masonry and mixed media.
- `test/e2e-production-pipeline.test.mjs` — QA source contract when needed by current test structure.

**Create**
- `src/components/gallery/gallery-masonry.ts` — one `MasonryInfiniteGrid` owner.
- `src/components/gallery/gallery-video-playback.ts` — one wall-video playback owner.
- `test/gallery-masonry.test.mjs` — responsive masonry contract.
- `test/gallery-video-playback.test.mjs` — observer/reduced-motion contract.
- `docs/reports/2026-09-14-gallery-media-wall-inventory.md` — exact preview inventory and metadata gaps.

`gallery-state.ts` stays the sole History state machine unless a test demonstrates a real media-type assumption.

---

### Task 1: Project the approved canonical mixed-media set

**Files:**
- Modify: `src/data/media/gallery.ts`
- Modify: `test/gallery-prerelease.test.mjs`

**Interfaces produced:**

```ts
interface GalleryBaseItem extends CatalogItem {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface GalleryImageItem extends GalleryBaseItem {
  kind: "image";
  asset: Extract<CatalogItem["asset"], { type: "image" }>;
}

export interface GalleryVideoItem extends GalleryBaseItem {
  kind: "video";
  asset: Extract<CatalogItem["asset"], { type: "video" }>;
  posterSrc: string;
}

export type GalleryItem = GalleryImageItem | GalleryVideoItem;

export function getGalleryItemsFromMediaCatalog(
  mediaItems?: readonly MediaCatalogItem[],
): readonly GalleryItem[];
```

- [ ] **Step 1: Write failing composition tests**

In `test/gallery-prerelease.test.mjs`, require these musician projects:

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
```

Require `shootings-dava` to be absent.

Require the exact approved MediaEntry IDs from the spec by resolving them through exported `mediaEntries` to canonical `assetId` values in the test. For example:

```js
function assetIdsForEntryIds(entryIds) {
  const wanted = new Set(entryIds);
  return new Set(
    mediaEntries
      .filter((entry) => wanted.has(entry.id))
      .map((entry) => entry.assetId),
  );
}
```

Use that for:

```js
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
```

For bulk STYX/Sensetique expectations, derive expected asset IDs from `contextualMediaCatalogItems` using `projectIds.some(id => id.startsWith("styx-"))` / `sensetique-`, `asset.type === "image"`, and `!archived`.

Exclude technical poster-only assets by building:

```js
const posterAssetIds = new Set(mediaEntries.flatMap((entry) =>
  entry.posterAssetId ? [entry.posterAssetId] : []
));
const usageAssetIds = new Set(mediaEntries.map((entry) => entry.assetId));
const isTechnicalPosterOnly = (assetId) => posterAssetIds.has(assetId) && !usageAssetIds.has(assetId);
```

Require every output item to have `kind === asset.type`, positive width/height/aspect ratio, and videos to have non-empty `posterSrc`. Require no models and no Sensetique video.

- [ ] **Step 2: Run RED**

```bash
node --test test/gallery-prerelease.test.mjs
```

Expected: FAIL because current Gallery is image-only, photo-only, OFFMi-hidden and lacks approved videos/design content.

- [ ] **Step 3: Implement exact-entry-to-asset resolution in `gallery.ts`**

Import `mediaEntries` and define canonical identity helpers:

```ts
function canonicalAssetIdsForEntryIds(entryIds: ReadonlySet<string>): ReadonlySet<string> {
  return new Set(
    mediaEntries
      .filter((entry) => entryIds.has(entry.id))
      .map((entry) => entry.assetId),
  );
}

const posterAssetIds = new Set(
  mediaEntries.flatMap((entry) => entry.posterAssetId ? [entry.posterAssetId] : []),
);
const usageAssetIds = new Set(mediaEntries.map((entry) => entry.assetId));

function isTechnicalPosterOnly(assetId: string): boolean {
  return posterAssetIds.has(assetId) && !usageAssetIds.has(assetId);
}
```

Create exact entry-ID sets from the spec, resolve them once to `APPROVED_EXACT_ASSET_IDS`, and use only asset IDs after that point. Do not compare file paths or title strings.

Use this selection predicate:

```ts
function belongsToFamily(item: MediaCatalogItem, prefix: string): boolean {
  return item.projectIds.some((projectId) => projectId.startsWith(prefix));
}

function isApprovedGalleryItem(item: MediaCatalogItem): boolean {
  if (item.archived) return false;
  if (item.projectIds.includes("shootings-dava")) return false;
  if (item.asset.type === "model") return false;
  if (isTechnicalPosterOnly(item.asset.id)) return false;

  if (APPROVED_EXACT_ASSET_IDS.has(item.asset.id)) return true;

  if (item.asset.type === "image" && belongsToFamily(item, "styx-")) return true;
  if (item.asset.type === "image" && belongsToFamily(item, "sensetique-")) return true;

  if (item.asset.type === "image" && item.projectIds.some((projectId) =>
    DEFAULT_MUSICIAN_PROJECT_IDS.has(projectId)
  )) return true;

  return item.asset.type === "image"
    && item.showInCatalog
    && item.workAreaIds.includes("photography");
}
```

Map selected `MediaCatalogItem` through `toCatalogItem()`, then discriminate:

```ts
function toGalleryItem(item: CatalogItem): GalleryItem | null {
  if (!item.width || !item.height || !item.aspectRatio) return null;

  if (item.asset.type === "image") {
    return { ...item, kind: "image", asset: item.asset, width: item.width, height: item.height, aspectRatio: item.aspectRatio };
  }

  if (item.asset.type === "video" && item.posterSrc) {
    return { ...item, kind: "video", asset: item.asset, posterSrc: item.posterSrc, width: item.width, height: item.height, aspectRatio: item.aspectRatio };
  }

  return null;
}
```

- [ ] **Step 4: Run GREEN**

```bash
node --test test/gallery-prerelease.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

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

**DOM contract:** one `[data-gallery-grid]` containing `[data-gallery-card][data-gallery-kind]`; images use `<img>`, videos use semantic `<video>`.

- [ ] **Step 1: Write RED renderer tests**

Require:

```js
assert.equal((html.match(/data-gallery-grid/g) ?? []).length, 1);
assert.doesNotMatch(html, /data-gallery-series=/);
assert.match(html, /data-gallery-kind="image"/);
assert.match(html, /data-gallery-kind="video"/);
assert.match(html, /<video[^>]*data-gallery-video[^>]*muted[^>]*loop[^>]*playsinline[^>]*preload="metadata"/);
assert.match(html, /<video[^>]*poster="\/media\//);
assert.doesNotMatch(html, /<h1[^>]*>gallery<\/h1>/i);
```

Require video cards to expose `data-gallery-src`, `data-gallery-poster`, width, height, title and credits. Require Gallery CSS to contain no `grid-template-columns`, `column-count`, `grid-auto-rows` or `grid-row-end` layout ownership.

- [ ] **Step 2: Run RED**

```bash
node --test test/gallery-renderer.test.mjs
```

- [ ] **Step 3: Implement complete image/video card renderers**

Use shared attribute creation and two renderers:

```ts
function commonGalleryCardAttributes(item: GalleryItem, title: string, alt: string, credits: string): string {
  const poster = item.kind === "video"
    ? ` data-gallery-poster="${escapeHtml(item.posterSrc)}"`
    : "";
  return `class="gallery-card" data-gallery-card data-gallery-kind="${item.kind}" data-gallery-item-id="${escapeHtml(item.id)}" data-gallery-src="${escapeHtml(item.asset.src)}"${poster} data-gallery-width="${item.width}" data-gallery-height="${item.height}" data-gallery-alt="${escapeHtml(alt)}" data-gallery-title="${escapeHtml(title)}" data-gallery-credits="${escapeHtml(credits)}" tabindex="0" role="button" aria-haspopup="dialog"`;
}

function renderImageCard(item: GalleryImageItem): string {
  const srcset = responsiveImageSrcSet(item.asset);
  const srcsetAttribute = srcset ? ` srcset="${escapeHtml(srcset)}"` : "";
  const title = item.title || item.alt || "";
  const alt = item.alt.trim() || title;
  const credits = JSON.stringify([...new Set(item.credits.filter((credit) => credit.trim()))]);
  return `<figure ${commonGalleryCardAttributes(item, title, alt, credits)} aria-label="Открыть изображение"><img class="gallery-card__image" src="${escapeHtml(item.asset.src)}"${srcsetAttribute} sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, (max-width: 1500px) 25vw, 20vw" width="${item.width}" height="${item.height}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></figure>`;
}

function renderVideoCard(item: GalleryVideoItem): string {
  const title = item.title || item.alt || "";
  const alt = item.alt.trim() || title;
  const credits = JSON.stringify([...new Set(item.credits.filter((credit) => credit.trim()))]);
  return `<figure ${commonGalleryCardAttributes(item, title, alt, credits)} aria-label="Открыть видео"><video class="gallery-card__video" data-gallery-video src="${escapeHtml(item.asset.src)}" poster="${escapeHtml(item.posterSrc)}" width="${item.width}" height="${item.height}" muted loop playsinline preload="metadata" aria-label="${escapeHtml(alt)}"></video></figure>`;
}
```

Render one continuous wall:

```ts
content: `<section class="gallery" data-gallery>
  <div class="gallery__content" data-gallery-grid>
    ${items.map(renderGalleryCard).join("\n    ")}
  </div>
</section>
<script type="module" src="/src/components/gallery/gallery-entry.ts"></script>`
```

- [ ] **Step 4: Make CSS layout-neutral but measurable**

Use:

```css
.gallery__content {
  position: relative;
  min-inline-size: 0;
  column-gap: var(--gallery-gap);
  row-gap: var(--gallery-gap);
}

.gallery-card {
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

Remove fixed CSS-grid column rules and old per-series selectors.

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test test/gallery-renderer.test.mjs
npm run typecheck
git add src/site/renderers/gallery-page.ts src/styles/gallery.css test/gallery-renderer.test.mjs
git commit -m "feat(gallery): render mixed media wall"
```

---

### Task 3: Give MasonryInfiniteGrid sole layout ownership

**Files:**
- Create: `src/components/gallery/gallery-masonry.ts`
- Create: `test/gallery-masonry.test.mjs`
- Modify: `src/components/gallery/gallery-controller.ts`
- Modify: `tools/ci/run-tests.mjs`

**Interface:**

```ts
export interface GalleryMasonryController {
  relayout(): void;
  destroy(): void;
}

export function galleryColumnCount(inlineSize: number): 2 | 3 | 4 | 5;
export function createGalleryMasonry(root: HTMLElement): GalleryMasonryController;
```

- [ ] **Step 1: Write RED masonry tests**

```js
test("Gallery masonry resolves 5/4/3/2 columns", () => {
  assert.equal(galleryColumnCount(1601), 5);
  assert.equal(galleryColumnCount(1200), 4);
  assert.equal(galleryColumnCount(900), 3);
  assert.equal(galleryColumnCount(600), 2);
});
```

Source-check that the module imports `MasonryInfiniteGrid`, uses equal horizontal/vertical gap, calls `renderItems()`/`updateItems()`, observes resize, and destroys its observer/grid. Add this test to Fast CI.

- [ ] **Step 2: Run RED**

```bash
node --test test/gallery-masonry.test.mjs
```

- [ ] **Step 3: Implement the controller without mutating private library state**

```ts
import { MasonryInfiniteGrid } from "@egjs/infinitegrid";

export function galleryColumnCount(inlineSize: number): 2 | 3 | 4 | 5 {
  if (inlineSize > 1500) return 5;
  if (inlineSize > 1050) return 4;
  if (inlineSize > 720) return 3;
  return 2;
}

function measuredGap(grid: HTMLElement): number {
  const style = getComputedStyle(grid);
  const value = Number.parseFloat(style.columnGap);
  return Number.isFinite(value) ? value : 8;
}

export function createGalleryMasonry(root: HTMLElement): GalleryMasonryController {
  const grid = root.querySelector<HTMLElement>("[data-gallery-grid]");
  if (!grid) return { relayout: () => {}, destroy: () => {} };

  let columnCount = galleryColumnCount(grid.clientWidth);
  let masonry = new MasonryInfiniteGrid(grid, {
    column: columnCount,
    gap: { horizontal: measuredGap(grid), vertical: measuredGap(grid) },
    align: "justify",
    useResizeObserver: true,
    observeChildren: true,
    autoResize: true,
    preserveUIOnDestroy: false,
  });
  masonry.renderItems();

  const rebuild = (): void => {
    const nextColumns = galleryColumnCount(grid.clientWidth);
    if (nextColumns === columnCount) {
      masonry.updateItems();
      return;
    }
    masonry.destroy();
    columnCount = nextColumns;
    masonry = new MasonryInfiniteGrid(grid, {
      column: columnCount,
      gap: { horizontal: measuredGap(grid), vertical: measuredGap(grid) },
      align: "justify",
      useResizeObserver: true,
      observeChildren: true,
      autoResize: true,
      preserveUIOnDestroy: false,
    });
    masonry.renderItems();
  };

  const resizeObserver = new ResizeObserver(rebuild);
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

Compose in `gallery-controller.ts` immediately after root initialization and call `destroy()` during controller cleanup.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test test/gallery-masonry.test.mjs
npm run typecheck
git add src/components/gallery/gallery-masonry.ts src/components/gallery/gallery-controller.ts test/gallery-masonry.test.mjs tools/ci/run-tests.mjs
git commit -m "feat(gallery): add responsive masonry runtime"
```

---

### Task 4: Control wall-video playback by viewport and motion preference

**Files:**
- Create: `src/components/gallery/gallery-video-playback.ts`
- Create: `test/gallery-video-playback.test.mjs`
- Modify: `src/components/gallery/gallery-controller.ts`
- Modify: `tools/ci/run-tests.mjs`

**Interface:**

```ts
export interface GalleryVideoPlaybackController { destroy(): void }
export function galleryVideoShouldAutoplay(reducedMotion: boolean, visibleRatio: number): boolean;
export function createGalleryVideoPlayback(root: HTMLElement): GalleryVideoPlaybackController;
```

- [ ] **Step 1: Write RED policy tests**

```js
assert.equal(galleryVideoShouldAutoplay(false, 0.75), true);
assert.equal(galleryVideoShouldAutoplay(false, 0.25), false);
assert.equal(galleryVideoShouldAutoplay(true, 1), false);
```

Source-check one `IntersectionObserver`, `matchMedia("(prefers-reduced-motion: reduce)")`, pause behavior and cleanup. Add to Fast CI.

- [ ] **Step 2: Run RED**

```bash
node --test test/gallery-video-playback.test.mjs
```

- [ ] **Step 3: Implement observer/reduced-motion controller**

Use a `0.6` visible-ratio threshold. Query `video[data-gallery-video]`, force `muted`, `loop`, `playsInline`, observe every video, call `void video.play().catch(() => {})` only when policy is true, otherwise `pause()`. On media-query change to reduced motion, pause all immediately. On destroy: disconnect observer, remove the media-query listener and pause all videos.

- [ ] **Step 4: Compose controller and verify**

Instantiate `const videoPlayback = createGalleryVideoPlayback(root);` in `gallery-controller.ts`; destroy it before masonry/lightbox cleanup.

```bash
node --test test/gallery-video-playback.test.mjs
npm run typecheck
git add src/components/gallery/gallery-video-playback.ts src/components/gallery/gallery-controller.ts test/gallery-video-playback.test.mjs tools/ci/run-tests.mjs
git commit -m "feat(gallery): control wall video playback"
```

---

### Task 5: Extend PhotoSwipe to image and video slides

**Files:**
- Modify: `src/components/gallery/gallery-lightbox.ts`
- Modify: `test/gallery-renderer.test.mjs`

**Slide model:**

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

- [ ] **Step 1: Write RED mixed-viewer tests**

Require source to read `data-gallery-kind` / `data-gallery-poster`, generate `<video class="gallery-lightbox__video" controls playsinline preload="metadata">`, escape source/poster attributes, pause viewer videos on `change`, `close`, `destroy`, and retain title + credits caption generation.

- [ ] **Step 2: Run RED**

```bash
node --test test/gallery-renderer.test.mjs
```

- [ ] **Step 3: Split card-to-slide conversion**

Keep current image logic in `imageSlideFor()`. Add:

```ts
function escapeAttribute(value: string): string {
  return escapeCaption(value).replaceAll('"', "&quot;");
}

function videoSlideFor(card: HTMLElement): GalleryVideoSlide | null {
  const id = card.dataset.galleryItemId || "";
  const src = card.dataset.gallerySrc || "";
  const poster = card.dataset.galleryPoster || "";
  const width = Number.parseInt(card.dataset.galleryWidth || "", 10);
  const height = Number.parseInt(card.dataset.galleryHeight || "", 10);
  if (!id || !src || !poster || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return null;
  const title = card.dataset.galleryTitle?.trim() || "";
  return {
    galleryItemId: id,
    kind: "video",
    type: "html",
    html: `<video class="gallery-lightbox__video" controls playsinline preload="metadata" poster="${escapeAttribute(poster)}"><source src="${escapeAttribute(src)}"></video>`,
    width,
    height,
    captionHtml: captionHtml(card, title),
  };
}

function slideFor(card: HTMLElement): GallerySlide | null {
  return card.dataset.galleryKind === "video" ? videoSlideFor(card) : imageSlideFor(card);
}
```

Do not autoplay fullscreen video by default.

- [ ] **Step 4: Add viewer-video lifecycle cleanup**

```ts
function pauseViewerVideos(): void {
  document.querySelectorAll<HTMLVideoElement>(".gallery-lightbox .gallery-lightbox__video")
    .forEach((video) => video.pause());
}
```

Call it on PhotoSwipe `change` before sync, on `close`, and on `destroy`. This selector is scoped to Gallery PhotoSwipe and does not pause wall videos.

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test test/gallery-renderer.test.mjs test/gallery-prerelease.test.mjs
npm run typecheck
git add src/components/gallery/gallery-lightbox.ts test/gallery-renderer.test.mjs
git commit -m "feat(gallery): support video lightbox slides"
```

---

### Task 6: Extend browser QA and create exact inventory report

**Files:**
- Modify: `tools/e2e/run-production.mjs`
- Modify: `test/e2e-production-pipeline.test.mjs` when current test structure source-checks QA behavior.
- Create: `docs/reports/2026-09-14-gallery-media-wall-inventory.md`

- [ ] **Step 1: Add RED browser-QA source contracts**

Require Gallery QA markers for image and video cards, long scroll, horizontal overflow, reduced-motion video pause, normal visible-video playback attempt, image lightbox, video lightbox controls, mixed Arrow navigation, credits, Back/Forward and focus restoration.

```bash
node --test test/e2e-production-pipeline.test.mjs
```

Expected: FAIL until browser flow is extended.

- [ ] **Step 2: Extend Chromium Gallery QA**

At desktop and mobile widths, assert both media kinds exist, scroll to last card and back, and verify `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`.

For reduced motion:

```js
await page.emulateMedia({ reducedMotion: "reduce" });
await page.reload();
const anyPlaying = await page.locator("[data-gallery-video]").evaluateAll((videos) =>
  videos.some((video) => !video.paused)
);
assert.equal(anyPlaying, false);
```

Restore normal motion before lightbox tests. Open one image and one video by keyboard. Require `.gallery-lightbox__video[controls]` for video. Navigate across an image/video boundary, verify `?item=`, Back/Forward, Escape, credits and focus restoration.

For masonry, inspect card bounding boxes and computed `columnGap`/`rowGap`; allow <=2px rendering tolerance. Assert there is no repeated fixed row baseline and no systematic hole wider/taller than a normal gap between neighboring packed cards. Do not assert exact card coordinates.

- [ ] **Step 3: Generate exact canonical inventory**

Run a one-shot Node script importing `getGalleryItems()` and emit counts for:

- each musician project;
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

Audit repeated Gallery IDs, repeated exact `asset.src`, missing width/height, videos missing poster, items missing both title and alt, empty credits, and placeholder-only credits such as `/ 2023.` or `/ 2024.`. Do not modify authorship metadata in this task.

- [ ] **Step 4: Write report with exact IDs/counts/commands**

Create `docs/reports/2026-09-14-gallery-media-wall-inventory.md` containing branch/head, commands, exact counts, duplicate findings and missing metadata grouped by family.

- [ ] **Step 5: Verify and commit**

```bash
npm run build:site
npm run test:e2e:production
git add tools/e2e/run-production.mjs test/e2e-production-pipeline.test.mjs docs/reports/2026-09-14-gallery-media-wall-inventory.md
git commit -m "test(gallery): verify mixed media masonry preview"
```

---

### Task 7: Publish exact-head Cloudflare preview, do not merge

**Files:** no production source changes unless verification reveals a real defect.

- [ ] **Step 1: Run complete repository gate**

```bash
npm run typecheck
npm run test:fast
npm run build:site
npm run test:e2e:production
```

Also run the same repository-structure check command used by Fast CI. Do not invent a second checker.

- [ ] **Step 2: Self-review `prod...HEAD` against the spec**

Confirm: no copied Gallery media URLs; DAVA remains hidden; Sensetique video absent; sixth Jestei audience slide absent; no filters/tabs/search/sort; no CSS columns/row-span masonry; Gallery nav button remains hidden; no unrelated text rewrite; no destructive media deletion.

- [ ] **Step 3: Open draft PR**

Title: `gallery: mixed-media masonry preview`

Body must include exact inventory counts and the sentence: `Preview only. Do not merge before manual visual approval.`

- [ ] **Step 4: Require exact-head checks**

Wait for Fast CI, production build, Dependency Review, CodeQL, PR Preview exact-SHA build, isolated Cloudflare deploy and remote Chromium QA. Any queued/in-progress/failed required run means the candidate is not ready.

- [ ] **Step 5: Externally verify immutable preview**

Require `/gallery/` HTTP 200, noindex, exact card/image/video counts from the report, long-scroll completion, no horizontal overflow, consistent masonry spacing, one image lightbox, one video lightbox with controls, video paused after close, credits, deep-link `?item=`, Back/Forward and Escape/focus restoration.

- [ ] **Step 6: Hand off preview only**

Report PR number, exact verified SHA, human alias, immutable preview URL, exact inventory counts, missing metadata groups and explicitly state that `prod` is unchanged. Stop. Production merge requires a new explicit user approval after visual review.
