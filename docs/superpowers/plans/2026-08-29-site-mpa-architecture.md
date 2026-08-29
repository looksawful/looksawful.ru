# Site MPA Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the production portfolio into a static Vite MPA with typed Case/Project/Collection routes while preserving the existing homepage, CV, SEO, media, motion, CMS, analytics, and verification contracts.

**Architecture:** Add a typed `src/site` page manifest/rendering layer. Extract project-specific HTML composition from `vite.config.ts` into renderers, generate physical MPA HTML entries from the manifest, and feed all public routes through the existing sitemap/meta/link validation pipeline. Keep `/cv/` as its current public static artifact during this migration.

**Tech Stack:** Vite 8, TypeScript 7, vanilla HTML/CSS/JS, Node test runner, Playwright, GSAP, Three.js, Embla Carousel, PhotoSwipe, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-site-mpa-architecture-design.md`

## Global Constraints

- Base implementation on current `prod`; develop on `feat/site-mpa-architecture`.
- Do not change authored/user-facing copy, captions, credits, names, labels, project text, typography, spacing, colors, or media ordering.
- Preserve `AGENTS.md` media registry, generated-media, video master, caption, lightbox, and verification contracts.
- Preserve `/cv/` and `tools/smoke-cv.mjs`.
- Reuse the existing production origin and postbuild SEO/sitemap/link tooling.
- Do not add React/Next/Astro/Vue/Svelte, a client router, or a new CMS.
- New TypeScript page code must not use `any`.

---

### Task 1: Add typed page manifest and validation

**Files:**
- Create: `src/site/pages/types.ts`
- Create: `src/site/pages/manifest.ts`
- Create: `src/site/pages/validation.ts`
- Create: `test/site-pages.test.ts`

**Interfaces:**
- Produces `SitePageDefinition`, `EntityPageDefinition`, `sitePages`, `getEnabledSitePages()`, `validateSitePages()`.
- Case pages reference existing `CaseId`; Project pages reference existing catalog `ProjectId`; Collection pages reference existing `CollectionId`.

- [ ] Write Node tests that assert unique page IDs and paths, valid leading/trailing slash normalization, known entity references, and no indexable unlisted/disabled collision.
- [ ] Run `node --test test/site-pages.test.ts` and confirm the test fails because the page layer does not exist.
- [ ] Implement the discriminated page types, manifest entries for home, Jestei, Styx, Sensetique, Shootings and 404, plus runtime validation against the existing catalog lookup functions.
- [ ] Run `npm run typecheck` and `node --test test/site-pages.test.ts`.
- [ ] Commit the page model.

### Task 2: Add shared metadata and shell renderers

**Files:**
- Create: `src/site/shell/metadata.ts`
- Create: `src/site/shell/navigation.ts`
- Create: `src/site/shell/page-shell.ts`
- Create: `test/site-shell.test.ts`

**Interfaces:**
- `renderPageMetadata(page, entity?) -> string`
- `renderSiteNavigation(currentPath) -> string`
- `renderPageShell({ page, title, description, content, bodyAttributes }) -> string`

- [ ] Write tests for production canonical `https://www.looksawful.ru`, public robots, noindex robots, OG URL equality, one main document shell, and `aria-current`.
- [ ] Confirm tests fail.
- [ ] Implement HTML escaping and metadata rendering without duplicating the existing content-domain data.
- [ ] Run the new tests and typecheck.
- [ ] Commit the shell.

### Task 3: Extract explicit Case/Collection composition from Vite

**Files:**
- Create: `src/site/renderers/cases/jestei-pool.ts`
- Create: `src/site/renderers/cases/styx.ts`
- Create: `src/site/renderers/cases/sensetique.ts`
- Create: `src/site/renderers/collections/shootings.ts`
- Create: `src/site/renderers/home/home-slots.ts`
- Create: `src/site/renderers/registry.ts`
- Modify: `vite.config.ts`

**Interfaces:**
- Each case/collection renderer exposes the ordered build-time HTML for the entity using the existing `src/data/content/*` and `src/templates/*` modules.
- `createHomepageSlots()` produces the exact existing homepage marker replacements.
- `renderEntityPage(definition)` dispatches only through typed renderer maps.

- [ ] Add tests/snapshots or exact marker assertions proving that every currently required homepage slot is still supplied once.
- [ ] Move Jestei/Styx/Sensetique/Shootings content imports and ordered renderer calls out of `vite.config.ts` without changing the generated homepage HTML.
- [ ] Move remaining home-only slot knowledge into `home-slots.ts`.
- [ ] Reduce `vite.config.ts` to infrastructure/plugin wiring.
- [ ] Run typecheck and existing unit/data-integrity tests.
- [ ] Commit the composition extraction.

### Task 4: Add physical Vite MPA entry generation

**Files:**
- Create: `src/site/build/inputs.ts`
- Create: `src/site/build/site-pages-plugin.ts`
- Create: source HTML entry files only where Vite 8 requires them; entries must stay minimal and generated/derived from the page manifest.
- Modify: `vite.config.ts`
- Test: `test/site-build-inputs.test.ts`

**Interfaces:**
- `createSiteInputs(root) -> Record<string, string>`
- `createSitePagesPlugin() -> Plugin`

