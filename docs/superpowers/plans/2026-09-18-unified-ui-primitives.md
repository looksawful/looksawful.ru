# Unified UI Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one production-backed CSS contract for controls, chips, badges and panels, document it in Storybook, and adopt it in representative existing UI without changing the site's architecture.

**Architecture:** A single `src/styles/primitives.css` file provides shared visual primitives on top of the existing tokens/colors and cascade. Native HTML/ARIA state is the public interface. Existing component owners keep local geometry and behavior while adding the shared primitive class.

**Tech Stack:** Vite 8, vanilla TypeScript/JavaScript, CSS cascade layers, Node test runner, custom Storybook/LAB.

**Spec:** `docs/superpowers/specs/2026-09-18-unified-ui-primitives-design.md`

## Global Constraints

- Do not add Tailwind, Material Web, React, Sass or CSS-in-JS to the production site.
- Do not edit authored user-facing copy.
- Do not create a second token namespace or duplicate canonical token values in Storybook.
- Do not replace specialized owner classes; compose them with the shared primitive.
- Use one feature branch only and push each coherent commit.
- Worktree lives outside `C:`.

---

### Task 1: Establish the public primitive contract

**Files:**
- Create: `test/ui-primitives-contract.test.mjs`
- Create: `src/styles/primitives.css`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: canonical variables from `tokens.css` and `colors.css`.
- Produces: `.control`, `.chip`, `.badge`, `.panel`; `data-variant`, `data-size`, `data-shape`, `data-level`; native disabled/focus/pressed states.

- [ ] **Step 1: Write the failing contract test**

The test must assert that `index.css` imports `primitives.css` once in `layer(components)`, that the four primitive selectors exist, and that control/chip state uses agreed attributes/native pseudo-classes.

- [ ] **Step 2: Run RED**

Run:
`node --test test/ui-primitives-contract.test.mjs`

Expected: FAIL because `src/styles/primitives.css` does not exist.

- [ ] **Step 3: Implement minimal shared CSS**

Use local custom properties derived from `--clr-bg`, `--clr-text`, `--clr-text-muted`, `--clr-border`, `--clr-border-strong`, `--clr-accent`, `--clr-on-accent`, existing radius/spacing/font tokens and no literal brand colors.

Required behavior:
- `.control`: inline-flex, touch-safe minimum block size, variants primary/secondary/quiet/danger, sm/md/lg, round shape, focus-visible, disabled, pressed.
- `.chip`: compact interactive pill, default/selected/disabled/focus states via `aria-pressed`.
- `.badge`: passive compact label without hover/active behavior.
- `.panel`: plain/raised/elevated surface levels with inherited typography.
- Hover styling only in `@media (hover: hover) and (pointer: fine)`.
- Reduced motion removes nonessential transitions.

- [ ] **Step 4: Run GREEN**

Run:
`node --test test/ui-primitives-contract.test.mjs`
`npm run lint:style -- --allow-empty-input`

Expected: PASS.

- [ ] **Step 5: Commit and push**

Commit:
`feat: add shared UI primitives`

### Task 2: Add canonical Storybook atom coverage

**Files:**
- Create: `src/lab/stories/ui-primitives.stories.mjs`
- Modify: `test/ui-primitives-contract.test.mjs`

**Interfaces:**
- Consumes: Task 1 CSS primitive contract.
- Produces: canonical atom stories showing real production classes and supported states.

- [ ] **Step 1: Extend the contract test first**

Assert the story declares:
- `layer: "atom"`
- `policy: "isolated"`
- `canonical: true`
- sources include `src/styles/primitives.css`
- interaction coverage names default, focus-visible, active-or-pressed, selected and disabled where relevant.

- [ ] **Step 2: Run RED**

Run:
`node --test test/ui-primitives-contract.test.mjs`

Expected: FAIL because the story is missing.

- [ ] **Step 3: Implement the story**

Create four groups in one atom story module:
- Controls: primary, secondary, quiet, danger, icon-only; sm/md/lg.
- Chips: neutral, selected, disabled.
- Badges: passive metadata examples.
- Panels: plain, raised, elevated.

