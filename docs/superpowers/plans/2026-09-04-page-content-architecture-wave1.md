# Page Content Architecture Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the post-media architectural foundation for `PageContent → Section → ContentBlock` while preserving current routes, content, DOM behavior, media semantics, and visual output.

**Architecture:** Wave 1 is additive and split into four isolated ownership streams: typed composition contracts, generic content components, shared composition components, and runtime/style ownership. Existing consumers remain compatible through thin re-exports/aliases. A fifth integration branch combines the streams and fixes the one stale post-dedupe baseline assertion before page migration begins.

**Tech Stack:** Vite 8, TypeScript 7, Node 24, vanilla TS/JS, GSAP 3.15, Three.js r184, Playwright, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-04-page-content-section-content-block-architecture-design.md`

## Global Constraints

- Implementation base is `32febbccb7f49c8a6624f400f8c3c862fd7e5d02` (`feat(media): apply reviewed dedupe wave 1`).
- `MediaAsset` remains canonical file identity; `MediaEntry` remains contextual usage.
- New composition contracts reference `MediaEntryId`; no raw media paths are introduced.
- Current BASE output is the behavioral/visual authority; Wave 1 does not re-author page content.
- All existing finite block variants remain representable.
- No direct changes to `dev` or `prod`.

---

### Task 1: Repair the post-dedupe Shootings baseline assertion

**Files:**
- Modify: `test/shootings-data-isolation.test.mjs`

**Interfaces:**
- Consumes: physical dedupe result at `32febb...`.
- Produces: a baseline test whose expected imported Behance file count matches the approved deduped archive.

- [ ] **Step 1: Record the existing RED evidence**

Use workflow run `33911528537`, job `101148827277`: the test expects 80 Behance WebP files and receives 77 after approved dedupe.

- [ ] **Step 2: Update only the stale count assertion**

Change the expected physical imported Behance WebP count from `80` to `77` and update the assertion message to describe the post-dedupe archive.

- [ ] **Step 3: Verify via CI after the integration branch is pushed**

Expected: `shootings archive data stays isolated while the Collection route remains deployable` no longer fails on the physical file count.

### Task 2: Add canonical PageContent / Section / ContentBlock contracts

**Files:**
- Create: `src/content/contracts/ids.ts`
- Create: `src/content/contracts/content-block.ts`
- Create: `src/content/contracts/sections.ts`
- Create: `src/content/contracts/page-content.ts`
- Create: `src/content/contracts/index.ts`
- Create: `test/page-content-contracts.test.mjs`

**Interfaces:**
- Consumes: existing `MediaEntryId`, `ProjectIntroData`/future `EntityIntroData`, `SectionIntroData`, and existing block data types.
- Produces: `EntityPageId`, `SectionId`, `CONTENT_BLOCK_TYPES`, `SECTION_TYPES`, `ContentBlock`, `Section`, `EntityPageContent`.

- [ ] **Step 1: Write the contract vocabulary test**

Test that `CONTENT_BLOCK_TYPES` equals:

```js
[
  "media-figure",
  "media-group",
  "media-slider",
  "mockup",
  "mockup-deck",
  "justified-gallery",
  "before-after",
  "page-flip",
  "animated-canvas-gallery",
  "jestei-theme",
]
```

and `SECTION_TYPES` equals:

```js
["content", "project", "project-group", "specialized"]
```

Also assert neither vocabulary contains `custom`.

- [ ] **Step 2: Add the contract files**

Use wrapper shapes such as:

```ts
export interface MediaFigureBlock {
  type: "media-figure";
  data: MediaFigureData<MediaEntryId>;
}
```

`Section` must be a closed union of `ContentSection | ProjectSection | ProjectGroupSection | SpecializedSection`. `SpecializedSection` must be a closed union of named specialized section contracts, never `{ renderer: string }`.

- [ ] **Step 3: Add PageContent**

```ts
export interface EntityPageContent {
  pageId: EntityPageId;
  intro: ProjectIntroData;
  sections: readonly Section[];
}
```

`ProjectIntroData` is intentionally temporary at this isolated branch boundary; integration replaces it with the new `EntityIntroData` alias from the shared-composition stream without changing runtime behavior.

- [ ] **Step 4: Run typecheck and targeted contract test in CI**

Expected: no page consumers are migrated yet; contracts compile additively.

### Task 3: Move generic content renderers behind canonical component modules

**Files:**
- Create: `src/components/content/media-figure.ts`
- Create: `src/components/content/media-group.ts`
- Create: `src/components/content/media-slider.ts`
- Create: `src/components/content/mockup.ts`
- Create: `src/components/content/mockup-deck.ts`
- Create: `src/components/content/justified-gallery.ts`
- Create: `src/components/content/before-after.ts`
- Create: `src/components/content/page-flip.ts`
- Create: `src/components/content/index.ts`
- Modify the corresponding eight `src/templates/*.ts` files into thin re-exports.
- Modify only targeted renderer tests where import paths are intentionally validated.

**Interfaces:**
- Consumes: current renderer APIs unchanged.
- Produces: canonical `src/components/content/**` implementation paths while preserving old imports.

- [ ] **Step 1: Copy each renderer implementation to its canonical module and adjust only relative imports**
- [ ] **Step 2: Replace each legacy template implementation with `export * from "../components/content/<name>.ts";`**
- [ ] **Step 3: Confirm renderer exports and rendered HTML remain identical**
- [ ] **Step 4: Run targeted renderer tests, typecheck, and build in CI**

### Task 4: Introduce canonical shared composition names

**Files:**
- Create canonical modules under `src/components/composition/` for `entity-intro`, `portfolio-entity-card`, `project-teaser`, `section-intro`, `client-logo`, and `responsive-image`.
- Modify: `src/types/content.ts` to make `EntityIntro*` canonical and retain `ProjectIntro*` aliases.
- Modify only directly related presentation types required for `PortfolioEntityCardPresentation` and `ProjectTeaserPresentation`.
- Keep legacy `src/templates/project-intro.ts`, `project-card.ts`, `subproject-card.ts`, `section-intro.ts`, `client-logo.ts`, `responsive-image.ts` as compatibility entrypoints.

**Interfaces:**
- Produces: canonical `EntityIntroData`, canonical shared component module names, and target `ProjectTeaserPresentation` backed by canonical `ProjectId`/`MediaEntryId` where practical without page migration.

- [ ] **Step 1: Add `EntityIntro*` names and compatibility aliases**
- [ ] **Step 2: Move shared renderers to canonical component modules with legacy re-exports**
- [ ] **Step 3: Introduce semantic card/teaser presentation names without changing current page content**
- [ ] **Step 4: Run typecheck and targeted shared-renderer tests in CI**

### Task 5: Establish runtime/style ownership boundaries

**Files:**
- Create: `src/components/runtime/index.ts`
- Add canonical runtime facades only for existing shared engines that already have stable implementations.
- Modify `src/styles/**` only where ownership can be improved without changing cascade or values.
- Add/update targeted runtime/style contract tests as needed.

**Interfaces:**
- Runtime services remain lifecycle/state owners behind visual components; they do not become ContentBlock types.

- [ ] **Step 1: Classify current shared runtime modules and publish a stable runtime barrel/facade**
- [ ] **Step 2: Preserve global tokens vs component-local CSS custom properties**
- [ ] **Step 3: Avoid mechanical CSS splitting unless cascade equivalence is demonstrable**
- [ ] **Step 4: Run typecheck/build and targeted runtime/style tests in CI**

### Task 6: Integrate the four streams

**Files:**
- Integration branch only.

**Interfaces:**
- Consumes the final SHAs from the four isolated Wave 1 branches.
- Produces `WAVE1_INTEGRATED_SHA` suitable as the base for composition-runtime and page-migration waves.

- [ ] **Step 1: Merge/cherry-pick contract stream**
- [ ] **Step 2: Merge/cherry-pick generic content component stream**
- [ ] **Step 3: Merge/cherry-pick shared composition stream**
- [ ] **Step 4: Merge/cherry-pick runtime/style stream**
- [ ] **Step 5: Replace the temporary `ProjectIntroData` PageContent dependency with canonical `EntityIntroData`**
- [ ] **Step 6: Run the integration verification profile**

Integration verification target:

```text
npm run typecheck
npm run test:fast
npm run test:media:contract
npm run build:site
```

Then use the repository's smoke/affected E2E workflow appropriate for the combined scope. Full page migration begins only after this branch is green.
