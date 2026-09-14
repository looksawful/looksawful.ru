# Compact Homepage Rollout Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the approved #834 production release safely, then remove the architectural/process debt exposed by the Lab → dev → prod rollout.

**Architecture:** Keep canonical project content immutable and express compact/standalone differences as typed presentation policy. Keep Lab/Storybook isolated from product branches. Promote approved product changes through exact-SHA PRs and narrow prod backports that preserve prod-only work.

**Tech Stack:** TypeScript, Vite 8, Node test runner, Storybook Lab, GitHub Actions, Cloudflare Pages.

**Spec:** GitHub #834 plus audit/retro #868 and follow-ups #869–#873.

## Global Constraints

- Never wholesale-merge `lab` or `dev` into `prod`.
- Preserve prod-only Berserk Timer behavior during #834 backport.
- Keep `/shootings/` technical route; visible identity is `Съёмки`.
- Canonical full-case content/media must not be deleted to implement temporary presentation hiding.
- Lab-only stories/assets/workflows must not enter normal dev/prod candidates.
- Exact-SHA preview and Remote Browser QA are mandatory before prod merge.
- Use a roomy explicit TEMP/TMP root on `A:` for local agent verification.

---

### Task 1: Complete the #834 production backport (#869)

**Files:**
- Modify: `src/styles/project-shell.css`
- Verify: `test/site-homepage-presentation.test.mjs`
- Verify: `test/homepage-compact-curation-834.test.mjs`

**Interfaces:**
- Consumes: existing `.project-preview-entry*` markup from `src/site/renderers/home/home-page.ts`.
- Produces: approved responsive CTA presentation in the narrow prod release.

- [ ] **Step 1: Reproduce the release failure**

Run on the fresh prod-based release branch:
```powershell
$env:TEMP='A:\Temp\looksawful-release-834'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
node --test test/site-homepage-presentation.test.mjs
```
Expected: CTA sizing/style assertion fails before the fix.

- [ ] **Step 2: Add only the approved CTA rules**

Copy only these selectors from the approved dev implementation, not unrelated typography changes:
```css
.project-preview-entry { ... }
.project-preview-entry__link { ... }
.project-preview-entry__link:focus-visible { ... }
.project-preview-entry__arrow { ... }
.project-preview-entry__link:is(:hover, :focus-visible) .project-preview-entry__arrow { ... }
@container project (width > 50rem) { .project-preview-entry__link { ... } }
```

- [ ] **Step 3: Verify targeted contracts**

Run:
```powershell
node --test test/site-homepage-presentation.test.mjs test/homepage-compact-curation-834.test.mjs
```
Expected: PASS.

- [ ] **Step 4: Verify release candidate with explicit temp root**

Run:
```powershell
npm run test:fast
npm run typecheck
npm run media:sync
npm run build
```
Expected: all PASS; `site:postbuild` reports clean local links.

- [ ] **Step 5: Review release diff and promote**

Run:
```powershell
git diff --check origin/prod..HEAD
git diff --name-status origin/prod..HEAD
```
Confirm no `src/lab/**`, Lab workflows/assets, or unrelated dev typography changes. Push, open prod PR linked to #869, require all exact-SHA checks and Remote Browser QA, merge, then verify live `/`, `/work/styx/`, `/shootings/`.

---

### Task 2: Replace regex caption stripping with renderer-native presentation (#870)

**Files:**
- Modify: `src/site/renderers/entity/content-block.ts`
- Modify component renderers under `src/components/content/**` that expose captions/heads.
- Modify: `src/site/renderers/entity/section.ts`
- Test: create/extend a renderer contract under `test/` for visual-only block families.

**Interfaces:**
- Consumes: `ContentBlockRenderOptions.suppressCaptions` / compact `visualOnly` intent.
- Produces: typed component-level visible-caption control while preserving alt/ARIA semantics.

- [ ] **Step 1: Write failing tests for every caption-capable block family**

Cover at minimum: media-figure, media-group, mockup, mockup-deck, media-slider, justified-gallery, before-after, page-flip, animated-canvas-gallery. Each test renders once normally and once with caption suppression; normal keeps visible captions, suppressed removes only visible editorial caption/head markup.

- [ ] **Step 2: Run the new tests and confirm RED**

Run the exact new test file with `node --test`.
Expected: current regex/incomplete coverage fails at least one family.

- [ ] **Step 3: Add typed renderer options**

Add component-level options such as:
```ts
interface VisibleCopyOptions {
  showCaption?: boolean;
  showGroupHead?: boolean;
}
```
Pass these through the existing render functions instead of editing rendered HTML strings.

