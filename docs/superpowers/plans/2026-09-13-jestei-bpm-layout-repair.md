# Jestei BPM Layout Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the Jestei Pool BPM Min/Max geometry at `>=768px` without changing mobile layout, runtime behavior, copy, or the audited outer BPM panel dimensions.

**Architecture:** Keep the canonical filter stylesheet and TypeScript untouched. The focused late-loaded `playlist-filter-workflow-layout.css` owns the wide-breakpoint correction, while Fast tests lock the CSS arithmetic and the existing production browser smoke gains a rendered Shadow DOM geometry check for both advanced and compact modes.

**Tech Stack:** TypeScript-rendered declarative Shadow DOM, layered CSS with container queries, Node test runner, Playwright browser smoke, Cloudflare Pages PR preview.

**Spec:** `docs/superpowers/specs/2026-09-13-jestei-bpm-layout-repair-design.md`

## Global Constraints

- Work only on `fix/jestei-bpm-field-geometry` / PR #804; do not merge or deploy production.
- Keep the outer wide BPM panel at `64px` height with `10px 12px` padding and a `44px` content row.
- Keep the first wide BPM grid column at `154px` and the existing outer column/gap structure unchanged.
- Preserve authored copy, TypeScript/runtime behavior, ARIA, tooltip logic, filter state semantics, slider behavior and rating behavior.
- Preserve the `<768px` mobile composition.
- Final release gate is manual inspection of the exact Cloudflare preview.

---

### Task 1: Replace declaration-only BPM tests with complete geometry contracts

**Files:**
- Modify: `test/jestei-track-filter-layout.test.mjs`

**Interfaces:**
- Consumes: `readLayoutCss()` and `renderJesteiTrackFilter(section)` already defined in the test.
- Produces: Fast contracts requiring a 154px horizontal field grid and a 44px vertical anatomy for both advanced and compact wide BPM fields.

- [ ] **Step 1: Write the failing Fast test**

Replace the current partial wide BPM assertions with assertions that require, inside the `>=768px` focused override:

```js
.bpm-group .tempo-fields {
  display: grid;
  grid-template-columns: 70px 6px 70px;
  gap: 4px;
  inline-size: 154px;
  block-size: 44px;
}

.bpm-group .tempo-fields label {
  inline-size: 70px;
  block-size: 44px;
  gap: 0;
}

.bpm-group .tempo-fields input {
  inline-size: 70px;
  block-size: 28px;
}
```

Require equivalent compact selectors separately, plus a `28px` separator aligned to the bottom/input row. Keep the existing initial `data-filter-advanced="true"` assertion.

- [ ] **Step 2: Run Fast CI and verify RED**

Run through the repository's PR Fast CI on the exact RED commit.

Expected: the new BPM geometry tests fail because the current focused override does not set `block-size: 44px` or zero the inherited label gaps.

- [ ] **Step 3: Do not touch production CSS yet**

Confirm the failure is specifically the missing vertical anatomy, not a syntax or test-discovery error.

---

### Task 2: Add rendered Shadow DOM BPM geometry coverage to browser smoke

**Files:**
- Modify: `tools/e2e/smoke-site.mjs`

**Interfaces:**
- Consumes: the existing homepage smoke, its viewport matrix, `assert()`, and the rendered `<playlist-filter-workflow>` open Shadow DOM.
- Produces: `verifyJesteiBpmLayout(page, label)`, a no-op on pages/component widths where the Jestei wide BPM layout is absent and a hard assertion at component widths `>=768px`.

- [ ] **Step 1: Add the rendered geometry helper**

Implement a helper that measures, for the visible advanced state:

```js
{
  fields: { width, height, top, right, bottom, left },
  labels: [...],
  inputs: [...],
  separator: {...},
  filterAdvanced: "true",
  shellWidth
}
```

The helper must enter `playlist-filter-workflow.shadowRoot`, verify the component shell is `>=768px`, and assert:

