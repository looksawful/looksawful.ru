# Blog v1 Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, Pages-CMS-editable editorial blog at `/blog/` and `/blog/<slug>/` without changing the existing portfolio design system or loading portfolio runtime on blog pages.

**Architecture:** Blog content is Markdown plus YAML frontmatter loaded and validated at build time. `/blog/` is an architectural MPA page; published post routes are content-derived and receive deterministic generated Vite entry stubs. Blog pages use a dedicated CSS/TS asset profile that consumes existing global foundations while isolating editorial typography and behavior.

**Tech Stack:** Vite 8 static MPA, Node 24, TypeScript 7 strict checking, Node test runner, Pages CMS, existing Playwright smoke runtime, existing semantic CSS tokens/patterns, Fontsource variable fonts.

**Spec:** `docs/superpowers/specs/2026-08-30-blog-v1-editorial-design.md`

## Global Constraints

- Do not modify existing authored project copy while implementing blog architecture.
- Do not refactor `src/styles/tokens.css`, `colors.css`, `base.css`, `patterns.css`, `index.css`, `components.css`, `captions.css`, `motion.css` or `src/main.js` for blog needs.
- CSS owns responsive layout; TypeScript must not branch on viewport width for blog composition.
- Blog pages must not import GSAP, Three, PhotoSwipe, Embla, media decks, infinite reels, PageFlip or portfolio motion.
- Blog-specific design values stay local to blog selectors rather than global tokens.
- Use the existing media/build/E2E pipeline from the current tooling base; do not duplicate it.
- Published article slugs come from filenames and must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Drafts are excluded from indexable routes and sitemap.
- Raw Markdown HTML and arbitrary iframe URLs are not allowed.
- Run tests before implementation changes for each behavioral task and observe the intended failure first.

---

### Task 1: Establish the blog content contract and validation

**Files:**
- Create: `src/site/blog/types.ts`
- Create: `src/site/blog/validation.ts`
- Create: `src/site/blog/loader.ts`
- Create: `src/site/blog/markdown.ts`
- Create: `test/blog-content.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `BLOG_KINDS`, `BlogKind`, `BlogEntry`, `loadBlogEntries()`, `getPublishedBlogEntries()` and explicit validation errors.
- Later routing/rendering tasks consume only validated `BlogEntry` values.

- [ ] Write tests for valid frontmatter, filename-derived slug, invalid slug, duplicate slug, invalid kind, invalid URL, invalid dates, invalid cover, invalid video, draft filtering and H1 rejection.
- [ ] Run the focused content test through CI and confirm RED because blog modules do not exist.
- [ ] Add the minimal build-time YAML/Markdown dependencies after checking ESM/Node 24 compatibility.
- [ ] Implement typed parsing and validation without raw HTML support.
- [ ] Re-run focused and core tests through CI and confirm GREEN.
- [ ] Commit as `feat(blog): add validated markdown content model`.

### Task 2: Add deterministic post entry preparation and route registry

**Files:**
- Create: `src/site/blog/page-registry.ts`
- Create: `tools/prepare-blog-entries.mjs`
- Create: `test/blog-entry-preparation.test.mjs`
- Create: `test/blog-routes.test.mjs`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `src/site/build/inputs.ts`
- Modify: `src/site/build/site-pages-plugin.ts`
- Modify: `src/site/pages/types.ts`
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/pages/validation.ts`
- Create: `blog/index.html`

**Interfaces:**
- `getBlogPageDefinitions()` returns published `blog-post` definitions.
- `prepare-blog-entries.mjs` owns only marked `blog/<slug>/index.html` generated stubs.

- [ ] Write RED tests proving `/blog/` is present, published posts produce routes, drafts do not, repeated generation is deterministic and unrelated HTML is never removed.
- [ ] Integrate a `site:entries:prepare` step into the current tooling pipeline before Vite input discovery without changing media preparation semantics.
- [ ] Implement the smallest route registry and ownership-marked stub generator.
- [ ] Extend Vite input/page resolution so generated article pages render through the normal site renderer pipeline.
- [ ] Run focused/core tests and build through CI; confirm GREEN.
- [ ] Commit as `feat(blog): add content-derived MPA routes`.

### Task 3: Add page-specific asset profiles without portfolio regressions

**Files:**
- Modify: `src/site/shell/page-shell.ts`
- Create: `test/blog-shell-assets.test.mjs`

**Interfaces:**
- `PageAssets { stylesheet: string; script: string }`.
- Default shell assets remain `/src/styles/index.css` and `/src/main.js`.
- Blog assets are `/src/styles/blog-entry.css` and `/src/blog.ts`.

