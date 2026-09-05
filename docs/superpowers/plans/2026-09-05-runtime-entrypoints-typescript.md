# Runtime Entrypoints TypeScript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the shared runtime owners `src/main.js` and `src/interactive.js` to strict TypeScript without changing DOM behavior, selectors, timing, copy, CSS, analytics behavior, or public HTML entry URLs.

**Architecture:** Keep `/src/main.js` and `src/interactive.js` as one-line compatibility shims so existing HTML and runtime imports remain stable. Put the existing logic into `main.ts` and `interactive.ts` with type annotations only. Add narrow declarations only for lazy JavaScript modules that TypeScript cannot otherwise type.

**Tech Stack:** Vite, TypeScript strict mode, Node 24 tests, GitHub Actions, Playwright.

**Spec:** Current `dev` runtime behavior is authoritative; old PR #177 is reference material only and must not be merged or copied wholesale.

## Global Constraints

- No visual changes.
- No copy or semantic changes.
- No selector, DOM structure, timing, autoplay, analytics, navigation, filter, fit-scaling, lightbox, or media behavior changes.
- Do not consolidate the two Jestei fit functions during this migration.
- Do not add the old `event.target instanceof Element` behavior fix during this migration.
- Keep `/src/main.js` as the public HTML entry contract.
- Keep `src/interactive.js` import-compatible for existing tests/runtime callers.
- No `any`.
- Do not broaden TypeScript declarations beyond the APIs actually consumed by the shared runtime.

---

### Task 1: Move runtime ownership to TypeScript

**Files:**
- Create: `src/main.ts`
- Modify: `src/main.js`
- Create: `src/interactive.ts`
- Modify: `src/interactive.js`
- Create: `src/components/animated-canvas-gallery.d.ts`
- Create: `src/components/awful-cases-game.d.ts`
- Create: `src/components/jestei-theme-organism/jestei-theme-organism.d.ts`

**Interfaces:**
- `src/main.js` imports `./main.ts` and exports nothing.
- `src/interactive.js` re-exports `initSiteInteractive` from `./interactive.ts`.
- `initSiteInteractive({ root?: Document | HTMLElement }): () => void`.

- [ ] Copy current `src/main.js` logic to `src/main.ts` and add only required types.
- [ ] Preserve `initViewportAutoplayVideos` fallback and cleanup behavior exactly.
- [ ] Copy current `src/interactive.js` logic to `src/interactive.ts`; keep `initJesteiFilterFit` and `initJesteiThemeOrganismFit` separate.
- [ ] Replace the two `.js` files with one-line shims.
- [ ] Add narrow declarations for lazy JS modules.
- [ ] Open a draft PR and confirm the expected source-contract RED before changing tests.

### Task 2: Point source-contract tests at TypeScript owners

**Files:**
- Modify only current tests that read `src/main.js` or `src/interactive.js` for implementation-source assertions.
- Do not change tests whose purpose is to assert the public `/src/main.js` HTML entry URL or shim compatibility.

- [ ] Use the failing test output plus repository search to identify source-reading tests.
- [ ] Change only source-owner paths from `.js` to `.ts`.
- [ ] Keep every assertion body otherwise unchanged.
- [ ] Run Fast CI and strict typecheck/build until green.

### Task 3: Broad behavior verification

**Files:**
- Temporary only: `.github/workflows/runtime-ts-verify-once.yml` if the connector cannot dispatch a broad existing workflow at the feature SHA.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:unit`.
- [ ] Run `npm run build:site`.
- [ ] Run `npm run test:e2e:full` with Chromium and required media tooling/cache.
- [ ] Delete the temporary workflow before merge.
- [ ] Verify final diff contains no CSS, content, HTML entry URL, selectors, copy, or media asset changes.

### Task 4: Replace the stale migration PR

- [ ] Close old PR #177 as superseded only after the fresh branch passes verification.
- [ ] Make the fresh PR non-draft.
- [ ] Re-check current `dev` immediately before merge; if it advanced, rebuild/rebase rather than merging stale history.
