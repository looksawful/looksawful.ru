# Storybook state and visibility model

## Purpose

Storybook state metadata must describe production evidence, not invent a second component API. The source of truth remains the renderer, runtime, authored data and CSS used by the site. `/lab/` remains the real-route/page workbench; Storybook `/lab/system/` is the isolated state/composition catalogue.

The machine-readable contract lives in `tools/lab/storybook/state-schema.mjs`. It validates `parameters.looksawful` and is intentionally LAB-only.

## Separation of concerns

`state` is a stable kebab-case story-variant label such as `menu-open`, `caption-overlay-hover` or `loading`.

The structured axes explain why that variant exists:

- `visibility`: visual inclusion/reveal mechanism, not SEO/discovery.
- `interaction`: user-interaction state.
- `data`: asynchronous or content-availability state.
- `motion`: animation lifecycle or reduced-motion state.
- `responsive`: review viewport coverage plus exact authored conditions when they materially change behavior.
- `routeDiscovery`: route listing/indexing only. It must never be used as a synonym for DOM/CSS hidden state.

## `parameters.looksawful` contract

```js
parameters: {
  looksawful: {
    sources: ["src/components/site-navigation.ts", "src/site/shell/navigation.ts"],
    layer: "organism",
    policy: "behavior-fixture",
    canonical: true,
    state: "menu-open",
    visibility: ["disclosure", "input-capability"],
    interaction: ["open", "focus-visible"],
    data: ["ready"],
    motion: ["motion-enabled", "reduced-motion"],
    responsive: {
      review: ["desktop", "tablet", "mobile"],
      conditions: ["(hover: hover) and (pointer: fine)"],
    },
  },
}
```

Required fields are `sources`, `layer`, `policy`, `canonical`, `state` and `visibility`. Other axes are optional and should be omitted when there is no production evidence for them.

### Layer

Allowed values: `foundation`, `atom`, `molecule`, `organism`, `template`, `page`, `motion`, `experimental`.

This is the Storybook catalogue layer. It is deliberately different from source kind. A story can cite both a template and a runtime in `sources` while still being one `molecule`.

### Policy

Allowed values: `isolated`, `composition`, `page`, `behavior-fixture`, `experimental`.

`behavior-fixture` is for runtime behavior that needs a minimal real-contract fixture. `experimental` does not count as canonical production coverage merely because the story renders successfully.

### Visibility

Allowed values:

- `always`: no production visibility gate for this story surface.
- `breakpoint`: authored viewport threshold changes visibility.
- `conditional`: runtime or authored boolean condition includes/removes/reveals the surface.
- `disclosure`: open/closed UI such as a menu or expandable control.
- `overlay`: dialog/lightbox/caption/other layered surface.
- `data`: content/data availability controls whether the surface exists or renders content.
- `feature-or-experiment`: feature/experiment gate, when one exists in production.
- `offscreen-or-virtualized`: viewport/intersection/virtualization controls active presentation.
- `input-capability`: pointer/hover capability changes availability or visibility.

`route-discovery` is intentionally not a visibility value. A route can be unlisted and non-indexable while its rendered page remains fully visible.

### Interaction

Allowed values: `default`, `hover`, `focus-visible`, `active-or-pressed`, `selected`, `disabled`, `open`, `closed`.

Use only states with a real selector, DOM attribute or runtime branch. Do not add hover/focus stories to every component by ritual.

### Data

Allowed values: `loading`, `ready`, `empty`, `error`, `partial`, `unavailable`.

These describe real production states. A static renderer with complete authored content usually does not need a data axis at all.

### Motion

Allowed values: `motion-enabled`, `reduced-motion`, `initial`, `active`, `settled`, `exit`.

`motion-enabled` and `reduced-motion` are environment variants. Lifecycle values are used only when the production runtime exposes a meaningful visual phase.

### Responsive

`responsive.review` uses the LAB review presets `desktop`, `tablet`, `mobile`. These are review targets, not CSS breakpoints.

`responsive.conditions` stores exact authored conditions such as `(hover: hover) and (pointer: fine)` or `(max-width: 42rem)`. Do not infer a breakpoint from a review viewport and do not convert a pointer-capability query into a width breakpoint.

### Route discovery

```js
routeDiscovery: {
  listed: false,
  indexable: false,
}
```

This mirrors route discovery facts when the story represents a page/route. It does not mean the page is visually hidden. `src/site/pages/manifest.ts` proves this distinction: `project:awful-cases`, `project:moves-awful`, `project:berry-social-content-2020` and `not-found` are enabled renderable routes while `listed` and `indexable` are false.

## Evidence matrix for high-risk owners

