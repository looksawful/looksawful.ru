# Portfolio Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio faster, easier to maintain, more readable across devices, and visually consistent while preserving the existing visual logic, proximity behavior, media assets, and content meaning.

**Architecture:** Work in small commits that can be reverted independently with `git revert <commit>`. Keep production behavior in scoped modules: global boot and lazy-loading in `src/main.js`, shared showcase media behavior in `src/visuals/dom/portfolio-gallery.js`, showcase/video components in `src/components/*`, and visual styling inside existing `src/styles/modules/*` files or new narrow modules only when the current file would become less readable. Do not replace the current design system with Material or Carbon; use their stable principles only: predictable breakpoints, tokenized spacing, controlled elevation, and consistent container constraints.

**Tech Stack:** Vite, vanilla JavaScript modules, CSS modules imported through `src/styles/index.css`, GSAP, Three.js/WebGL canvas visuals, static HTML pages.

---

## Constraints

- Do not push.
- Do not optimize photo/video quality or recompress media.
- Preserve asset paths and media counts unless a task explicitly says it is creating a new page.
- Preserve desktop and mobile proximity behavior.
- Preserve the site header, menus, existing hero composition, resume section, policy book, artifact reader, and playlist filter internals unless a task explicitly targets their outer presentation.
- Do not use `!important` for new rules.
- Keep text insertion as the last content stage.
- Every implementation stage ends with `npm run build` and a focused browser check.

## External Design References Used

- Material Design 3 layout and elevation principles: adaptive window classes and limited elevation levels.
- Carbon Design System: 2x grid geometry, 8px mini-unit rhythm, spacing tokens, and parent-owned stacking/gaps.
- Minimal text resume direction: compact one-screen text layout, high scanability, restrained type scale.

## Current Known State

- Completed Stage 0 commit: `51a58ec perf: improve showcase media loading`.
- Remaining uncommitted files before this plan: `index.html`, `pets/awful-cases/index.html`, `src/components/hero-title/hero-title.js`, `src/styles/modules/hero.css`, `src/styles/modules/portfolio-gallery.css`, `src/styles/modules/portfolio-lists.css`, `src/styles/modules/portfolio-reading.css`, `src/styles/modules/portfolio-system.css`.
- Existing smell to remove gradually: `src/styles/modules/portfolio-final-regression-repair.css` is a repair layer and must not grow.
- Known runtime issue to verify and fix: diagonal showcase canvas can fail with `Cannot read properties of undefined (reading 'modules')`.

## File Map

- `index.html`: structural source for showcase, hero role text, pet cards, and case content.
- `resume/index.html`: future minimal text resume page.
- `pets/*/index.html`: standalone pet project pages.
- `src/main.js`: module boot, lazy imports, and route-wide initialization.
- `src/components/index.js`: component initialization boundary.
- `src/components/lightbox.js`: global image/video lightbox behavior.
- `src/components/showcase-inline-video/showcase-inline-video.js`: inline video controls and lazy playback.
- `src/components/showcase-visuals/showcase-visuals.js`: canvas/Three.js viewport scheduling.
- `src/visuals/canvas/showcase-animation-assets.js`: shared scene asset registry.
- `src/visuals/canvas/showcase-diagonal/index.js`: diagonal canvas scene.
- `src/visuals/dom/portfolio-gallery.js`: gallery view switching, lightbox registration, media warmup.
- `src/styles/index.css`: CSS module import order only.
- `src/styles/modules/hero.css`: narrow mobile overlap fix only if needed.
- `src/styles/modules/portfolio-gallery.css`: gallery, media group, video shell layout.
- `src/styles/modules/portfolio-reading.css`: readable long-form showcase typography.
- `src/styles/modules/portfolio-lists.css`: responsibilities, facts, thesis lists.
- `src/styles/modules/portfolio-system.css`: showcase-level shell tokens and section rhythm.
- `src/styles/modules/pets/*.css`: pet page/card modules isolated from the main showcase.

---

### Task 1: Audit Guardrails And Regression Script

**Files:**
- Create: `scripts/portfolio-regression-check.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add a browser regression script**

Create `scripts/portfolio-regression-check.mjs` with checks for console errors, horizontal overflow, media request failures, image/video/canvas counts, and key routes:

```js
import { chromium } from "playwright";

