# Jestei BPM Layout Repair Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` and the repository testing policy. Responsive bug reproductions are temporary unless they protect a broader long-lived contract.

**Goal:** Repair the Jestei Pool BPM Min/Max geometry at `>=768px` without changing mobile layout, runtime behavior, copy, or the audited outer BPM panel dimensions.

**Architecture:** Keep the canonical filter stylesheet and TypeScript untouched. The focused late-loaded `public/components/playlist-filter-workflow-layout.css` owns the wide-breakpoint correction. Use a temporary RED/GREEN assertion for development, then remove it and rely on the repository's normal exact-head gates plus exact Cloudflare visual evidence.

**Spec:** `docs/superpowers/specs/2026-09-13-jestei-bpm-layout-repair-design.md`

## Constraints

- Work only on `fix/jestei-bpm-field-geometry` / PR #804.
- Do not merge or deploy production.
- Keep the outer wide BPM panel at `64px` height with `10px 12px` padding and a `44px` content row.
- Keep the first wide BPM grid column at `154px`.
- Preserve authored copy, TypeScript/runtime behavior, ARIA, tooltips, filter state semantics, slider behavior and rating behavior.
- Preserve the `<768px` mobile composition.
- Do not modify the shared Fast-test manifest because PR #727 already changes that CI contract.
- Final release gate is manual inspection of the exact Cloudflare preview.

## Task 1: Prove the root cause before changing CSS

- [x] Inspect canonical and focused CSS end-to-end.
- [x] Identify the contradiction: wide outer panel leaves a `44px` row while advanced internals require `48px`, compact internals require `50px`, and advanced `.tempo-fields` still inherits `62px`.
- [x] Add a temporary BPM assertion to an already-routed Fast Jestei test rather than changing the shared Fast manifest.
- [x] Verify RED on exact head `bb297853bf332e38d39ab72cf4178b047458c6b2`.
- [x] Confirm typecheck passes before the expected Fast failure.
- [x] Confirm the failure is exactly the missing `44px` wide field height/zero-gap anatomy.

## Task 2: Implement the smallest CSS repair

- [x] Modify only `public/components/playlist-filter-workflow-layout.css` inside the existing `@container playlist-filter (inline-size >= 768px)` override.
- [x] Advanced fields: `154x44`, tracks `70px 6px 70px`, `4px` gaps, labels `70x44` with `gap: 0`, inputs `70x28`, separator `6x28` bottom-aligned.
- [x] Compact fields: define the same wide field budget independently so the compact mobile `6px` label/input gap cannot leak into the 44px row.
- [x] Leave canonical `playlist-filter-workflow.css`, TypeScript, text and mobile rules unchanged.
- [x] Verify GREEN on implementation head `01ee0b2425a455c356dd4fba64f5861b2d58b74f`: typecheck, Fast tests, repository structure and production build all pass.

## Task 3: Verify the rendered candidate

- [x] Publish exact implementation head to isolated Cloudflare Pages.
- [x] Verify immutable deployment identity and preview `noindex`.
- [x] Verify normal remote Chromium browser smoke passes.
- [x] Inspect the actual filter region in the immutable preview, not the top of the page or a stale alias.
- [x] Confirm visually that the advanced `BPM Min.` / `BPM Max.` labels are no longer clipped or colliding, the two 70px inputs align on one row, and the separator sits on the input axis.
- [ ] Human visual approval of the final exact-head preview remains required before merge.

Implementation-head preview used for visual proof:

`https://5d3286dc.looksawful-ru-preview.pages.dev/work/jestei-pool/`

## Task 4: Apply test lifecycle policy and finalize the PR

- [x] Remove the temporary RED Fast assertion after GREEN.
- [x] Revert the temporary wide BPM assertions in `test/jestei-track-filter-layout.test.mjs` to the PR-base version because they encode one-off implementation geometry and are not permanent Fast contracts.
- [x] Leave `tools/ci/run-tests.mjs` unchanged.
- [ ] Run all normal gates again on the exact cleanup/final head.
- [ ] Compare final head to PR base and confirm only the focused CSS plus planning/spec documentation remain changed.
- [ ] Update PR #804 description with root cause, RED/GREEN evidence, test lifecycle counts and final exact preview.
- [ ] Stop before merge. Production remains untouched.

## Test lifecycle

- `NEW PERMANENT TESTS: 0`
- `TEMPORARY TESTS REMOVED: 2` development assertion sets (the routed RED assertion and the wide BPM implementation assertions)
- `MOVED TO AFFECTED/FULL: 0`

The responsive acceptance proof is the exact Cloudflare candidate plus visual inspection, consistent with `docs/testing-policy.md`; the normal remote smoke remains a general runtime sanity check rather than a permanent archive of this specific UI bug.