- [ ] **Step 4: Remove regex stripping**

Delete `stripFigureCaptions`, `stripMediaGroupHead`, and regex-based caption removal from the generic block renderer. Keep accessible media labels intact.

- [ ] **Step 5: Verify compact/full behavior**

Run renderer tests, #834 contracts, Fast CI, typecheck, build. Confirm full standalone pages retain captions unless presentation policy explicitly suppresses them.

---

### Task 3: Move standalone visibility overrides into typed page presentation (#871)

**Files:**
- Modify: `src/site/pages/entity-presentation.ts` or create an adjacent focused `src/site/pages/entity-content-presentation.ts`.
- Modify: `src/site/renderers/entity-page.ts`
- Test: new presentation-policy unit test plus existing #834 tests.

**Interfaces:**
- Produces a generic policy shape, for example:
```ts
interface EntityContentPresentationPolicy {
  hiddenSectionIds?: readonly string[];
  intro?: {
    showHead?: boolean;
    showSummary?: boolean;
    showLead?: boolean;
    showLinks?: boolean;
  };
  sectionCopy?: 'full' | 'visual-only';
  captions?: 'show' | 'hide';
}
```

- [ ] **Step 1: Add failing policy tests**

Assert policy resolution for `case:jestei-pool`, `case:styx`, and `collection:music-photography` without invoking generic renderer branches.

- [ ] **Step 2: Define the typed policy registry**

Encode current approved temporary behavior in presentation metadata. Keep #835/#836 restoration as simple policy changes later.

- [ ] **Step 3: Make `entity-page.ts` generic**

Replace page-ID-specific helpers/branches with `applyEntityContentPresentation(content, policy)` and generic shell options.

- [ ] **Step 4: Verify canonical data is unchanged**

Tests must assert hidden Styx/Shooting copy/sections still exist in the canonical content registry.

- [ ] **Step 5: Run Fast CI/typecheck/build**

Expected: no visible behavior change from approved #834 output.

---

### Task 4: Add Lab → dev → prod promotion preflight (#872)

**Files:**
- Create: `tools/release/check-promotion.mjs`
- Create: `test/release-promotion-preflight.test.mjs`
- Modify: relevant CI runner/workflow only if the repository contract supports it.
- Modify: `docs/site-operations.md`.

**Interfaces:**
- CLI inputs: base ref, approved source ref, candidate ref, optional explicit temp root.
- Output: pass/fail plus categorized findings for Lab-only leakage, missing dependent product files, and prod-only touched-file drift.

- [ ] **Step 1: Write fixture tests**

Fixtures must fail for: `src/lab/**` in prod candidate; CTA markup without required CTA CSS; candidate replacing a prod-only touched-file change. A clean narrow backport must pass.

- [ ] **Step 2: Implement the smallest deterministic checker**

Use Git diff/tree metadata only. Do not mutate branches, generate media, or merge refs.

- [ ] **Step 3: Add explicit temp-root support to agent verification docs/scripts**

Use `TEMP`/`TMP` rather than assuming system temp capacity.

- [ ] **Step 4: Wire as a pre-PR/release verification command**

Keep exact-SHA PR Preview and Remote Browser QA as the final authority.

- [ ] **Step 5: Verify against #834 history**

The checker should flag the historical Lab Storybook leakage and missing CTA CSS candidate while accepting the corrected release.

---

### Task 5: Keep Lab Storybook synchronized without promoting it (#873)

**Files:**
- Modify Lab-only story/verification files on the `lab` branch.
- Do not add Lab stories to normal dev/prod release candidates.

**Interfaces:**
- Story imports the real `renderCompactHomepageEntity` and `homepageEntries`.
- Lab artifact records exact build/revision identity.

- [ ] **Step 1: Add/extend a Lab contract**

Assert compact Jestei/Styx/Sensetique stories import the real renderer and remain present in the Lab build.

- [ ] **Step 2: Add revision provenance**

Expose the exact product renderer/source SHA used for the Lab review artifact.

- [ ] **Step 3: Verify Lab-only boundary**

Promotion preflight must reject the story from prod/dev product candidates while Lab CI requires it.

- [ ] **Step 4: Build and deploy Lab**

Run isolated Lab + Storybook build, inventory, links, exact-SHA deployment checks.

- [ ] **Step 5: Close the audit loop**

Update #868 with final PRs/SHAs, close completed subissues, and close #834 only after live prod verification succeeds.