const baseUrl = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:4173";
const routes = ["/", "/resume/", "/pets/berserk-timer/", "/pets/awful-cases/", "/pets/awful-describer/"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const failures = [];
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const failedRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.trim());
    });

    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => ({
      status: document.readyState,
      docWidth: document.documentElement.scrollWidth,
      winWidth: window.innerWidth,
      bodyWidth: document.body.scrollWidth,
      imageCount: document.images.length,
      failedImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      videoCount: document.querySelectorAll("video").length,
      canvasCount: document.querySelectorAll("canvas").length,
    }));

    if (!response || !response.ok()) failures.push(`${viewport.name} ${route}: HTTP ${response?.status() ?? "missing"}`);
    if (metrics.docWidth > metrics.winWidth + 2 || metrics.bodyWidth > metrics.winWidth + 2) {
      failures.push(`${viewport.name} ${route}: horizontal overflow doc=${metrics.docWidth} body=${metrics.bodyWidth} win=${metrics.winWidth}`);
    }
    for (const src of metrics.failedImages) failures.push(`${viewport.name} ${route}: broken image ${src}`);
    for (const item of failedRequests.filter((entry) => !entry.includes("net::ERR_ABORTED"))) {
      failures.push(`${viewport.name} ${route}: request failed ${item}`);
    }
    for (const item of consoleErrors.filter((entry) => !entry.includes("WebGL") && !entry.includes("THREE.WebGLRenderer"))) {
      failures.push(`${viewport.name} ${route}: console error ${item}`);
    }

    console.log(JSON.stringify({ viewport: viewport.name, route, metrics }, null, 2));
    await page.close();
  }
}

await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
```

- [ ] **Step 2: Add npm script**

Add the script without removing existing scripts:

```json
"check:portfolio": "node scripts/portfolio-regression-check.mjs"
```

- [ ] **Step 3: Verify the script catches current issues**

Run with preview already started:

```bash
npm run check:portfolio
```

Expected before fixes: it may fail on the known diagonal canvas console issue or other real current defects.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/portfolio-regression-check.mjs docs/superpowers/plans/2026-06-28-portfolio-optimization.md
git commit -m "chore: add portfolio optimization plan and checks"
```

### Task 2: Canvas Reliability And Adaptive Mounting

**Files:**
- Modify: `src/visuals/canvas/showcase-diagonal/index.js`
- Modify: `src/visuals/canvas/showcase-animation-assets.js`
- Modify: `src/components/showcase-visuals/showcase-visuals.js`

- [ ] **Step 1: Reproduce the diagonal scene failure**

Run:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run check:portfolio
```

Expected: no app console errors. If the diagonal scene error appears, keep it as the failing regression.

- [ ] **Step 2: Fix scene fallback without changing the canvas design**

Use the existing asset helper pattern. In `src/visuals/canvas/showcase-diagonal/index.js`, resolve the scene through the exported fallback helper or guard the modules object before creating items:

```js
const scene = ANIMATION_SCENES[sceneId] ?? ANIMATION_SCENES[DEFAULT_DIAGONAL_SCENE] ?? Object.values(ANIMATION_SCENES)[0];
const items = limitAnimationItems(createAnimationItems(scene?.modules || {}), sceneId, { defaultMaxItems: scene?.defaultMaxItems || 24 });
```

If the real problem is the glob pattern, correct the glob so nested files under `assets/styx-graphic-diagonal/` are included, not only files whose path starts with `styx-graphic-diagonal`.

- [ ] **Step 3: Re-run verification**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: no diagonal scene console error, no horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add src/visuals/canvas/showcase-diagonal/index.js src/visuals/canvas/showcase-animation-assets.js src/components/showcase-visuals/showcase-visuals.js
git commit -m "fix: harden showcase canvas scenes"
```

### Task 3: Hero Mobile Collision Fix

**Files:**
- Modify: `src/styles/modules/hero.css`
- Modify: `src/components/hero-title/hero-title.js` only if the role animation boundary regressed

- [ ] **Step 1: Verify the mobile overlap**

Use the regression script and a mobile screenshot. The failure condition is visual: menu buttons touch or cover the awfulface/logo or hero content sits too high on 390px wide screens.

- [ ] **Step 2: Adjust only mobile hero spacing**

Keep the existing hero structure. Use a mobile-only block in `hero.css` that increases the top clearance and keeps the role line smaller than the name:

```css
@media (max-width: 720px) {
  .hero {
    --hero-mobile-top-clearance: clamp(4.5rem, 18svh, 7rem);
  }

  .hero__content {
    padding-top: var(--hero-mobile-top-clearance);
  }

  .hero__role {
    font-size: clamp(0.82rem, 3.2vw, 1rem);
    line-height: 1.12;
  }
}
```

