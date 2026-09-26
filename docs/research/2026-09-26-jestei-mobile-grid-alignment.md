# Jestei mobile promo grid alignment — 2026-09-26

## Question

Why does the mobile “Промо и коммуникации” sequence still look vertically misaligned even after the outer leading card and middle grid were made equal-height?

## Evidence

- Runtime structure is produced by `src/templates/media-group.ts`: the sequence contains one wide `.media`, a nested `.media-group__middle` grid, then another wide `.media`.
- `src/styles/media.css` gives the middle grid two auto rows with fixed-width cells via `--sequence-cell`.
- The current Jestei mobile override stretches the outer reel items. This equalizes the outer `.media` and `.media-group__middle` boxes, but it does not force each inner `.media__surface` in the two-row grid to consume the stretched row height.
- The previous browser assertion only compared outer boxes, so it could pass while the visible image surfaces ended on different baselines.
- CSS sizing defines stretch-fit sizing separately from preferred aspect-ratio sizing, so equal outer boxes do not imply equal painted media surfaces. Primary references:
  - https://www.w3.org/TR/css-sizing-3/
  - https://www.w3.org/TR/2026/WD-css-sizing-4-20260904/
  - https://www.w3.org/TR/css-grid/all/

## Debug contract

The mobile browser test must compare the bottom edge of the leading `.media__surface` with the bottom edge of the visible surfaces in the second middle-grid row, not only the parent figure boxes.

## Intended fix direction

Keep the existing sequence/reel architecture. Avoid a new layout primitive. Size the leading visible surface from the authored two-row sequence geometry (two `--sequence-cell` rows plus the existing group gap), so the visual edges align while desktop behavior remains untouched.
