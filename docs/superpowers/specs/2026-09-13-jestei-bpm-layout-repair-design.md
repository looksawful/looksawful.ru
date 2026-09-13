# Jestei BPM layout repair design

## Problem

The Jestei Pool filter's BPM Min/Max controls are still visually broken at the `>=768px` component breakpoint even though previous fixes made the labels nowrap and widened the field tracks.

The root cause is contradictory geometry across the canonical stylesheet and the focused layout override:

- the wide BPM panel is fixed to `block-size: 64px` with `padding: 10px 12px`, leaving exactly `44px` of usable vertical space;
- the wide grid row is explicitly `44px`;
- the inherited advanced `.tempo-fields` remains `62px` tall;
- each advanced label has a `16px` line box, a `4px` gap, and a `28px` input, requiring `48px` inside a `44px` row;
- each compact label has a `16px` line box, a `6px` gap, and a `28px` input, requiring `50px` inside the same `44px` row;
- `.bpm-group` clips overflow, so this contradiction becomes visible as clipping/misalignment rather than harmless overflow;
- earlier fixes checked isolated declarations instead of the complete geometry budget.

## Required behavior

At component inline sizes `>=768px`:

1. Keep the audited outer BPM panel geometry unchanged: `64px` total height, `10px 12px` padding, `44px` content row.
2. Keep the audited first BPM column at `154px`.
3. Keep Min/Max symmetric inside that column and keep both labels on one line.
4. Keep both numeric inputs at `28px` height.
5. Fit label line + input exactly inside the `44px` content row, with no vertical overflow or clipping.
6. Keep the separator centered on the input row, not on the full label+input stack.
7. Apply the same visible geometry to the initial advanced state and the user-toggleable compact state without coupling unrelated runtime behavior.
8. Do not change authored copy, TypeScript behavior, ARIA, tooltips, filter state logic, slider behavior, rating behavior, outer panel dimensions, or the mobile layout below `768px`.
9. Do not touch production. Work remains on PR #804 until manual visual approval.

## Implementation boundary

The fix belongs in `public/components/playlist-filter-workflow-layout.css`, which is already the focused late-loaded layout override for this component. The canonical `public/components/playlist-filter-workflow.css` remains unchanged so the mobile baseline and broader component architecture are not disturbed.

The focused override explicitly makes the wide advanced and compact field groups `44px` tall, makes their labels `44px` tall with zero vertical gap, retains `28px` inputs, and retains the `154px` horizontal allocation (`70px 6px 70px` plus two `4px` gaps).

## Verification strategy

Repository testing policy treats a one-off responsive geometry reproduction as temporary rather than a permanent Fast or production-smoke contract. The repair therefore uses:

- a temporary Fast RED/GREEN assertion during development to prove the exact 44px overflow cause and the focused CSS repair;
- removal of that temporary assertion before final verification;
- the normal exact-head typecheck, Fast CI, repository structure contract and production build;
- exact-SHA Cloudflare PR Preview plus the existing remote Chromium smoke to ensure the candidate remains operational;
- direct visual inspection of the exact immutable Cloudflare preview at the real filter location as the responsive-layout acceptance evidence.

`tools/ci/run-tests.mjs` is intentionally not changed because another open PR owns work on that shared CI manifest, and the repository policy forbids parallel definitions of the same CI routing contract.

## Acceptance criteria

- Advanced BPM at `>=768px`: no wrap, no clip, no overlap, symmetric inputs, separator centered on input row.
- Compact BPM at `>=768px`: same geometry is defined by the focused wide override; no mobile-only gap or height leaks into the wide layout.
- Mobile `<768px`: unchanged because all new geometry remains inside the existing `>=768px` container query.
- Canonical component CSS and TypeScript runtime remain unchanged.
- Temporary development assertions are removed before final head.
- `npm run typecheck`, Fast CI, repository structure, production build, CodeQL, Dependency Review, Cloudflare PR Preview and remote Chromium smoke all pass on the exact final PR head.
- Manual Cloudflare preview remains the final visual release gate before merge.
