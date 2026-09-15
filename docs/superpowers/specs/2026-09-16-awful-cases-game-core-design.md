# Awful Cases trainer: canonical game core

## Goal

Turn the existing trainer into one maintainable browser game instead of two drifting runtimes, while preserving the current visual identity and public routes.

The production pass must improve learning value, lifecycle safety, mobile behavior, and bundle weight without changing the site framework or migrating the game to another engine.

## Non-goals

- No Phaser, React, or engine migration.
- No sound or decorative polish before the core is stable.
- No invented controls for Awful Cases features whose real shortcut and transformation contract have not been verified.
- No unrelated site refactors.

## Architecture

`src/components/awful-cases-core.js` owns pure game rules: actions, the session plan, phases, scoring, streaks, and phase-dependent recovery policy.

`src/components/awful-cases-runtime.js` owns Canvas rendering, task motion, asset loading, input plumbing, lifecycle, and DOM bindings. It imports the pure core and is the only handwritten runtime implementation.

`src/components/awful-cases-game.js` becomes a thin embedded-site mount. It selects the root, starts the canonical runtime in Russian, and pauses it while offscreen or while the document is hidden.

The standalone `/pets/awful-cases/` entry keeps its existing public module path. That module is generated from the canonical runtime, and a check prevents source and public copies from drifting.

The embedded DOM receives the same `data-awful-cases-*` hooks as the standalone page while retaining existing ids during migration.

## Input contract

Game actions are semantic and mapped in one place:

- `upper` → ArrowUp → app shortcut Ctrl+Alt+Shift+Up
- `lower` → ArrowDown → app shortcut Ctrl+Alt+Shift+Down
- `toggle` → ArrowRight → app shortcut Ctrl+Alt+Shift+Right
- `title` → ArrowLeft → app shortcut Ctrl+Alt+Shift+Left
- `lint` → PageDown → app shortcut Ctrl+Alt+Shift+PgDn
- `sentence` → Delete → app shortcut Ctrl+Alt+Shift+Delete

Pointer/touch controls dispatch the same semantic actions. Physical keys are never used as game state.

## Session model
The normal run has 18 tasks and three explicit phases:

1. Tutorial: six tasks, one per action, proactive shortcut hints, forgiving missed obstacles.
2. Practice: six mixed tasks, hints only after mistakes, forgiving missed obstacles.
3. Exam: six mixed tasks, no answer-revealing hints, a missed obstacle causes the existing fall/game-over state.

A wrong key increments mistakes and resets the streak but still gives the player a chance to correct the same task before the collision window expires.

A forgiving miss resolves the task, records a mistake, and removes the lethal hole. It does not count as a correct answer. This prevents tutorial sessions from becoming punishment for the thing they are supposed to teach.

Stats are explicit: `resolved`, `correct`, `mistakes`, `score`, `streak`, and `bestStreak`. Correct answers award a bounded base score plus a small streak bonus. Session completion shows score, correctness, mistakes, and best streak.

The demo mode remains automatic and is not treated as a scored session.

## Typography tasks

The trainer adds `lint` and `sentence` only from behavior verified in the Awful Cases application repository. Examples are derived from executable transform tests such as ellipsis cleanup, Russian hyphen cleanup, punctuation spacing, and sentence capitalization.

Long typography examples use a smaller task presentation than the four case transforms so obstacle geometry remains readable on narrow screens.

## Lifecycle and performance

The canonical runtime owns one animation frame loop and one keyboard listener. `AbortController` and `ResizeObserver` are cleaned up in `destroy()`.

The embedded mount controls `setActive()` through intersection and document visibility so offscreen portfolio content does not burn animation frames.

All environment sprites use the existing public PNG assets. The embedded runtime stops shipping duplicate base64 copies of those sprites inside JavaScript, reducing the Awful Cases bundle without changing artwork.

## Persistence

Best score is stored locally under a versioned key. Storage reads and writes are wrapped in `try/catch`; inability to persist must never break a run.

No account, network request, analytics dependency, or cross-device state is introduced.

## Verification

Required gates for this pass:

- pure core unit tests for the plan, phases, input mapping, scoring, and recovery policy;
- mirror/source drift test for public runtime files;
- existing Awful Cases regression tests;
- repository `npm test`, `typecheck`, and `css:check`;
- Vite production build;
- desktop keyboard playtest and narrow mobile touch playtest with screenshots;
- explicit comparison against clean `dev` for any pre-existing site postbuild failure.

The change is integrated only after these gates are green or a failure is proven pre-existing and unrelated.
