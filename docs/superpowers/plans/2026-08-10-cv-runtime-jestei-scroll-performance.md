# CV Runtime, Jestei and Scroll Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CV accordion the single source of scene activity, simplify Jestei hosting, and reduce scroll hot-path work without changing visible copy.

**Architecture:** Add a CV-scoped state/runtime coordinator passed directly to heavy scene components. Keep component-local viewport culling where useful, but remove accordion-state MutationObservers and duplicate document visibility listeners. Move Jestei base UI markup/tokens out of JavaScript, then optimize frame calculations and DOM writes with reusable buffers and caches.

**Tech Stack:** Vanilla JavaScript ES modules, CSS custom properties, HTML, Three.js 0.184, Vite 8, Node 24 built-in test runner.

## Global Constraints

- Final production branch is `prod`.
- No visible author copy changes.
- No new runtime dependencies.
- No global site scheduler; runtime scope is the CV accordion.
- Preserve reduced-motion and static fallbacks.
- Validate on an isolated branch before fast-forwarding `prod`.

---

### Task 1: Runtime contract and tests

**Files:**
- Create: `src/components/cv-accordion/cv-accordion-runtime.js`
- Create: `test/cv-accordion-runtime.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces `createCvAccordionRuntime({ count, initialMode })`.
- Runtime methods: `getSnapshot()`, `setMode(mode)`, `setActiveIndex(index)`, `setDocumentVisible(visible)`, `subscribeScene(index, listener, options)`, `subscribeFrame(index, listener)`, `publishFrame(frame)`, `subscribeInvalidation(listener)`, `invalidate(index)`, `destroy()`.

- [ ] Write Node tests for single active index, direct scene subscriptions, per-scene frame projection, invalidation, and destroy.
- [ ] Run tests and confirm RED because the module does not exist.
- [ ] Implement the runtime and one `visibilitychange` listener.
- [ ] Run tests and confirm GREEN.

### Task 2: Frame-buffer reuse

**Files:**
- Modify: `src/components/cv-accordion/cv-accordion-frame.js`
- Create: `test/cv-accordion-frame.test.js`

**Interfaces:**
- `createScrollMap()` adds `contentSegments` indexed by scene.
- Add `createAccordionFrameBuffer(count)`.
- `computeAccordionFrame(..., frameBuffer)` mutates/reuses the supplied buffer.

- [ ] Write tests proving array identity is reused and content segment lookup is indexed.
- [ ] Run RED.
- [ ] Implement reusable buffers and indexed segment lookup without changing output semantics.
- [ ] Run GREEN.

### Task 3: Accordion integration and scroll write caching

**Files:**
- Modify: `src/components/cv-accordion/cv-accordion.js`
- Modify: `src/components/cv-accordion/cv-accordion-scroll.js`
- Modify: `src/main.js`

**Interfaces:**
- `createCvAccordion()` returns `{ runtime, destroy }`.
- Scroll publishes frames directly to runtime.
- Geometry invalidation is direct.

- [ ] Replace `openIndexes` with one active index in click mode.
- [ ] Commit ARIA/panel inert/header inert only when active index changes.
- [ ] Cache record CSS writes and header visibility booleans.
- [ ] Observe component continuously and only active record content/tracks dynamically.
- [ ] Remove `cvaccordionframe` dispatch.
- [ ] Run unit tests and production build.

### Task 4: Migrate CV consumers to direct runtime

**Files:**
- Modify: `src/components/digital-scroll-gallery/digital-scroll-gallery.js`
- Modify: `src/components/animated-canvas-gallery/animated-canvas-gallery.js`
- Modify: `src/components/animated-canvas-gallery/animated-canvas-gallery-preview.js`
- Modify: `src/components/awful-tools-preview/awful-tools-preview.js`
- Modify: `src/components/before-after/before-after.js`
- Modify: `src/main.js`

**Interfaces:**
- Each component accepts `accordionRuntime` optionally.
- When runtime exists, scene activity/document visibility comes from direct subscriptions.
- Standalone fallback behavior remains available.

- [ ] Remove accordion `MutationObserver`s from migrated consumers.
- [ ] Remove duplicate CV `visibilitychange` listeners when runtime is supplied.
- [ ] Keep local IntersectionObserver only for component viewport culling.
- [ ] Make digital scroll gallery consume direct per-scene frames.
- [ ] Run tests/build.

### Task 5: Move Jestei markup/tokens out of JS

**Files:**
- Modify: `index.html`
- Modify: `src/components/jestei-theme-organism/jestei-theme-organism-data.js`
- Modify: `src/components/jestei-theme-organism/jestei-theme-organism.css`
- Modify: `src/components/jestei-theme-organism/jestei-theme-organism.js`

**Interfaces:**
- Inline organism markup exists in HTML before JS mount.
- CSS owns UI theme/palette custom properties.
- Jestei JS owns WebGL values, active theme/progress and lifecycle.

- [ ] Replace the inline empty Jestei root with current final organism markup, preserving exact visible strings.
- [ ] Remove markup generator from JS data module.
- [ ] Define theme/palette UI tokens in CSS.
- [ ] Stop rewriting token text/palette DOM from the animation loop.
- [ ] Replace dynamic loop-clone creation with static hidden neutral clone in HTML.
- [ ] Run build and source assertions.

### Task 6: Jestei preparation lifecycle

**Files:**
- Modify: `src/components/jestei-theme-organism/jestei-theme-organism.js`
- Modify: `src/main.js`

**Interfaces:**
- `createJesteiThemeOrganism({ root, motion, accordionRuntime })`.
- `preload()` warms imports/model only.
- `prepare()` creates/compiles/renders one WebGL experience while paused.
- `resume()/pause()` only control rAF/active canvas observing.

- [ ] Schedule preload after first paint.
- [ ] Prepare renderer on runtime prepare hint / near-active scene.
- [ ] Remove Jestei accordion MutationObserver and own CV visibility listener.
- [ ] Remove track ResizeObserver; enable canvas ResizeObserver only while running.
- [ ] Run build.

### Task 7: CI, visual/runtime verification and production promotion

**Files:**
- Create then delete: `.github/workflows/cv-runtime-refactor-ci.yml`
- Modify: `.github/workflows/pages.yml` only if a stable test step is retained.

- [ ] Run Node unit tests and Vite production build on isolated branch.
- [ ] Assert no migrated accordion MutationObservers/duplicate CV visibility listeners remain.
- [ ] Capture baseline/new Jestei DOM fixtures at 375×812, 768×1024 and 1440×1000 and compare layout geometry/pixels where deterministic.
- [ ] Fast-forward `prod` only after isolated checks pass.
- [ ] Verify the production Pages workflow reaches build/deploy/production-commit success.
- [ ] Smoke-test live runtime for console errors and scene activation.
