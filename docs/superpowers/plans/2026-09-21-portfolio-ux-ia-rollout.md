# Implementation Plan: Portfolio UX / IA rollout

## Overview

Implement the approved portfolio UX/IA model from `docs/superpowers/specs/2026-09-21-portfolio-ux-ia.md` without changing the domain meaning of Case, Project, Collection, or Engagement.

Target experience:
- Homepage: Hero → neutral Project index → exactly 3 Flagship Cases → 3–5 Featured entities.
- `/work/`: canonical Work index + closed Work Archive.
- Desktop primary nav: `work / gallery / cv`; identity returns home.
- Mobile: AwfulFace menu with the same primary links and Work shortcuts.
- Cases: compact Role / Task / Contribution / Result summary, then authored body.
- Projects and Collections use shorter type-appropriate intros.
- Gallery: visible h1, explicit 20–30-work curation, short series, contextual captions/labels.

Tasks are tracked in `tasks/todo.md`.

## Current repository facts

- `/work/` does not exist in `src/site/pages/manifest.ts`.
- Primary navigation currently contains home, gallery, 3 Cases, Shootings, and CV.
- Homepage already has:
  - the compact `projects-grid` card index;
  - compact individual Case previews for Jestei, Styx, Sensetique;
  - an existing smaller-card “Полезное” section suitable as a Featured presentation pattern.
- Current working Flagship set is already Jestei / Styx / Sensetique.
- Gallery is currently catalog-derived, has no visible h1, uses repeated `aria-label="Открыть изображение"`, and can expose more than the approved 20–30 curated items.
- Existing public-ready Project routes must not be auto-promoted. Publication remains explicit.
- `listed/indexable` stays owned by the SitePage manifest.
- Authored copy must not be invented during structural implementation.

## Architecture decisions

1. **Portfolio priority is presentation metadata, not domain type.**
   - Flagship is Case-only and exactly 3.
   - Featured can reference Case / Project / Collection.
   - Work Archive is an explicit manually approved presentation set.
   - No `MiniProject`, `HiddenProject`, or parallel domain entity is introduced.

2. **Add `/work/` as a first-class non-entity SitePage.**
   - Add SitePage id/type/renderer for Work index.
   - It is a Vite-built page, not a fake Project or Collection.
   - The page reads canonical SitePage/domain records rather than duplicating route metadata.

3. **Use one code-owned portfolio presentation contract.**
   Proposed owner: `src/site/pages/portfolio-presentation.ts`.
   It owns only:
   - Flagship page IDs;
   - Featured page IDs;
   - explicit Archive page IDs;
   - Work-menu shortcut IDs;
   - manual next-Case mapping.
   It validates duplicates, allowed entity types, counts, and canonical SitePage existence.

4. **Publication remains explicit and fail-closed.**
   - Archive membership never changes manifest discovery automatically.
   - A public Archive entry must already be explicitly `listed: true, indexable: true` in the manifest.
   - Hidden/unlisted routes stay hidden until separately approved.

5. **Reuse existing visual/component patterns before creating new ones.**
   - Project index: current project-card grid.
   - Flagship: current compact Case preview pipeline.
   - Featured/Archive: adapt existing small-card/subproject-card presentation rather than inventing another card system.
   - Archive disclosure: semantic `details/summary` styled to the existing accordion language, with progressive enhancement for session state.

6. **Navigation labels and primary navigation identities become separate concerns.**
   - Breadcrumb/home copy must remain available even when `home` is no longer a primary nav item.
   - Primary navigation becomes exactly `work / gallery / cv`.

7. **Gallery becomes explicitly curated.**
   - Catalog/showInCatalog remains a candidate source, not an automatic gallery publication mechanism.
   - Curation order and series membership are explicit.
   - A series contributes at most 3 selected gallery frames.
   - Current 5-item Jestei 3D series must be reduced to the approved maximum or split only if editorially justified.

## Dependency graph

```text
Approved UX/IA spec
      |
      v
Portfolio presentation contract
      |
      +----------------------+---------------------+
      |                      |                     |
      v                      v                     v
/work/ page model       Navigation topology   Homepage hierarchy
      |                      |                     |
      v                      v                     v
Archive disclosure      Responsive nav UI     Featured adapter
      |
      +------------------------------+
                                     |
                                     v
                           Discovery/indexability gate

Entity intro contract ---------------------> Case/Project/Collection pages
Manual next-case map ----------------------> Case footers

Explicit Gallery curation -----------------> Gallery renderer/lightbox

All slices --------------------------------> affected E2E + build + final verify
```

## Phase 1: Portfolio model and Work index foundation

