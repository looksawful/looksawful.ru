---
name: looksawful-frontend-runtime
description: Use for CSS/layout, responsive behavior, GSAP/motion, PhotoSwipe/Embla galleries, Canvas/WebGL/Three.js, and frontend runtime changes in looksawful.ru.
---

# Looksawful frontend runtime

Work with the existing frontend architecture instead of importing a generic one.

## Read first

1. Read `AGENTS.md` and `docs/agent-context/frontend.md`.
2. Inspect the current implementation and the narrow tests/contracts around the surface being changed.
3. Read `package.json` for the actual dependency versions. Never code against a remembered major version.
4. Preserve authored copy, DOM meaning, selectors, timing, and interaction semantics unless the task explicitly changes them.

## CSS and responsive layout

- CSS owns layout, sizing, overflow, breakpoints, and visual composition.
- Prefer mobile-first rules and intrinsic layout before breakpoint patches.
- Prefer component-local container queries when adaptation depends on the component's available space; use media queries for viewport/page-level behavior.
- Prefer modern CSS primitives when they simplify the current architecture: logical properties, `min()`, `max()`, `clamp()`, `minmax()`, `aspect-ratio`, grid/flex intrinsic sizing, and supported containment features.
- Do not introduce JavaScript merely to calculate responsive layout that CSS can express.
- Do not introduce a new cascade architecture, naming methodology, utility framework, or reset as an incidental refactor.
- Before moving rules, read the current stylesheet ownership tests. Preserve import order and ownership unless the task is explicitly an ownership refactor.

## Motion and GSAP

- The existing reveal contract is `src/motion-contract.ts` plus the current runtime in `src/motion.ts`. Reuse it for ordinary one-shot reveals instead of creating a second reveal system.
- Use `IntersectionObserver` for visibility-triggered one-shot behavior when the existing motion runtime is sufficient.
- Use GSAP for cases that actually need timeline orchestration, complex sequencing, transforms, or scroll-linked animation.
- Prefer `gsap.matchMedia()` for responsive/reduced-motion GSAP variants.
- Scope GSAP work with `gsap.context()` when appropriate and always provide deterministic cleanup (`revert`, `kill`, observer/listener teardown).
- Use ScrollTrigger only for behavior that is genuinely scroll-linked. Do not replace ordinary reveals with scrubbed ScrollTrigger timelines.
- Call refresh/recalculation only after a real layout/DOM change that invalidates measurements; do not turn refresh into a resize superstition.
- Respect the project's existing reduced-motion contract. Do not add a second preference system.

## Galleries and lightbox

- Treat PhotoSwipe and Embla behavior as existing contracts. Read the installed versions and current wrappers before changing APIs.
- Preserve project-scoped lightbox sources.
- For nested decks/carousels, resolve the active slide/media source before falling back to the first media element.
- Preserve keyboard, pointer, focus, captions, and resize behavior.
- Destroy carousel/lightbox instances and remove listeners/observers on teardown. Do not leave duplicate instances after re-init.
- CSS owns the visual sizing of gallery/deck content unless runtime measurement is functionally required.

## Canvas, WebGL and Three.js

- Gate expensive RAF loops by visibility where possible. Offscreen animation should stop doing meaningful work.
- Cap pixel ratio when full device DPR is not visually justified.
- Dispose textures, materials, geometries, render targets, renderers and long-lived listeners when a scene is replaced or destroyed.
- Treat shader uniforms and mutable animation targets as resources that GSAP timelines may need to release.
- Preserve deterministic resize behavior and avoid layout reads/writes inside unbounded frame loops.

## Verification

Use the cheapest relevant checks from `docs/testing-policy.md`.

- Structural CSS/runtime changes: run focused contract tests plus typecheck/build when the affected contract requires it.
- Responsive geometry risk: use the manual `test:ui:responsive` layer when justified; do not promote it into default fast CI.
- Animation performance or leak work: also use `optimize-web-animations`.
- Broad quality claims require runtime evidence; source inspection alone is a hypothesis.

Do not change user-facing text as part of frontend cleanup.