Use semantic HTML only. Do not duplicate CSS values in the story.

- [ ] **Step 4: Run GREEN and LAB structural checks**

Run:
`node --test test/ui-primitives-contract.test.mjs test/lab-storybook-state-schema.test.mjs test/lab-design-system-inventory.test.mjs`
`npm run lab:build`

Expected: PASS.

- [ ] **Step 5: Commit and push**

Commit:
`feat: document UI primitives in Storybook`

### Task 3: Adopt controls in safe production owners

**Files:**
- Modify: `src/components/site-analytics-consent.ts`
- Modify: `src/styles/site-analytics-consent.css`
- Modify: `src/components/media-deck.ts` or its canonical renderer owner after inspection
- Modify: `src/styles/media-deck.css`
- Modify: `src/components/media-lightbox.ts` or its canonical renderer owner after inspection
- Modify: `src/styles/media-lightbox.css`

**Interfaces:**
- Consumes: `.control` primitive.
- Produces: existing owner-specific controls composed with the shared class; owner CSS retains only geometry/layout unique to that component.

- [ ] **Step 1: Characterize current markup with the existing tests**

Run the narrow existing tests for analytics consent, media deck and lightbox before changes. Record the exact passing commands from the repository test map.

- [ ] **Step 2: Add `control` to canonical markup**

Use `data-variant` and `data-shape` instead of copying shared visual declarations.

- [ ] **Step 3: Remove only declarations now owned by the primitive**

Keep positioning, size exceptions, z-index and component-specific geometry in owner stylesheets.

- [ ] **Step 4: Verify owner behavior**

Run the same narrow tests plus:
`node --test test/ui-primitives-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit and push**

Commit:
`refactor: adopt shared control primitive`

### Task 4: Adopt action links and safe chips without flattening Jestei

**Files:**
- Modify: `src/components/composition/resource-links.ts`
- Modify: the canonical Jestei renderer/style only if shared chip composition preserves all existing theme states
- Modify: associated owner CSS narrowly.

**Interfaces:**
- Consumes: `.control`, `.chip`, existing Jestei theme variables.
- Produces: shared base styling with Jestei-specific theme/state retained locally.

- [ ] **Step 1: Verify current resource/Jestei contracts**

Run:
`node --test test/lab-storybook-molecule-coverage.test.mjs test/jestei-theme-organism-mockup.test.mjs test/jestei-track-filter-layout.test.mjs`

- [ ] **Step 2: Add the shared class only where semantics match**

Resource links become `class="control ..."` with the existing owner class retained.

For Jestei, use `.chip` only on real interactive chip controls. Do not change badge-like passive content or authored color mapping.

- [ ] **Step 3: Remove duplicated base declarations only**

Do not rewrite Jestei layout or theme selectors.

- [ ] **Step 4: Verify**

Run the same three tests plus the primitive contract.

- [ ] **Step 5: Commit and push**

Commit:
`refactor: compose actions with UI primitives`

### Task 5: Validate inventory, visual system and final branch

**Files:**
- Update docs only if implementation diverged from the spec.
- Classify `test/ui-primitives-contract.test.mjs` as KEEP/MOVE/DELETE.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a verified branch suitable for review without CI/test-policy growth.

- [ ] **Step 1: Run focused quality gates**

Run:
`npm run typecheck`
`npm run lint`
`npm run lint:style`
`npm run css:check`
`npm run lab:build`
`node --test test/ui-primitives-contract.test.mjs`

- [ ] **Step 2: Run affected site build**

Run:
`npm run build:site`

Expected: PASS.

- [ ] **Step 3: Classify the new test**

Keep it only if it remains a cheap long-lived public-contract check and is not redundant. Do not add it to `test:fast` unless the repository policy explicitly justifies doing so.

- [ ] **Step 4: Review final diff**

Verify no authored copy changes, no new dependency, no framework/config drift, no unrelated files and no generated junk.

- [ ] **Step 5: Final commit/push if needed**

Push the exact verified HEAD to `origin/feat/design-system-primitives-20260918`.