### Task 1: Add the portfolio presentation contract

**Description:** Create one typed, code-owned presentation model for Flagship, Featured, Archive, Work shortcuts, and manual next-Case destinations. Keep it separate from canonical Case/Project/Collection domain records.

**Acceptance criteria:**
- [ ] Exactly 3 Flagship IDs are required and every Flagship resolves to a Case page.
- [ ] Featured accepts Case/Project/Collection and rejects duplicates across main tiers.
- [ ] Archive is explicit and rejects unknown/non-entity page IDs; no automatic derivation from `enabled`, useful-project state, or Media Catalog flags.

**Verification:**
- [ ] Focused contract test proves valid current Flagship set and invalid count/type/duplicate cases.
- [ ] `npm run typecheck`.

**Dependencies:** None.

**Files likely touched:**
- `src/site/pages/portfolio-presentation.ts` (new)
- `test/site-portfolio-presentation.test.mjs` (new CONTRACT, keep if it protects long-lived invariants)

**Estimated scope:** S.

### Task 2: Add the canonical `/work/` SitePage and renderer shell

**Description:** Add a first-class Work index page to the SitePage model, manifest, Vite renderer routing, and page shell. Do not model Work as a Project or Collection.

**Acceptance criteria:**
- [ ] `/work/` builds, deep-loads, has canonical metadata, and is listed/indexable.
- [ ] SitePage validation accepts the new Work page without weakening existing route rules.
- [ ] Work page renderer consumes canonical presentation/page data rather than hard-coded hrefs.

