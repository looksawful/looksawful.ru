# Global Site Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal hamburger-based global navigation with breadcrumbs across the static MPA and ship it through the existing PR to production.

**Architecture:** Keep canonical route identity in `sitePages`, add a focused navigation model for menu membership/labels, render one shared header/menu from the site shell, and enhance it with a small lifecycle-safe TypeScript controller. CSS stays isolated in one component stylesheet and reuses existing tokens; the existing `.project-nav` remains unchanged.

**Tech Stack:** Vite 8 static MPA, TypeScript, vanilla DOM APIs, CSS layers/tokens, Node test runner, Playwright smoke tests, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-site-navigation-design.md`

## Global Constraints

- Do not change authored project copy, captions, credits, media data, selectors, project UX, or the isolated Jestei filter.
- Menu destinations are exactly Главная, Jestei Pool, Styx, Sensetique, Shootings, Резюме.
- Do not add a `Work` menu item.
- Do not expose direct-link-only Project routes in the menu.
- Keep one markup/interaction model for mobile and desktop.
- Reuse existing CSS tokens and logical properties; no new framework or dependency.
- Merge to `prod` only after the full verification suite is green.

---

### Task 1: Navigation model and render contract

**Files:**
- Create: `src/site/navigation/model.ts`
- Modify: `src/site/shell/navigation.ts`
- Create: `test/site-navigation.test.mjs`

**Interfaces:**
- Produces `getPrimaryNavigationItems()` returning ordered `{ id, label, href }` entries.
- Produces `getBreadcrumbItems(page)` returning ordered breadcrumb entries.
- `renderSiteNavigation(page)` consumes those helpers and emits brand, breadcrumbs, trigger, panel, links, and active state.

- [ ] Write contract tests first for exact six menu items, no `Work`, no hidden Projects, canonical hrefs, breadcrumb labels, `aria-current`, `aria-expanded`, and `aria-controls`.
- [ ] Run the targeted test and confirm RED because the navigation model/markup does not exist yet.
- [ ] Implement the minimal data model using page IDs from `sitePages`; keep `/cv/` as the one explicit static destination.
- [ ] Replace the current `looksawful + Work` renderer with the new accessible shared markup.
- [ ] Run the targeted test and confirm GREEN.
- [ ] Commit the model/render change.

### Task 2: Menu runtime behavior

**Files:**
- Create: `src/components/site-navigation.ts`
- Modify: `src/main.js`
- Create: `test/site-navigation-runtime.test.mjs`

**Interfaces:**
- Produces `initSiteNavigation(root?: Document | HTMLElement): () => void`.
- Consumes `[data-site-navigation]`, `[data-site-menu-toggle]`, and `[data-site-menu]` rendered by the shell.

- [ ] Write runtime contract tests first for initial closed state, toggle, Escape close, focus return, link close, scroll lock, and destroy cleanup.
- [ ] Run targeted test and confirm RED.
- [ ] Implement the minimal DOM controller without viewport calculations.
- [ ] Mount it from `src/main.js` into the existing destroy stack.
- [ ] Run targeted tests and confirm GREEN.
- [ ] Commit runtime behavior.

### Task 3: Responsive visual layer

**Files:**
- Create: `src/styles/site-navigation.css`
- Modify: `src/styles/index.css`
- Keep: `src/styles/project-navigation-top.css` unchanged.

**Interfaces:**
- Styles `.site-nav`, `.site-nav__breadcrumbs`, `.site-nav__toggle`, `.site-nav__menu`, and menu link states emitted by the shell.

- [ ] Add a CSS contract test asserting the dedicated stylesheet is imported and that no legacy `.site-nav__list`/`Work` presentation remains in the shared renderer.
- [ ] Confirm RED before adding the stylesheet/import.
- [ ] Implement sticky header, 44px trigger, full-viewport white menu surface, fluid menu type, focus-visible and reduced-motion behavior using existing tokens/logical properties.
- [ ] Run targeted tests and typecheck; confirm GREEN.
- [ ] Commit visual layer.

### Task 4: Browser behavior and prototype parity

**Files:**
- Modify: `tools/smoke-mpa.mjs`
- Optionally create: `docs/prototypes/site-navigation.html` if a repository copy of the approved standalone prototype is useful.

**Interfaces:**
- Browser smoke exercises the real production menu on standalone MPA routes.

- [ ] Add smoke assertions at 390px and 1440px: trigger visible, menu opens, active destination correct, Escape closes, no horizontal overflow, and navigation links resolve.
- [ ] Confirm the new smoke fails against pre-feature markup if necessary via the test commit history; do not weaken existing media/interactivity checks.
- [ ] Run the complete MPA smoke through CI and fix only genuine navigation defects.
- [ ] Commit smoke coverage.

### Task 5: Full verification and production integration

**Files:**
- No intended product-code changes unless verification finds a genuine defect.

- [ ] Run/fetch fresh CI for the final head: `Verify site architecture`, `CodeQL`, and full `Verify changes` (`npm run verify`).
- [ ] Confirm PR #10 head matches the verified commit, base is `prod`, and `mergeable: true`.
- [ ] Mark PR ready for review.
- [ ] Merge PR #10 into `prod` using the repository's supported merge path.
- [ ] Confirm the GitHub Pages deployment for the resulting `prod` commit is GREEN.
- [ ] Check live `/`, `/work/jestei-pool/`, `/work/styx/`, `/work/sensetique/`, `/shootings/`, and `/cv/` for successful response and visible global navigation.
- [ ] Report the deployed commit and any remaining non-blocking follow-up separately.
