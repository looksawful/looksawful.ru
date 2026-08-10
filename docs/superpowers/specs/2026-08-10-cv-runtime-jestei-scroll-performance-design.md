# CV Runtime, Jestei and Scroll Performance Design

## Goal

Refactor the CV accordion so it is the single source of scene activity, simplify Jestei into HTML/CSS plus WebGL/progress JavaScript, and reduce per-frame scroll work without changing visible copy or the intended presentation.

## Constraints

- Production branch remains `prod`; implementation is validated on an isolated branch and fast-forwarded only after tests/build pass.
- Do not alter visible author copy as part of this refactor.
- Keep the architecture vanilla JavaScript/CSS/HTML; add no runtime dependencies.
- Avoid a global site scheduler. The coordinator is scoped to the CV accordion.
- Heavy components outside the CV accordion remain independently reusable.
- Preserve reduced-motion behavior and existing fallbacks.

## Stage 4 — Central CV runtime

Create one accordion runtime that owns:

- `activeIndex` (`-1` when there is no single active scene),
- resolved accordion `mode`,
- `documentVisible`, maintained by exactly one `visibilitychange` listener for CV consumers,
- direct per-scene state subscriptions,
- direct per-scene frame subscriptions,
- geometry invalidation callbacks.

The accordion commits ARIA and `inert` only when the active scene changes. Heavy consumers receive scene activity directly instead of observing `aria-expanded` through `MutationObserver`.

Remove the DOM `cvaccordionframe` event and replace it with direct frame subscription. Keep local `IntersectionObserver` only where visibility of a component inside an active long scene is still useful.

Consumers migrated in this pass:

- Jestei theme organism,
- animated canvas galleries and their previews,
- digital scroll gallery,
- Awful Tools previews / Awful Cases,
- Before/After when used inside CV.

## Stage 5 — Jestei

Move the inline Jestei organism's final base markup into `index.html` so accordion geometry is present before Jestei JavaScript runs. Remove `root.innerHTML = createJesteiThemeOrganismMarkup(...)` from the runtime.

Move UI theme tokens to CSS custom properties. JavaScript keeps WebGL color values, shader progress, track progress and active-theme state only. It must not regenerate the UI tree or rewrite palette/token text every animation frame.

Preload Three.js and the GLB after first paint. Prepare the WebGL renderer before the Jestei scene becomes active; preparation produces a compiled first frame but leaves rAF paused. The Jestei scene uses the central accordion runtime instead of an accordion-header `MutationObserver` and its own `visibilitychange` listener.

The track uses fixed CSS geometry and a scalar progress. Remove the track-specific `ResizeObserver`; keep at most one active canvas resize observer.

## Stage 6 — Scroll performance

The scroll frame calculation reuses allocated arrays instead of allocating arrays every frame. `createScrollMap` stores direct content-segment references by index so content offsets do not perform repeated `.find()` scans.

DOM writes are cached. Only records whose visual values changed are written. During a long content segment the hot path should primarily update accordion progress and the active record's content offset.

ARIA and `inert` are committed only on active-index changes. Header visibility attributes change only when their threshold state changes.

The accordion observes the component continuously but observes content/scroll-track geometry only for the active record. Consumers can explicitly invalidate their scene geometry through the runtime.

## Validation

- Unit tests for central runtime state/subscription semantics and reused frame buffers.
- Unit test that content segment lookup is indexed by scene.
- Static source assertions that Jestei/animated galleries/Awful Tools no longer create accordion `MutationObserver`s or CV-local `visibilitychange` listeners when using the runtime.
- Vite production build.
- Browser smoke test on deployed `prod`: scroll/click/reduced-motion behavior, Jestei activation/loading/animation, Awful Cases activation, Moves canvas activity and console errors.
- Compare Jestei DOM layout screenshots against the pre-change production artifact at representative viewport sizes; WebGL is checked in the same Chromium environment separately because raster antialiasing can vary.
