# Pet Projects Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Pet Projects safely extensible to 14 approved project identities, support typed `NEW` and non-clickable `COMING SOON`, keep unfinished projects hidden, correct the four approved card texts, and provide a production-like preview without redesigning the live homepage in this wave.

**Architecture:** Keep editorial copy in `src/content/editorial/useful-project-cards.json`, code-owned lifecycle/route/media identity in `src/data/content/useful-projects.ts`, renderer-facing discriminated card data in `src/data/pet-project-cards.ts`, and semantic rendering in `src/templates/subproject-card.ts`. Hidden projects exist only in the code registry and do not require copy, cover or route until promoted. A temporary preview route may reuse the same model and production CSS plus isolated prototype composition CSS.

**Tech Stack:** TypeScript 7, Vite 8, modern CSS/container queries, Node test runner, existing Media Catalog and site-page manifest.

**Spec:** `docs/superpowers/specs/2026-09-16-pet-projects-architecture-design.md`

## Global Constraints

- Branch from exact current `prod` SHA; do not modify shared `prod` history directly.
- Preserve the live Pet Projects visual design in this wave; prototype visual experiments stay isolated.
- CSS owns responsive layout. No JS geometry calculations.
- Do not publish routes or cards for hidden future projects.
- `NEW` is manual; `COMING SOON` is derived from lifecycle state.
- No placeholder production media.
- Keep tests consistent with `docs/testing-policy.md`; development-only RED/GREEN tests are removed unless they protect a durable contract.

---

### Task 1: Lock the lifecycle contract with a focused test

**Files:**
- Create: `test/pet-project-card-architecture.test.mjs`
- Read: `src/data/content/useful-projects.ts`
- Read: `src/data/pet-project-cards.ts`
- Read: `src/templates/subproject-card.ts`

**Interfaces:**
- Produces a durable structural contract around states and semantic clickability.

- [ ] **Step 1:** Add a test that asserts the registry includes the 14 approved IDs, future IDs are `hidden`, the obsolete `awful-3d-mockups` identity is absent, and hidden definitions do not carry `href`/`coverEntryId`.
- [ ] **Step 2:** Add renderer-source assertions that `coming-soon` returns `<article>` and live returns `<a>`, while badge vocabulary is code-owned.
- [ ] **Step 3:** Run the focused test and confirm RED against the current implementation.

### Task 2: Deepen the project-definition module

**Files:**
- Modify: `src/data/content/useful-projects.ts`
- Modify: `src/data/pet-project-cards.ts`

**Interfaces:**
- Produces `UsefulProjectState`, `UsefulProjectBadge`, `UsefulProjectDefinition`, `USEFUL_PROJECT_DEFINITIONS`, and renderer-ready `petProjectCards`.

- [ ] **Step 1:** Replace `visible + state` with the discriminated `state` union.
- [ ] **Step 2:** Add the 14 approved IDs. Keep the ten future IDs `hidden` with no route/cover requirement.
- [ ] **Step 3:** Keep current live definitions for Awful Cases, Moves Awful and Berserk Timer; keep AWFUL STUDIO non-public until its page promotion is complete.
- [ ] **Step 4:** Restrict manual card badge to `"new"` and derive display text in the renderer.
- [ ] **Step 5:** Change editorial parsing so only non-hidden definitions require card copy.
- [ ] **Step 6:** Run the focused test and typecheck contract; confirm GREEN.

### Task 3: Correct current public card copy and remove unfinished public cards

**Files:**
- Modify: `src/content/editorial/useful-project-cards.json`

**Interfaces:**
- Consumes non-hidden project IDs from Task 2.

- [ ] **Step 1:** Replace the four approved descriptions exactly with owner-approved text.
- [ ] **Step 2:** Remove role/year text if present.
- [ ] **Step 3:** Remove editorial records for hidden projects so unfinished copy cannot accidentally publish.
- [ ] **Step 4:** Keep section heading `Полезное`; do not introduce new marketing copy.
- [ ] **Step 5:** Run build/content validation.

### Task 4: Make renderer state semantics explicit

**Files:**
- Modify: `src/templates/subproject-card.ts`
- Modify only if required: `src/styles/subproject-cards.css`

**Interfaces:**
- Live cards render anchors.
- Coming-soon cards render articles.
- `new` renders `NEW`.
- `coming-soon` renders `COMING SOON` from state.

- [ ] **Step 1:** Replace arbitrary badge rendering with typed label mapping.
- [ ] **Step 2:** Preserve existing media, caption, reveal and external-link behavior.
- [ ] **Step 3:** Add only state-specific CSS required for semantic/non-clickable presentation; do not redesign layout.
- [ ] **Step 4:** Run focused test and typecheck.

### Task 5: Build the production-like preview harness

**Files:**
- Create: `src/prototypes/pet-projects-preview.ts`
- Create: `src/styles/pet-projects-preview.css`
- Create: `prototypes/pet-projects/index.html`
- Modify temporarily: `src/site/pages/manifest.ts` only if the existing preview build requires an explicit Vite input.

**Interfaces:**
- Reuses production card data/renderer semantics and production stylesheet ownership.
- Adds no runtime dependency to the production homepage.

- [ ] **Step 1:** Render the four current project states plus explicit demo rows for `NEW` and `COMING SOON` without mutating production data.
- [ ] **Step 2:** Implement prototype-only mobile reel with scroll snap, intrinsic card width, centered emphasis as progressive enhancement, 2-column intermediate layout and 4-column wide layout.
- [ ] **Step 3:** Add `prefers-reduced-motion` fallback and no-JS layout fallback.
- [ ] **Step 4:** Ensure prototype links to existing canonical project pages only; unfinished routes remain absent.
- [ ] **Step 5:** Build on PR preview and inspect at representative mobile/intermediate/desktop sizes.

### Task 6: Prepare AWFUL STUDIO promotion without publishing an incomplete page

**Files:**
- Review: `src/content/pages/projects/awful-studio.ts`
- Review: `src/data/content/awful-studio.ts`
- Review: `src/site/pages/manifest.ts`
- Review relevant media registry files.

**Interfaces:**
- Keeps `project:awful-studio` disabled until page media/content is sufficient.

- [ ] **Step 1:** Confirm existing domain/page/presentation contracts compile while route is disabled.
- [ ] **Step 2:** Do not flip AWFUL STUDIO to live unless the page has real registered media and a production-credible body.
- [ ] **Step 3:** Record the smallest remaining promotion requirements in the PR description instead of inventing assets.

### Task 7: Final verification and cleanup

**Files:**
- Delete temporary tests if they do not qualify as durable contracts.
- Remove prototype-only manifest wiring before production merge if the owner wants the prototype retained only in preview.

- [ ] **Step 1:** Run focused architecture test.
- [ ] **Step 2:** Run `npm run typecheck`.
- [ ] **Step 3:** Run `npm run test:fast`.
- [ ] **Step 4:** Run `npm run build:site`.
- [ ] **Step 5:** Inspect PR diff against fresh `prod` and confirm no unrelated drift.
- [ ] **Step 6:** Classify tests as KEEP/MOVE/DELETE.
- [ ] **Step 7:** Report `NEW PERMANENT TESTS`, `TEMPORARY TESTS REMOVED`, and `MOVED TO AFFECTED/FULL` counts.
- [ ] **Step 8:** Merge/deploy only after exact-head CI and preview are green and the production diff contains only approved changes.
