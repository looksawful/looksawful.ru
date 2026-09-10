---
name: looksawful-game-refactor
description: "Use when auditing, testing, restructuring, or redesigning browser-game and pet-project experiences in looksawful.ru, including Awful Cases and Berserk Timer."
---

# Looksawful Game Refactor

Treat each pet/game surface as a product with explicit gameplay, UI, asset, state and test ownership. Do not choose a new engine merely because a generic game skill prefers one.

## Start with the current implementation

1. Inventory route, HTML/CSS/JS/TS owners, shared site dependencies, assets, input model, persistent state, timers/loops, audio, canvas/WebGL use and external runtime dependencies.
2. Define player/user fantasy, primary verbs, core loop, reset/failure/success states, session length, progression and non-game utility where applicable.
3. Separate simulation/domain state from rendering and DOM/HUD state where the current implementation mixes them.
4. Preserve intentional art direction and standalone-route behavior while removing accidental duplicated plumbing.
5. Decide stack changes only after the boundary audit. Current vanilla/standalone code may remain the right answer; Phaser/Three.js/R3F are options, not defaults.

## Quality ownership

- Browser-game source must belong to an explicit lint/type/style/test path. Code under `public/pets/**` must not remain an unowned exception after refactor.
- Prefer external JS/CSS/TS modules over large inline implementations when doing so improves testability and ownership without breaking progressive enhancement.
- Test observable behavior at the cheapest level: pure state/domain logic first, DOM/component behavior second, focused browser flows for integration and input/rendering behavior.
- Add playtest scenarios for keyboard, pointer/touch when supported, resize, pause/resume, visibility changes, audio lifecycle, repeated restart, reduced motion where relevant, and narrow viewport overflow.
- Preserve source assets and delivery constraints; route shared media through the existing Media Catalog when that reduces duplication without forcing game-only runtime assets into an unsuitable abstraction.

## Refactor stages

1. Characterize current behavior and known quirks.
2. Extract seams without redesigning.
3. Add/repair ownership and focused tests.
4. Simplify state/runtime boundaries.
5. Rework gameplay or UX flows behind explicit acceptance criteria.
6. Revisit visual/UI direction only after behavior is stable.
7. Run focused browser/playtest verification before calling the new surface ready.

## Stop

Stop before an engine migration, route change, destructive asset replacement, or major gameplay redesign unless the task explicitly includes that decision and the current behavior has a recorded characterization baseline.