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
- earlier tests asserted CSS declarations but did not verify the rendered Shadow DOM geometry.

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

The focused override will explicitly make the wide advanced and compact field groups `44px` tall, make their labels `44px` tall with zero vertical gap, retain `28px` inputs, and retain the current `154px` horizontal allocation (`70px 6px 70px` plus two `4px` gaps).

## Verification

Two complementary regression layers are required:

- Fast CSS contract: verifies the `>=768px` override contains the complete 44px vertical anatomy and the 154px horizontal anatomy for advanced and compact BPM fields.
- Browser smoke: on real rendered Jestei markup, enters the open Shadow DOM, measures the advanced BPM fields, toggles to compact mode, measures compact fields, and fails if labels/inputs/separator escape the 44px field box, inputs are not 28px high, Min/Max overlap horizontally, or the separator is vertically off the input axis.

The browser check must use rendered rectangles, not merely inspect source declarations.

## Acceptance criteria

- Advanced BPM at `>=768px`: no wrap, no clip, no overlap, symmetric inputs, separator centered on input row.
- Compact BPM at `>=768px`: same guarantees after switching modes.
- Mobile `<768px`: unchanged.
- `npm run typecheck`, Fast CI, repository structure, production build, CodeQL, Dependency Review, Cloudflare PR Preview and remote Chromium smoke all pass on the exact PR head.
- Manual Cloudflare preview remains the final visual release gate.
