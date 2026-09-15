# Molecule Storybook browser evidence — 2026-09-15

Branch: `storybook/molecules-coverage`
Build-verification commit: `18a84473`
Baseline: `origin/storybook/coverage-ci` at `ee4874e9`

## Stories reviewed

- `02-molecules-media-figure--video-banner`
- `02-molecules-mockup--desktop-dark`
- `02-molecules-mockup--mobile-dark`
- `02-molecules-resource-links--editorial-guide`
- `02-molecules-resource-links--equipment-pdf`

## Viewports

- desktop: `1440x1000`
- tablet: `834x1112`
- mobile: `390x844`

## Result

All 15 story/viewport cases returned HTTP 200 with no page errors, console errors, broken images, or horizontal viewport overflow. The Media Figure video reached browser `readyState=4` without a media error at all three viewports.

## Static asset caveat

A raw `dist/lab/system` static server initially produced 404s for absolute production media URLs under `/pets/...` and `/media/generated/responsive/...`. This is a Storybook static-serving gap, not story-owned markup or data. For browser evidence, the smoke environment exposed the repository's real `public` assets and used the corresponding production source image as a temporary fallback where generated responsive derivatives were absent from this checkout.

The permanent harness fix is tracked in GitHub issue #882. Interactive Media Slider and Mockup Deck coverage remains deferred to GitHub issue #881 because those owners require `src/components/media-deck.ts` production runtime plus `play` evidence rather than static renderer snapshots.

## Build gates before browser review

- targeted molecule tests: 4/4 pass
- `npm run typecheck`: pass
- `npm run lab:inventory`: 96 sources, 11 stories, 0 structural errors; covered 10, partial 4, missing 79
- `npm run lab:system`: pass
- `npm run test:fast`: pass

Storybook build retained the known non-blocking `:target-current` parser warning and large-chunk warning already called out by the integrated roadmap.