**Verification:**
- [ ] Focused page/manifest tests.
- [ ] `npm run typecheck`.
- [ ] `npm run build:site`.
- [ ] Manual/development request to `/work/` returns the Work page, not the homepage/404.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/site/pages/types.ts`
- `src/site/pages/manifest.ts`
- `src/site/build/site-pages-plugin.ts`
- `src/site/renderers/work-page.ts` (new)
- minimal Vite HTML input if required by current build convention

**Estimated scope:** M.

### Task 3: Render the main Work index from canonical portfolio entities

**Description:** Build the neutral Work index presentation using existing project-card/portfolio-card primitives and canonical page relations. Collection gets a quiet `Collection` type label; Case/Project do not.

**Acceptance criteria:**
- [ ] Main Work index contains the approved Flagship + Featured + Collection destinations without visually ranking them again.
- [ ] Every card href resolves through canonical SitePage data.
- [ ] No authored Case/Project/Collection copy is duplicated into a new content store.

**Verification:**
- [ ] Focused renderer/routing test.
- [ ] `npm run typecheck`.
- [ ] Browser check at mobile and desktop widths for overflow, focus, and link targets.

**Dependencies:** Tasks 1–2; final content requires Editorial Checkpoint A.

**Files likely touched:**
- `src/site/renderers/work-page.ts`
- `src/components/composition/portfolio-entity-card.ts` or a small adapter beside it
- `src/styles/work-index.css` (new)
- style entry/import owner
- focused renderer test

**Estimated scope:** M.

### Task 4: Implement the Work Archive disclosure and session state

**Description:** Add the closed-by-default Archive below the Work index. Use semantic disclosure markup and small preview cards, sorted by year newest-first. Persist open/closed state only in `sessionStorage`.

**Acceptance criteria:**
- [ ] Archive is closed on a fresh tab/session and usable with JavaScript disabled.
- [ ] Archive shows only explicitly approved Archive IDs and sorts newest-first.
- [ ] Open/closed state survives navigation within the same tab, but not as durable local preference.

**Verification:**
- [ ] Focused static/contract test for explicit IDs and order.
- [ ] AFFECTED browser check for keyboard toggle, session restore, and no-JS baseline.
- [ ] Reduced-motion behavior remains usable.

**Dependencies:** Tasks 1–3; final content requires Editorial Checkpoint A.

**Files likely touched:**
- `src/site/renderers/work-page.ts`
- `src/components/work-archive.ts` (new, only if JS state helper is needed)
- `src/styles/work-index.css`
- focused browser/contract test

**Estimated scope:** M.

### Checkpoint 1: Work foundation

- [ ] `/work/` builds and deep-loads.
- [ ] Main index uses canonical URLs.
- [ ] Archive is explicit, closed by default, keyboard-safe, and session-scoped.
- [ ] No previously unlisted Project became public implicitly.

## Editorial Checkpoint A: Approve portfolio membership before public promotion

This is an owner decision, not an inference from existing `live`/route state.

Required inputs:
- [ ] 3–5 Featured page IDs.
- [ ] Explicit Archive page IDs.
- [ ] Confirmation of which currently unlisted Project pages, if any, become listed/indexable.

Implementation may build the structure before this checkpoint, but must not publish guessed Featured/Archive membership.

## Phase 2: Navigation

### Task 5: Change navigation data/model to `work / gallery / cv`

**Description:** Decouple navigation-label IDs from primary-navigation IDs so Home can still label breadcrumbs/identity while primary navigation becomes Work, Gallery, CV. Add Work shortcuts from the portfolio presentation contract.

**Acceptance criteria:**
- [ ] Primary top-level model is exactly Work / Gallery / CV.
- [ ] Home label remains available for breadcrumbs/accessibility but is not a primary item.
- [ ] Work shortcuts resolve to the 3 current Flagship Cases + Shootings through canonical SitePages.

**Verification:**
- [ ] Navigation parser/model contract tests.
- [ ] `npm run typecheck`.
- [ ] Existing breadcrumb contracts remain green or are moved to their new canonical owner without weakening them.

**Dependencies:** Tasks 1–2.

**Files likely touched:**
- `src/site/navigation/primary.ts`
- `src/data/navigation.ts`
- `src/content/navigation.json`
- `src/site/navigation/model.ts`
- focused navigation contract test

**Estimated scope:** M.

### Task 6: Implement responsive desktop/mobile navigation behavior

**Description:** Desktop shows visible Work / Gallery / CV and a home identity. Work exposes accessible second-level shortcuts. Mobile keeps the AwfulFace menu and nests the same Work shortcuts. Do not create hover-only navigation.

**Acceptance criteria:**
- [ ] Desktop: primary links are persistently visible; identity returns home; Work shortcuts are keyboard/touch accessible.
- [ ] Mobile: AwfulFace opens/closes the menu, exposes Work / Gallery / CV, and exposes the same Work shortcuts.
- [ ] Existing focus return, Escape, inert main, body scroll lock, reduced motion, and preview safety remain correct.

**Verification:**
- [ ] `npm run test:e2e:navigation`.
- [ ] `npm run test:ui:responsive` after the structural nav change.
- [ ] Keyboard manual check: Tab, Enter/Space, Escape, focus return.
- [ ] Pointer/coarse-pointer check; no hover-only dependency.

**Dependencies:** Task 5.

**Files likely touched:**
- `src/site/shell/navigation.ts`
- `src/components/site-navigation.ts`
- `src/styles/site-navigation.css`
- navigation browser test
- Storybook/nav fixture only if the existing fixture is contractually maintained

**Estimated scope:** M.

### Checkpoint 2: Navigation

- [ ] Desktop and mobile navigation match the approved IA.
- [ ] Existing AwfulFace motion still respects reduced motion.
- [ ] No route/href is owned in two places.
- [ ] Navigation affected tests are green.

## Phase 3: Homepage hierarchy

### Task 7: Rewire homepage order without replacing working presentation patterns

**Description:** Preserve the current compact Project index, keep Jestei/Styx/Sensetique as large authored Flagship previews, and place a compact Featured block after Flagships. Do not render Archive on the homepage.

**Acceptance criteria:**
- [ ] DOM order is Hero → Project index → 3 Flagship previews → Featured.
- [ ] Exactly the Flagship IDs from the presentation contract receive large Case previews.
- [ ] Featured uses the approved 3–5 entities and existing small-card visual language.

**Verification:**
- [ ] Focused homepage renderer contract test for section order and counts.
- [ ] `npm run test:ui:responsive`.
- [ ] Browser check confirms no full hidden Case is rendered merely to hide it with CSS.

**Dependencies:** Task 1 + Editorial Checkpoint A.

**Files likely touched:**
- `src/site/pages/homepage.ts`
- `src/site/renderers/home/home-page.ts`
- `src/site/renderers/home/home-slots.ts`
- small Featured adapter/presentation file
- focused homepage test

**Estimated scope:** M.

### Task 8: Add Case summary, Project intro, and Collection intro presentation contracts

**Description:** Add type-appropriate compact intro blocks while preserving each entity body's unique composition. Structural work and authored copy population stay separate.

**Acceptance criteria:**
- [ ] Case pages render visible labels Role / Task / Contribution / Result before the authored body.
- [ ] Project pages use What / Role / Result-or-purpose; Collections use Role / Period / Contents.
- [ ] Missing editorial values fail safely without fabricated metrics/effects; no structural refactor edits unrelated authored copy.

**Verification:**
- [ ] Focused renderer/parser tests cover structure, escaping, and optional/missing fields without pinning editable wording.
- [ ] `npm run test:e2e:mpa`.
- [ ] `npm run test:e2e:projects`.

**Dependencies:** None for structure; final content requires Editorial Checkpoint B.

**Files likely touched:**
- existing typed intro/content contract owner
- existing Case editorial parser/adapter owner
- `src/templates/project-intro.ts` or a dedicated summary template
- `src/styles/project-header.css` or a dedicated intro-summary stylesheet
- focused contract test

**Estimated scope:** M.

## Editorial Checkpoint B: Approve intro copy

Required inputs:
- [ ] Jestei Case summary: Role / Task / Contribution / Result.
- [ ] Styx Case summary: Role / Task / Contribution / Result.
- [ ] Sensetique Case summary: Role / Task / Contribution / Result.
- [ ] Any Featured Project/Collection intro copy that is not already represented by approved existing text.

Rules:
- do not invent metrics;
- qualitative Result is allowed only when concrete and demonstrable.

### Task 9: Add manual next-Case routing

**Description:** Use the approved presentation contract to choose the next Case manually for semantic/visual contrast. Do not derive it from array position, year, or type.

**Acceptance criteria:**
- [ ] Each Flagship Case has one explicit next-Case target.
- [ ] Target exists, is public, and is not self.
- [ ] Footer link is rendered from canonical SitePage route data.

**Verification:**
- [ ] Contract test for mapping completeness/non-self/public destination.
- [ ] `npm run test:e2e:projects` focused path traversal.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/site/pages/portfolio-presentation.ts`
- entity/footer renderer owner
- footer style only if needed
- focused contract/browser test