- [ ] Write a RED regression test proving existing pages retain the existing asset pair and blog pages can request a second pair.
- [ ] Extend the shell with an optional asset profile and preserve default output.
- [ ] Run tests/build through CI and confirm GREEN.
- [ ] Commit as `feat(blog): isolate blog page assets`.

### Task 4: Render the blog index and articles

**Files:**
- Create: `src/site/renderers/blog/blog-index.ts`
- Create: `src/site/renderers/blog/blog-post.ts`
- Create: `src/site/renderers/blog/blog-card.ts`
- Create: `src/site/renderers/blog/blog-prose.ts`
- Create: `src/site/renderers/blog/blog-video.ts`
- Modify: `src/site/build/site-pages-plugin.ts` or its current renderer dispatch equivalent
- Create: `test/blog-rendering.test.mjs`

**Interfaces:**
- Index emits semantic ordered feed plus data attributes for progressive filter enhancement.
- Article emits semantic article/header/time/figure/prose/footer markup.
- Code markup conforms to the existing `createCodeBlocks()` component contract.

- [ ] Write RED rendering tests for cards, article heading hierarchy, dates, code contract, cover, video fallback and draft exclusion.
- [ ] Implement escaped, semantic renderers using existing HTML utilities.
- [ ] Ensure Markdown H1 cannot create a second document H1.
- [ ] Run focused/core tests and build through CI; confirm GREEN.
- [ ] Commit as `feat(blog): render editorial index and posts`.

### Task 5: Integrate navigation, breadcrumbs and SEO

**Files:**
- Modify: `src/content/navigation.json`
- Modify: `src/data/navigation.ts` only if required by the existing adapter contract
- Modify: `src/site/navigation/model.ts`
- Modify: `src/site/shell/navigation.ts` only if required for three-level breadcrumb rendering
- Modify: `src/site/shell/metadata.ts`
- Create or extend tests for navigation and metadata

**Interfaces:**
- Navigation id `blog` maps to code-owned `/blog/` while label remains CMS-editable.
- Blog article breadcrumb is Home → Blog → article title.
- Article metadata supports article dates, optional image and `BlogPosting` JSON-LD.

- [ ] Add RED tests for primary navigation, three-level article breadcrumb and article metadata.
- [ ] Implement minimal page-model-aware navigation/metadata extensions without changing existing page output.
- [ ] Verify sitemap behavior with published and draft fixtures.
- [ ] Run core tests/build through CI and confirm GREEN.
- [ ] Commit as `feat(blog): integrate navigation and article metadata`.

### Task 6: Add Pages CMS authoring and scoped blog media

**Files:**
- Modify: `.pages.yml`
- Create: `public/media/blog/.gitkeep` if the repository permits empty media roots
- Add configuration-contract tests if the project already tests Pages CMS config

**Interfaces:**
- CMS collection edits `src/content/blog/*.md` as YAML frontmatter plus Markdown.
- Scoped media source writes WebP assets under `public/media/blog`.

- [ ] Write/extend config test to assert route/slug remain code-owned, create is enabled, rename/delete are disabled and required fields exist.
- [ ] Add `blog-images` media source and `blog` collection using the current Pages CMS schema.
- [ ] Verify `.pages.yml` parsing and existing CMS checks through CI.
- [ ] Commit as `feat(blog): add Pages CMS authoring`.

### Task 7: Add isolated editorial CSS and Source Serif 4

**Files:**
- Create: `src/styles/blog-entry.css`
- Create: `src/styles/blog/blog.css`
- Create: `src/styles/blog/prose.css`
- Create: `src/styles/blog/code.css`
- Create: `src/styles/blog/media.css`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Blog entry imports existing reset/tokens/colors/base/patterns/navigation/utilities but not portfolio components/captions/motion.
- Source Serif 4 is local to editorial reading roles; Inter remains UI/index/meta.

- [ ] Add a source-contract test that fails if blog entry imports portfolio-only CSS/runtime or if existing global CSS files are modified for blog selectors.
- [ ] Add Source Serif 4 variable dependency and load real roman/italic faces.
- [ ] Implement local editorial custom properties, index/feed/card layout, article header, `68ch` reading measure, content/wide Grid tracks, stable long-form body typography and bounded fluid display typography.
- [ ] Implement intrinsic/container-responsive behavior rather than device breakpoint grids.
- [ ] Implement visible focus/hover/reduced-motion behavior using existing semantic colors and radii.
- [ ] Build through CI and inspect generated CSS/font requests.
- [ ] Commit as `feat(blog): add isolated editorial styles`.

