---
name: optimize-web-animations
description: Use when animations, GSAP, Canvas/WebGL, galleries or long sessions cause jank, CPU/GPU load, memory growth, offscreen work, or cleanup problems.
---

# Optimize web animations

Preserve motion; stop unnecessary work.

## Baseline

1. Read `looksawful-frontend-runtime` and the current animation owners.
2. Inspect CSS animations, GSAP timelines/tweens, RAF loops, timers, media playback, observers and global listeners.
3. Sample representative page positions (top, middle, lower page) and a representative mobile viewport when layout differs.
4. For long-session/leak work, compare bounded route cycles and stable observable counts (DOM nodes, canvases, media elements, active animations). If heap metrics are unavailable, say so.

## Fix patterns

- Pause CSS animation when its owning section/card is offscreen when continuous offscreen animation has no user value.
- Gate RAF/WebGL loops directly; CSS `animation-play-state` cannot stop JavaScript render loops.
- Reuse existing visibility/reveal utilities before adding another observer system.
- Cancel RAF/timers and disconnect Intersection/Resize/Mutation observers on teardown.
- Remove window/document listeners with the same handler reference or use an AbortController-owned lifecycle.
- Kill/revert GSAP timelines/tweens and release targets on teardown.
- Dispose Three.js/WebGL resources and remove renderer nodes when a scene is destroyed.
- Pause detached/offscreen media where the product behavior allows it.
- Guard async loaders so resources resolving after disposal are themselves released.
- Cap simulation deltas after visibility pauses to prevent oversized catch-up frames.

## Verification

- Visible motion still starts/resumes correctly.
- Offscreen continuous animation/RAF work is inactive for the tested owners.
- Repeated route/init-destroy cycles do not monotonically accumulate canvases, observers, media nodes or duplicate animation instances.
- Console remains free of new runtime errors.
- Run the narrow repository checks relevant to the changed owner.

Do not remove motion merely to make a profile look clean. Source inspiration/provenance is recorded in `docs/agents/skill-sources.md`.