- field group width is approximately `154px`;
- field group height is approximately `44px`;
- both labels remain inside the field group's vertical bounds;
- both inputs are approximately `70x28px` and remain inside the field group;
- first input, separator and second input do not overlap horizontally;
- separator height is approximately `28px` and its vertical center matches the inputs.

Use a tolerance of `1px` for layout rounding.

- [ ] **Step 2: Exercise compact mode through the real toggle**

Click the Shadow DOM `.advanced-button`, wait for `data-filter-advanced="false"`, run the same rendered assertions against `.compact-bpm-fields`, then toggle back to advanced mode so the rest of smoke behavior sees the original state.

- [ ] **Step 3: Call the helper in `auditViewport`**

Call `verifyJesteiBpmLayout(page, label)` after hidden project media are revealed and the page is ready, before the generic overflow/media/lightbox checks.

- [ ] **Step 4: Verify browser RED on the Cloudflare PR Preview workflow**

Expected: remote Chromium smoke fails on the current exact rendered geometry because the wide advanced field group still inherits `62px` and/or its label stack exceeds the `44px` row.

---

### Task 3: Implement the minimal wide-breakpoint CSS repair

**Files:**
- Modify: `public/components/playlist-filter-workflow-layout.css`

**Interfaces:**
- Consumes: the canonical `>=768px` outer panel dimensions from `playlist-filter-workflow.css`.
- Produces: complete, non-overflowing advanced and compact Min/Max geometry inside the existing 44px content row.

- [ ] **Step 1: Repair the advanced field group**

In the focused `@container playlist-filter (inline-size >= 768px)` override, make the advanced group explicit:

```css
.bpm-group .tempo-fields {
    display: grid;
    grid-template-columns: 70px 6px 70px;
    gap: 4px;
    inline-size: 154px;
    block-size: 44px;
    align-items: end;
}

.bpm-group .tempo-fields label {
    inline-size: 70px;
    block-size: 44px;
    gap: 0;
}

.bpm-group .tempo-fields input {
    inline-size: 70px;
    block-size: 28px;
}
```

Keep the separator at `6x28px`, bottom-aligned and centered.

- [ ] **Step 2: Repair compact geometry independently**

Give `.compact-bpm-fields` the same 154x44 outer field geometry and set its labels to `44px` with `gap: 0`; retain 70x28 inputs and the 6x28 bottom-aligned separator. Do not change compact/mobile rules outside the wide container query.

- [ ] **Step 3: Run Fast CI and verify GREEN**

Expected: typecheck, BPM contracts, all Fast tests, repository structure and production build pass.

- [ ] **Step 4: Run Cloudflare PR Preview and remote Chromium smoke**

Expected: exact artifact build/deploy succeeds and `verifyJesteiBpmLayout` passes against the immutable public preview for both advanced and compact states.

---

### Task 4: Review the exact diff and refresh PR #804 evidence

**Files:**
- Modify: PR #804 metadata only.

**Interfaces:**
- Consumes: exact final head SHA and workflow evidence.
- Produces: a draft PR description that accurately states the root cause, TDD RED/GREEN evidence, changed files and verified preview URLs.

- [ ] **Step 1: Compare final head to PR base**

Confirm no changes to authored content, TypeScript runtime, canonical filter stylesheet, SEO files or production branch.

- [ ] **Step 2: Verify all required checks on the exact head**

Require green Fast CI, Dependency Review, CodeQL, PR Preview and remote browser QA.

- [ ] **Step 3: Update the PR description**

Document that the earlier 70px fix was incomplete because the actual 44px vertical row still inherited 62px/48px/50px internal stacks. Record the rendered browser regression check and the exact immutable Cloudflare preview.

- [ ] **Step 4: Stop before merge**

Leave PR #804 draft/open for manual visual approval. Do not merge to `dev` and do not backport to `prod` in this task.