### Task 8: Add code, figure, table and video presentation

**Files:**
- Extend: `src/styles/blog/code.css`
- Extend: `src/styles/blog/media.css`
- Create: `src/components/blog-video.ts`
- Create/extend component tests

**Interfaces:**
- Code uses existing mono stack and existing copy runtime; long lines scroll horizontally.
- Figures/screenshots are blog-specific and captions use Inter.
- Video initializer returns `() => void` and creates only `youtube-nocookie.com` iframe URLs from validated IDs.

- [ ] Write RED tests for video URL construction, no iframe before activation, cleanup, code overflow contract and figure/table markup.
- [ ] Implement minimal video enhancement and editorial styles.
- [ ] Keep no-JS external video fallback intact.
- [ ] Run focused/core tests/build through CI and confirm GREEN.
- [ ] Commit as `feat(blog): add code media and video presentation`.

### Task 9: Add progressive filter/search runtime

**Files:**
- Create: `src/components/blog-filter.ts`
- Create: `src/blog.ts`
- Create: `test/blog-filter.test.mjs` or equivalent browser-independent state tests

**Interfaces:**
- Filter state uses `type` and `q` search parameters.
- `initBlogFilter(root)` and `initBlogVideos(root)` return cleanup functions.
- `src/blog.ts` imports only navigation, analytics, filter, video and code-copy runtime.

- [ ] Write RED tests for NFKC/Russian normalization, kind+query intersection, invalid `type` fallback, URL parsing/serialization and cleanup-friendly API.
- [ ] Implement DOM filtering using native `hidden` and event delegation.
- [ ] Implement `replaceState`, category history behavior and `popstate` restoration.
- [ ] Compose the minimal blog entry runtime.
- [ ] Add a dependency-contract test asserting blog entry does not import portfolio-heavy modules.
- [ ] Run focused/core tests/build through CI and confirm GREEN.
- [ ] Commit as `feat(blog): add progressive search and filtering`.

### Task 10: Add blog E2E coverage and Lighthouse routes

**Files:**
- Create: `tools/smoke-blog.mjs`
- Modify: shared E2E suite registry/runner used by the current tooling branch
- Modify: `lighthouserc.cjs`
- Extend: tests that enforce shared runtime usage

**Interfaces:**
- Blog smoke receives existing `{ browser, baseUrl }` runtime rather than launching Chromium/Vite itself.

- [ ] Write RED contract test proving blog smoke is import-safe and uses the shared runtime.
- [ ] Cover index load, navigation, card→article, filter/search URL state, draft absence, canonical/meta, YouTube pre/post click, no horizontal overflow and console errors.
- [ ] Add `/blog/` and one representative published fixture route to Lighthouse where current config permits.
- [ ] Run E2E/Lighthouse through CI and address regressions without changing portfolio UI.
- [ ] Commit as `test(blog): cover editorial routes in browser`.

### Task 11: Document authoring, architecture and integration

**Files:**
- Create: `docs/blog-authoring.md`
- Update: `docs/site-pages.md` where the new page types/build preparation must be documented
- Update: `docs/site-operations.md` only for blog-specific author/publish steps that genuinely differ

**Interfaces:**
- Documentation tells an author exactly how to create/edit/draft/publish a blog entry through Pages CMS and tells an engineer how blog routes/assets are generated.

- [ ] Document frontmatter fields with examples and validation rules.
- [ ] Document CSS dependency direction and the explicit list of global CSS files blog must not modify.
- [ ] Document generated entry ownership and cleanup behavior.
- [ ] Document PR #24/current tooling-base integration assumption and future retarget procedure.
- [ ] Commit as `docs(blog): document authoring and architecture`.

### Task 12: Final verification and integration readiness

**Files:** no new feature files unless a failing verification requires a scoped fix.

- [ ] Fetch/inspect the current status of PR #24 and current `dev`.
- [ ] Compare `feat/blog-v1-editorial` against its base and against current `dev`.
- [ ] Confirm no forbidden global CSS/runtime files changed for blog implementation.
- [ ] Run the repository's current full verification workflow in GitHub Actions and record the result.
- [ ] Run/inspect Lighthouse and E2E results.
- [ ] Confirm blog bundle dependency graph does not pull portfolio-heavy libraries.
- [ ] Confirm published/draft sitemap behavior.
- [ ] Produce a final implementation report with changed files, tests, CI evidence, known deferred items and exact integration steps.