Use the actual local selectors if they differ.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: no horizontal overflow; hero name remains animated, role remains plain text.

- [ ] **Step 4: Commit**

```bash
git add src/styles/modules/hero.css src/components/hero-title/hero-title.js
git commit -m "fix: improve mobile hero clearance"
```

### Task 4: Gallery And Video Container Normalization

**Files:**
- Modify: `src/styles/modules/portfolio-gallery.css`
- Modify: `src/visuals/dom/portfolio-gallery.js`
- Modify: `src/components/lightbox.js`
- Modify: `src/components/showcase-inline-video/showcase-inline-video.js`

- [ ] **Step 1: Define stable media tokens**

Add gallery tokens in `portfolio-gallery.css` near the showcase gallery rules:

```css
#showcase {
  --media-radius: 14px;
  --media-gap: clamp(0.75rem, 1.4vw, 1.25rem);
  --media-banner-ratio: 16 / 9;
  --media-card-ratio: 4 / 3;
  --media-portrait-ratio: 3 / 4;
}
```

- [ ] **Step 2: Normalize image and video containment**

Use existing classes and data attributes. Images and videos must fill their container without distortion:

```css
#showcase .media-item img,
#showcase .media-item video,
#showcase [data-media-item] img,
#showcase [data-media-item] video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#showcase .media-item[data-fit="contain"] img,
#showcase .media-item[data-fit="contain"] video {
  object-fit: contain;
}
```

- [ ] **Step 3: Give small groups a slider-compatible horizontal rail**

For groups with fewer than four items, keep the same group but allow a compact rail pattern that matches the existing Berserk-style view logic:

```css
#showcase .media-group[data-gallery-density="compact"] .media-grid,
#showcase .media-group[data-gallery-density="rail"] .media-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(min(78vw, 18rem), 24rem);
  grid-template-columns: none;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
```

- [ ] **Step 4: Keep large groups as a horizontal tile rail instead of endless vertical walls**

Large groups should keep their membership and order but scroll the whole tile board horizontally:

```css
#showcase .media-group[data-gallery-density="dense"] .media-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, minmax(10rem, 16rem));
  grid-auto-columns: minmax(14rem, 22rem);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x proximity;
}
```

- [ ] **Step 5: Verify media behavior**

Run:

```bash
npm run build
npm run check:portfolio
```

Manually inspect desktop 1440px and mobile 390px for mixed portrait/landscape groups.

- [ ] **Step 6: Commit**

```bash
git add src/styles/modules/portfolio-gallery.css src/visuals/dom/portfolio-gallery.js src/components/lightbox.js src/components/showcase-inline-video/showcase-inline-video.js
git commit -m "fix: normalize showcase galleries and videos"
```

### Task 5: Typography And Responsibilities Readability

**Files:**
- Modify: `src/styles/modules/portfolio-reading.css`
- Modify: `src/styles/modules/portfolio-lists.css`
- Modify: `src/styles/modules/portfolio-system.css`

- [ ] **Step 1: Scope all type changes to showcase bodies**

Do not affect hero, resume, filter internals, policy book, artifact reader, or project/chapter headers. Use selectors rooted at:

```css
#showcase .case-chapter__body,
#showcase .project-responsibilities
```

- [ ] **Step 2: Improve body rhythm**

Use stable max-widths, readable line-height, and smaller mobile jumps:

```css
#showcase .case-chapter__body {
  --body-copy-width: min(100%, 68rem);
  --body-text-size: clamp(1rem, 0.38vw + 0.92rem, 1.18rem);
  --body-line-height: 1.58;
}
```

- [ ] **Step 3: Reformat list-like text without changing words**

Use spacing, borders, and inline hierarchy only. Do not edit the text content.

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: no route fails; responsibility lists stay visible and readable on mobile.

- [ ] **Step 5: Commit**

```bash
git add src/styles/modules/portfolio-reading.css src/styles/modules/portfolio-lists.css src/styles/modules/portfolio-system.css
git commit -m "style: refine showcase reading typography"
```

### Task 6: Filter And Policy Presentation Shell

**Files:**
- Modify: `src/styles/modules/portfolio-system.css`
- Modify: `src/styles/modules/portfolio-gallery.css`
- Modify: `index.html` only for wrapper classes around existing components

- [ ] **Step 1: Keep internals untouched**

