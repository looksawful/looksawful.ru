# Container outline trace animation

## Scope

Add a one-time animated outline to large bordered cards and media containers on the published homepage. Reuse the visual language of the existing Jestei process animation: a small point moves along a path while the line is revealed behind it.

Do not animate hero, plain text sections, controls, chips, small cards, borderless canvas sections, or nested decorative elements.

## Eligible elements

Use an explicit allowlist of large homepage components:

- `.jestei-bento__card`;
- `.jestei-interface-bento__card`;
- large bordered Styx media containers inside the visible Styx sections;
- `.pet-projects-bento__card`.

Before mounting, verify from computed styles that the element has a visible border and that its rendered width and height are both at least 160 CSS pixels. This prevents the effect from attaching to small or borderless elements.

## Visual behavior

1. The element keeps its layout, dimensions, background, content, links, and interactions unchanged.
2. When it first enters the viewport, a pointer-events-free SVG overlay is fitted exactly to its border box.
3. The native border becomes temporarily transparent without changing border width.
4. A small point travels clockwise around a rounded-rectangle path.
5. The overlay stroke is revealed behind the point using the same path-length technique as the Jestei process scene.
6. At completion, the point fades out, the native border is restored, and the temporary SVG overlay is removed.
7. The animation runs only once per element per page load.

The overlay stroke color and width are derived from the element’s computed border color and border width. The path radius is derived from the computed border radius and clamped so it remains inside the element’s border box.

## Timing

- duration is based on perimeter and clamped between 900 and 1500 milliseconds;
- neighboring eligible elements entering together receive a 90-millisecond stagger;
- easing is smooth and nearly linear so the point appears to physically draw the contour;
- the point fades during the final 120 milliseconds;
- there is no erase phase and no loop.

## Architecture

Create one isolated DOM visual module, for example `src/visuals/dom/container-outline-trace.js`.

The module will:

- discover only allowlisted elements under `main[data-showcase]`;
- use one `IntersectionObserver` to start each animation once;
- use an SVG `path` or rounded `rect` with `getTotalLength()` and `getPointAtLength()`;
- use `ResizeObserver` only while an element is waiting or animating, then disconnect it;
- store mounted and completed state in `WeakSet` collections;
- expose one mount function for the homepage runtime;
- clean up observers and animation frames through a disposer.

Add a small dedicated stylesheet for overlay positioning and the temporary transparent-border state. Do not put this behavior into the existing large bento stylesheets.

## Accessibility and performance

- `prefers-reduced-motion: reduce`: leave the native border visible and do not create an overlay;
- SVG overlays use `aria-hidden="true"` and `pointer-events: none`;
- stop requestAnimationFrame work when the document is hidden;
- do not attach continuous listeners after an animation completes;
- do not alter focus order, hit areas, scrolling, or semantic markup.

## Verification

Verify at 1440, 1024, 768, 430, 390, 360, and 320 CSS pixels:

- the path matches each element’s current border and radius;
- no content shifts when the native border becomes transparent or returns;
- links, buttons, sliders, iframe previews, and 3D/canvas interactions remain usable;
- adjacent cards start with the intended stagger;
- each element runs once and does not restart after scrolling away and back;
- elements resized before entry receive the correct path;
- reduced-motion mode shows static borders only;
- borderless full-width arc and masonry canvas sections are untouched.