**Estimated scope:** S.

### Checkpoint 3: Homepage + entity pages

- [ ] Homepage hierarchy matches the approved model.
- [ ] All 3 Flagship Case summaries are populated with approved copy.
- [ ] Project/Collection intro variants render correctly.
- [ ] Manual next-Case traversal works.

## Phase 4: Gallery curation and accessibility

### Task 10: Replace automatic Gallery inclusion with explicit curated selection

**Description:** Keep Media Catalog as the canonical asset source, but make public Gallery membership/order explicit. Model standalone items and short series, with a hard maximum of 3 selected frames per series.

**Acceptance criteria:**
- [ ] Gallery selection is explicit and contains 20–30 approved items total.
- [ ] No series contributes more than 3 selected image frames.
- [ ] `showInCatalog` and project membership can provide candidates but cannot silently publish an item into Gallery.

**Verification:**
- [ ] Focused curation contract test for count, duplicates, series max, asset existence, and stable order.
- [ ] `npm run typecheck`.
- [ ] Media Catalog integrity check only if media registry data itself changes.

**Dependencies:** Editorial Checkpoint C.

**Files likely touched:**
- `src/data/media/gallery.ts`
- optional dedicated typed curation source if keeping IDs separate improves readability
- focused gallery-data contract test

**Estimated scope:** S–M.

## Editorial Checkpoint C: Approve Gallery selection

Required inputs:
- [ ] 20–30 exact Gallery item IDs.
- [ ] Series grouping/title for selected short series.
- [ ] At most 3 frames selected per series, including the Jestei 3D group.

### Task 11: Add Gallery h1, quiet series context, contextual action names, and lightbox context

**Description:** Make Gallery scannable and accessible without turning it into a UI-heavy catalog.

**Acceptance criteria:**
- [ ] Visible page-level `h1` is rendered.
- [ ] Every interactive image has a contextual accessible name derived from approved item/series metadata, not the repeated generic label.
- [ ] Grid caption is minimal and available on hover/focus; lightbox shows work/series context and preserves the slide counter.

**Verification:**
- [ ] `test/gallery-renderer.test.mjs` updated as a lasting contract if appropriate.
- [ ] Gallery controller/lightbox Storybook/affected checks remain green.
- [ ] Keyboard browser check for card focus/open/close/return-focus.
- [ ] Reduced-motion and mobile layout check.

**Dependencies:** Task 10.

**Files likely touched:**
- `src/site/renderers/gallery-page.ts`
- `src/styles/gallery.css`
- `src/components/gallery/gallery-lightbox.ts`
- gallery renderer/affected test

**Estimated scope:** M.

### Checkpoint 4: Gallery

- [ ] Visible h1 exists.
- [ ] 20–30 approved works only.
- [ ] Short-series rule is enforced.
- [ ] Contextual accessible labels replace generic repeated labels.
- [ ] Lightbox context and keyboard behavior are correct.

## Phase 5: Discovery, verification, and documentation alignment

### Task 12: Apply explicit discovery changes for approved public Work entries