Do not edit `src/styles/playlist-filter-embed.css`, `src/visuals/dom/playlist-filter-embed.js`, `src/styles/modules/policy-book.css`, or `src/visuals/dom/policy-book.js`.

- [ ] **Step 2: Improve only outer placement**

Use wrapper spacing, max-height, and container alignment around the embedded filter and policy presentation. Keep the actual filter scale/content untouched.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: filter remains interactive; no horizontal body overflow.

- [ ] **Step 4: Commit**

```bash
git add index.html src/styles/modules/portfolio-system.css src/styles/modules/portfolio-gallery.css
git commit -m "style: improve showcase component presentation"
```

### Task 7: Minimal Text Resume Page

**Files:**
- Modify: `resume/index.html`
- Create: `src/styles/modules/pets/resume-page.css` or `src/styles/modules/resume-page.css`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Create a standalone one-screen resume layout**

Keep it static and text-first: name, role, compact profile paragraph, selected experience, compact skills, contact line.

- [ ] **Step 2: Use restrained resume-only CSS**

Create a route-scoped class, for example:

```css
.resume-page {
  min-height: 100svh;
  padding: clamp(1rem, 3vw, 2rem);
  color: #111;
  background: #fff;
}
```

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: `/resume/` loads, no missing stylesheet, no horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add resume/index.html src/styles/index.css src/styles/modules/resume-page.css
git commit -m "feat: add minimal resume page"
```

### Task 8: Final Content Facts And Lead Text

**Files:**
- Modify: `index.html`
- Modify: `src/styles/modules/portfolio-reading.css`
- Modify: `src/styles/modules/portfolio-lists.css`

- [ ] **Step 1: Add only high-signal facts from the provided source**

Use the strongest facts without overloading the page: 12 years, art direction, team leadership, design systems, 4-product ecosystem, 1500+ creatives, 16 scenarios, 10+ CJM, 6 campaigns, 100+ editorial texts.

- [ ] **Step 2: Add a concise lead after hero**

Do not create marketing fluff. Keep the lead factual and short.

- [ ] **Step 3: Add Jestei Pool facts only where context already exists**

Do not create unrelated sections. Place factoids near existing Jestei responsibilities/results blocks.

- [ ] **Step 4: Verify text integrity**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: no technical placeholder text, no empty media containers, no broken routes.

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles/modules/portfolio-reading.css src/styles/modules/portfolio-lists.css
git commit -m "content: add portfolio lead and selected facts"
```

### Task 9: Import And CSS Layer Cleanup

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/styles/modules/portfolio-final-regression-repair.css`
- Modify: target module files that receive migrated rules

- [ ] **Step 1: Move only verified repair rules**

For each rule moved from `portfolio-final-regression-repair.css`, paste it into the owning module and delete the original duplicate from the repair file in the same commit.

- [ ] **Step 2: Do not broaden selectors**

Every moved rule must remain scoped to the same component or a narrower component.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm run check:portfolio
```

Expected: visual behavior remains stable; no new `!important`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css src/styles/modules
git commit -m "refactor: reduce portfolio repair css"
```

### Task 10: Final Cross-Device Verification

**Files:**
- Modify only files needed for defects found during verification.

- [ ] **Step 1: Build**

Run:

```bash
npm run build
```

Expected: Vite exits with code 0.

- [ ] **Step 2: Preview**

Run:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

- [ ] **Step 3: Regression check**

Run:

```bash
npm run check:portfolio
```

Expected: all checked routes pass.

- [ ] **Step 4: Manual visual pass**

Inspect:

- `/` at 1440x1000 and 390x844.
- `/resume/` at 1440x1000 and 390x844.
- `/pets/berserk-timer/`, `/pets/awful-cases/`, and `/pets/awful-describer/`.
- Showcase gallery groups with portrait, landscape, video, small groups, and dense groups.
- Header/menu/proximity behavior on desktop and mobile.
- Filter wrapper and policy book presentation.

- [ ] **Step 5: Commit final fixes if any**

```bash
git add <changed-files>
git commit -m "fix: close portfolio regression gaps"
```

## Self-Review

- Spec coverage: plan covers performance, code cleanup, galleries, videos, canvas reliability, typography, filter/policy presentation, resume page, final text facts, staged commits, and no push.
- Placeholder scan: no task uses an unbounded placeholder as the implementation instruction; each task has target files, commands, and expected checks.
- Scope check: the whole request is broad, so the plan is staged. Each commit remains independently revertible.
- Risk note: existing uncommitted work predates this plan and must be handled carefully; do not revert it unless explicitly asked.