- [ ] Write tests deriving expected entry paths from `sitePages`.
- [ ] Implement physical nested directory inputs for `/work/jestei-pool/`, `/work/styx/`, `/work/sensetique/`, `/shootings/`, plus home while leaving `/cv/` owned by `public/cv/`.
- [ ] Render page shell/entity content at build time based on explicit page identity, not content-marker guessing.
- [ ] Build and assert the corresponding `dist/**/index.html` files exist.
- [ ] Commit MPA build support.

### Task 5: Make standalone runtime initialization DOM-safe and isolate heavy modules

**Files:**
- Modify: `src/main.js`
- Modify only if required: `src/interactive.js`, `src/motion.ts`
- Test existing component tests plus new targeted runtime tests where practical.

**Interfaces:**
- Shared runtime safely initializes on pages that omit homepage/project-specific DOM.
- Heavy Awful Cases/animated canvas/Jestei organism code loads only when matching DOM exists where practical.

- [ ] Add/adjust tests for no-target behavior.
- [ ] Convert project-specific eager imports to DOM-gated dynamic imports where they otherwise pollute unrelated standalone pages.
- [ ] Preserve analytics, BFCache/pagehide, reduced-motion, caption numbering, media health, lightbox/decks/reels/page flip/before-after/video behavior.
- [ ] Run unit tests and typecheck.
- [ ] Commit runtime isolation.

### Task 6: Connect homepage project cards to standalone routes without changing card content

**Files:**
- Modify: `src/templates/project-card.ts`
- Create/modify a small presentation mapping under `src/site/pages/` if `jestei` → `jestei-pool` requires explicit mapping.
- Test: project card template tests or `test/site-pages.test.ts`.

**Interfaces:**
- Card IDs remain the Pages-CMS IDs from `src/content/projects.json`.
- Routing comes from the page layer and is not editable through `.pages.yml`.

- [ ] Write mapping/link tests for the four cards.
- [ ] Implement links only for enabled standalone routes.
- [ ] Preserve card markup/classes/content/cover data except for the necessary anchor destination.
- [ ] Run tests.
- [ ] Commit card routing.

### Task 7: Add 404 page and integrate existing SEO/postbuild tools

**Files:**
- Add/generate: `404.html` or equivalent source producing `dist/404.html`
- Modify: `tools/generate-sitemap.mjs`
- Modify: `tools/check-site-meta.mjs`
- Modify only if required: `tools/check-local-links.mjs`, `tools/site-html-utils.mjs`
- Tests: existing tooling tests plus route-manifest tests.

**Interfaces:**
- Public/indexable manifest pages appear in sitemap.
- Unlisted/noindex and 404 do not.
- `/cv/` remains discoverable according to its current production metadata.

- [ ] Add tests for sitemap inclusion/exclusion and 404 noindex handling.
- [ ] Generate `dist/404.html` through the shared shell without SPA redirect behavior.
- [ ] Make sitemap/meta/link tools understand nested MPA output without weakening existing checks.
- [ ] Run `npm run build`, `npm run check:site-meta`, and `npm run check:links` in an environment with dependencies.
- [ ] Commit postbuild integration.

### Task 8: Expand Playwright smoke coverage for MPA routes

**Files:**
- Modify: `tools/smoke-site.mjs`
- Preserve: `tools/smoke-cv.mjs`

**Interfaces:**
- Reusable `auditPage({ path, viewports, expectations })` keeps current image/video/canvas/lightbox/overflow/network assertions.

- [ ] Refactor existing homepage audit into reusable route audit helpers without reducing the current homepage viewport matrix.
- [ ] Add Jestei/Styx/Sensetique route checks at 390×844, 1024×768 and 1440×900; add 1920×1080 for the heaviest case.
- [ ] Add Shootings at 390×844 and 1440×900.
- [ ] Add direct reload checks and assertions that standalone pages do not contain unrelated case roots.
- [ ] Preserve CV smoke as a separate mandatory check.
- [ ] Commit MPA smoke coverage.

### Task 9: Add selected standalone Project page support

**Files:**
- Create: `src/site/renderers/projects/*` only for current catalog projects with complete existing content.
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/renderers/registry.ts`
- Tests: `test/site-pages.test.ts`, build/smoke expectations.

**Interfaces:**
- Projects use existing catalog `ProjectId`; Engagement records never become Project routes directly.
- Page discovery controls listed/indexable state independently from project lifecycle status.

- [ ] Audit current catalog/content and select only projects with complete renderable content.
- [ ] Add renderer and manifest entries without duplicating content sources.
- [ ] Mark currently unlisted pages `listed: false`, `indexable: false` where appropriate.
- [ ] Extend build/metadata/smoke tests from manifest-derived route data.
- [ ] Commit Project support.

### Task 10: Documentation and full verification

**Files:**
- Create: `docs/site-pages.md`
- Modify only where verification reveals actual regressions.

- [ ] Document Case/Project/Collection/Engagement, page manifest, discovery/indexability, route addition, homepage presentation, Pages CMS boundary, SEO/sitemap and verification commands.
- [ ] Run `npm run verify`.
- [ ] Run `npm run check:site-meta` and `npm run check:links`.
- [ ] Run `git diff --check`.
- [ ] When CI/environment permits, run production, Lighthouse and external-link checks.
- [ ] Inspect generated HTML/routes and network behavior for cross-project media loading.
- [ ] Commit documentation/final fixes and prepare the branch for review.