| Owner | Production evidence | State axes to model | Notes |
| --- | --- | --- | --- |
| Site navigation | `src/components/site-navigation.ts`, `src/site/shell/navigation.ts`, `src/styles/site-navigation.css` | disclosure, open/closed, focus-visible, input-capability, motion, responsive condition | Runtime toggles `aria-expanded`, `data-menu-open` and `menu.hidden`; preview is unavailable on non-precise pointers. |
| Project navigation dock | `src/components/project-navigation.ts`, `src/styles/project-navigation.css` | conditional, offscreen-or-virtualized, selected | `IntersectionObserver` controls `data-project-nav-docked`, inertness and `aria-hidden`; active project link uses `aria-current`. |
| Media deck | `src/components/media-deck.ts`, `src/styles/media-deck.css` | selected, offscreen-or-virtualized, motion | `data-active`/`aria-hidden` select slide/caption; autoplay requires motion allowed, near viewport and visible document. |
| Overlay captions | `src/styles/captions.css` | overlay, hover, focus-visible, input-capability, breakpoint, reduced-motion | On precise pointers overlay caption is hidden until hover/focus; coarse pointers do not use the same reveal contract; 42rem alters lightbox caption layout. |
| Before/after | `src/components/before-after.ts`, `src/templates/before-after.ts` | active-or-pressed, initial/active/settled, reduced-motion, offscreen-or-virtualized | Auto reveal begins after intersection only when motion is allowed; manual input cancels the one-shot reveal. |
| Animated canvas gallery | `src/templates/animated-canvas-gallery.ts`, `src/components/animated-canvas-gallery.js`, `src/styles/components.css` | loading/ready, reduced-motion, conditional | Renderer starts at `data-gallery-state="loading"`; runtime owns transition to rendered state; fallback is separate from canvas readiness. |
| Homepage client logo wall | `src/content/visibility/home.json`, `src/data/content/section-visibility.ts`, `docs/home-section-visibility.md` | conditional, data | Authored `visible` boolean removes/restores the entire section. This is content inclusion, not route discovery. |
| Case/catalog visibility | `src/types/case.ts` and catalog consumers | conditional | `CaseVisibility = "public" | "hidden"` is an authored/catalog decision. Do not blindly translate the word `hidden` into CSS/DOM hidden. |
| Page manifest | `src/site/pages/manifest.ts` | routeDiscovery only | Enabled route discovery (`listed`, `indexable`) is separate from visual visibility. |
| Motion preference | `src/components/motion-preference.ts`, `src/motion.ts`, reduced-motion CSS queries | motion-enabled/reduced-motion | `matchMedia("(prefers-reduced-motion: reduce)")` is canonical capability input. Missing matchMedia fails safe to reduced motion. |
| Playlist filter interactions | `src/interactive.ts` | disclosure, overlay, selected, active-or-pressed, conditional | Runtime has filter open/advanced, dialog open/close, selection cycle, hidden seed/pill and pressed key-variant behavior. Model only if this surface receives a canonical story. |
| Media lightbox | `src/components/media-lightbox.ts`, `src/components/photoswipe-lightbox.ts` | overlay, open/closed, focus-visible | Source surfaces are buttons with `aria-haspopup="dialog"`; click/keyboard opens real PhotoSwipe-backed overlay and restores focus. |

## Story examples

### Unlisted page is not visually hidden

```js
parameters: {
  looksawful: {
    sources: ["src/site/pages/manifest.ts"],
    layer: "page",
    policy: "page",
    canonical: true,
    state: "default",
    visibility: ["always"],
    routeDiscovery: { listed: false, indexable: false },
  },
}
```

This is the correct shape for an enabled standalone project route that is deliberately absent from navigation/search indexing.

### Precise-pointer overlay caption

```js
parameters: {
  looksawful: {
    sources: ["src/styles/captions.css", "src/templates/media-figure.ts"],
    layer: "molecule",
    policy: "behavior-fixture",
    canonical: true,
    state: "overlay-hover",
    visibility: ["overlay", "input-capability"],
    interaction: ["hover", "focus-visible"],
    motion: ["motion-enabled", "reduced-motion"],
    responsive: {
      review: ["desktop", "tablet", "mobile"],
      conditions: ["(hover: hover) and (pointer: fine)"],
    },
  },
}
```

### Authored section exclusion

```js
parameters: {
  looksawful: {
    sources: ["src/content/visibility/home.json", "src/data/content/section-visibility.ts"],
    layer: "organism",
    policy: "composition",
    canonical: true,
    state: "section-hidden",
    visibility: ["conditional", "data"],
  },
}
```

The story must use the canonical visibility decision or an exact contract fixture. It must not add a second Storybook-only `hidden` prop.

## Rules for future story authors

1. Start from production evidence. A state without a production selector/runtime/data branch is not coverage.
2. Keep `sources` explicit and repo-relative. Multi-source renderer/runtime stories should list every production owner they exercise.
3. Treat `state` as the concrete variant name and the structured axes as evidence categories.
4. Do not use review viewport names as breakpoint claims.
5. Keep pointer capability, width breakpoint and reduced motion as distinct environment facts.
6. Keep `listed/indexable` under `routeDiscovery`; never encode them as visual visibility.
7. `canonical: false` plus `policy: "experimental"` is required direction for LAB-only prototypes once metadata is added to those stories.
8. Omit unsupported axes instead of filling them with guessed defaults.
9. A page story can be route-discovery hidden and visually `always` visible at the same time. That is not a contradiction.
10. Validation failures are authoring errors. The validator is strict on enum values, duplicate sources/axis values, unknown keys and route-discovery booleans so inventory/CI can trust the metadata later.


## Verified state-coverage slices

The first cross-cutting pass deliberately enriches existing canonical stories instead of multiplying fixtures.

- `Code Block` now records the real copy-control interaction axis (`default`, `focus-visible`, `active-or-pressed`) plus desktop/tablet/mobile review targets. Its `Copied` variant exercises the production copy runtime and confirmation state.
- `Before After` now records the real manual comparison interaction, desktop/tablet/mobile review targets and both motion environments. Its existing `AutoReveal` variant is explicitly documented as production runtime state rather than a second implementation.
- `Project Card` records the real keyboard focus axis (`default`, `focus-visible`) plus desktop/tablet/mobile review targets.
- `Page Flip` records real edge-control states (`default`, `active-or-pressed`, `disabled`), portrait/landscape runtime conditions, motion-enabled/reduced-motion, and desktop/tablet/mobile review evidence; the reduced-motion runtime regression remains covered by `test/page-flip.test.mjs`.
- Media Lightbox overlay/focus lifecycle remains a real organism-level gap and is tracked separately in GitHub issue #863 rather than duplicated in this state-focused branch.

These additions do not create new schema values. They reuse the canonical taxonomy above and therefore increase evidence quality without changing the denominator model.
