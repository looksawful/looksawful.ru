# Dev Baseline Workflow

The refactor treats the current `dev` rendering as the visual reference. The
first step is therefore measurement, not visual cleanup.

## Capture

```bash
npm run baseline:capture
```

This builds the Vite app, starts local `vite preview`, opens Chromium through
Playwright, and writes the current dev reference into `_local/baseline/dev/`.
That folder is ignored by git because screenshots are local review artifacts.

For a fast source-DOM baseline without PNG capture:

```bash
npm run baseline:capture:fast
```

The capture includes:

- full-page screenshots for the agreed desktop, tablet, and mobile viewports;
- screenshots for every visible top-level homepage section;
- interaction screenshots for horizontal scroll, lightbox, policy book,
  playlist filter, pet-project dialog, mobile navigation, and visible canvases;
- DOM order snapshots;
- computed-style snapshots for the page shell and visible sections.

By default the capture uses `prefers-reduced-motion: reduce` to make the visual
diff deterministic. Set `BASELINE_REDUCED_MOTION=0` when you explicitly need to
capture the animated state.

The current dev runtime can block Chromium screenshot capture because global
repair loops and runtime DOM mutations keep the renderer busy. When a screenshot
times out, the script records that fact in `manifest.json` and continues with the
source DOM contract. Use these flags to control the capture:

```bash
node scripts/capture-dev-baseline.mjs --viewports=mobile-390x844
node scripts/capture-dev-baseline.mjs --no-screenshots
node scripts/capture-dev-baseline.mjs --no-full-page
node scripts/capture-dev-baseline.mjs --interactions
```

`--interactions` is intentionally opt-in until the repair runtime is removed.
Without it, interaction screenshots are marked as skipped in the manifest.

## Check

```bash
npm run baseline:dom
npm run baseline:visual
```

`baseline:dom` compares the source DOM contract against
`_local/baseline/dev/`. Runtime computed-style snapshots are currently recorded
as skipped because browser-side `page.evaluate` can block on the existing
repair-loop runtime. Re-enable runtime computed snapshots after the repair layer
is removed.

`baseline:visual` captures the current rendering into `_local/baseline/current/`
and compares PNG files against the dev baseline. The default visual threshold is
`VISUAL_MAX_DIFF_RATIO=0.006`, with per-channel tolerance
`VISUAL_CHANNEL_THRESHOLD=28`.

## Architecture Budget

```bash
npm run check:architecture
```

This does not claim the current architecture is clean. It freezes the current
debt level for patterns called out in the refactor plan, such as `!important`,
runtime static HTML insertion, global `MutationObserver`, injected styles, and
repair/fix CSS files. During the refactor the budgets should only go down.