**Description:** After owner approval, change only the selected Archive/Featured project page discovery states. Keep all other existing direct-link-only pages unlisted/noindex.

**Acceptance criteria:**
- [ ] Every Work/Archive destination shown publicly has deliberate manifest discovery settings.
- [ ] No unapproved Project is added to sitemap/indexability.
- [ ] Sitemap, canonical metadata, and local links agree with the manifest.

**Verification:**
- [ ] `npm run build:site`.
- [ ] `npm run check:site-meta`.
- [ ] `npm run check:links`.
- [ ] Inspect generated sitemap for the exact approved set.

**Dependencies:** Editorial Checkpoint A + Tasks 2–4.

**Files likely touched:**
- `src/site/pages/manifest.ts`
- focused discovery/manifest test if an existing contract owner already covers this

**Estimated scope:** S.

### Task 13: Final affected verification and documentation sync

**Description:** Run the cheapest sufficient checks per subsystem, then the aggregate verification appropriate for this broad IA release. Update canonical page docs after the implementation exists.

**Acceptance criteria:**
- [ ] Typecheck, focused contracts, build, navigation/MPA/project/gallery affected suites are green.
- [ ] Responsive UI check covers the new desktop/mobile nav and Work page.
- [ ] Canonical docs describe `/work/`, new navigation ownership, and the approved public route set without stale statements.

**Verification:**
- [ ] `npm run typecheck`
- [ ] `npm run test:fast`
- [ ] `npm run build:site`
- [ ] `npm run test:e2e:navigation`
- [ ] `npm run test:e2e:mpa`
- [ ] `npm run test:e2e:projects`
- [ ] relevant Gallery affected/Storybook check
- [ ] `npm run test:ui:responsive`
- [ ] final `npm run verify`
- [ ] before release, production-configured gates only after merge/release scope is requested

**Dependencies:** Tasks 1–12.

**Files likely touched:**
- `docs/site-pages.md`
- `docs/agent-context/pages.md`
- test files only where a long-lived contract genuinely belongs

**Estimated scope:** S–M.

### Checkpoint 5: Ready for review

- [ ] All approved UX/IA requirements are represented in built output.
- [ ] No unapproved public promotion occurred.
- [ ] No authored copy was invented.
- [ ] No new test was retained without KEEP/MOVE/DELETE classification.
- [ ] New permanent tests protect only long-lived contracts.
- [ ] Branch is ready for code review; merge/release remains a separate explicit action.

## Parallelization opportunities

After Task 1 lands and its contract is stable:

**Safe in parallel**
- Work page renderer + Archive behavior (Tasks 2–4).
- Navigation model/UI (Tasks 5–6).
- Entity intro structure (Task 8).
- Gallery curation mechanics (Task 10, before final selection can use fixture/test curation only).

**Wait for shared contract / owner input**
- Homepage Featured population waits for Editorial Checkpoint A.
- Public discovery changes wait for explicit approval.
- Gallery production list waits for Editorial Checkpoint C.
- Case summary production copy waits for Editorial Checkpoint B.

**Keep sequential**
- Navigation model before navigation runtime.
- Gallery curation data before Gallery renderer/lightbox semantics.
- Public discovery changes before final sitemap/meta verification.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Presentation status leaks into domain model | High | Keep Flagship/Featured/Archive in one presentation-only module; validate canonical entity/page refs |
| Existing hidden/live Project state gets mistaken for publication approval | High | Explicit allowlist + owner checkpoint; never derive Archive from `enabled` or useful-project state |
| `/work/` duplicates homepage | Medium | Work page is compact index + Archive only; no long Case previews |
| Navigation rewrite breaks focus/inert/preview behavior | High | Split data topology and runtime tasks; preserve existing Escape/focus/reduced-motion contracts; run affected browser suite |
| Case summary work edits authored copy incidentally | High | Structural schema/rendering first; approved copy in separate editorial checkpoint |
| Gallery remains an implicit catalog dump | High | Explicit curated IDs, count/series contracts, no automatic `showInCatalog` publication |
| New UI tests bloat fast CI | Medium | Follow testing policy; temporary RED/GREEN tests removed unless they protect long-lived contract |
| Branch drifts while broad work runs | Medium | Re-read current `dev` before implementation and before integration; keep tasks vertically sliced |

## Open questions / required owner inputs

These are editorial selections, not architecture questions:

1. Exact 3–5 Featured entities.
2. Exact public Archive entities.
3. Which currently unlisted Project pages are approved for listed/indexable publication.
4. Exact 20–30 Gallery item IDs and short-series grouping.
5. Approved summary copy for the 3 Flagship Cases.

No further IA decision is required before structural implementation starts.
