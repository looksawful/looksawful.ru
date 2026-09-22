# Awful Cases canonical game core implementation plan

## Task 1: lock the contracts with failing tests

Files:
- modify `test/awful-cases-game.test.mjs`
- create `test/awful-cases-core.test.mjs`

Add tests for the 18-step three-phase plan, six semantic actions, app-key mapping, score/streak transitions, forgiving versus lethal misses, canonical runtime imports, public mirror equality, and shared data hooks.

Run the targeted tests and confirm the new assertions fail for the intended missing behavior.

## Task 2: add the pure core

Files:
- create `src/components/awful-cases-core.js`
- generate `public/pets/awful-cases/awful-cases-core.js`

Implement actions, session plan, phase lookup, input mapping, initial stats, correct/mistake reducers, score calculation, and recovery policy without DOM or Canvas dependencies.

Run core tests until green, then commit the slice.

## Task 3: establish one canonical runtime

Files:
- create `src/components/awful-cases-runtime.js`
- replace `src/components/awful-cases-game.js` with a thin embedded mount
- generate `public/pets/awful-cases/awful-cases.js`
- create `tools/generate-awful-cases-runtime.mjs`
- modify `package.json`
Base the runtime on the existing standalone root-scoped lifecycle and move localization behind a locale option. Preserve the embedded offscreen pause behavior in the wrapper.

Replace embedded base64 environment sprites with the existing public asset URLs. Add generation/check commands that copy canonical core/runtime files into the standalone public path and fail on drift.

Run targeted tests, typecheck, and the Vite build before committing.

## Task 4: unify DOM and touch input

Files:
- modify `src/components/specialized/awful-cases-game.ts`
- modify `public/pets/awful-cases/index.html`
- modify `src/styles/components.css` only where the existing controls need six-action layout support

Add canonical `data-awful-cases-*` hooks while retaining current ids. Add PageDown and Delete actions to touch controls and keep touch controls hidden on fine pointers.

Run component tests and desktop/mobile smoke checks.

## Task 5: ship Tutorial, Practice, Exam and typography actions

Files:
- modify `src/components/awful-cases-runtime.js`
- modify `src/components/awful-cases-core.js`
- regenerate public mirrors

Use the core plan for spawn order and phase behavior. Add verified lint/sentence examples, phase-aware hints, forgiving pre-exam miss recovery, exam fall behavior, score/streak HUD, completion summary, and guarded local best score.

Run targeted tests and browser playtests for one correct action, one wrong action, forgiving miss, exam miss, victory, restart, and mobile touch.

## Task 6: full verification and integration readiness

Run:

- `npm test`
- `npm run typecheck`
- `npm run css:check`
- `npm run build:vite`
- targeted Awful Cases tests
- runtime mirror check
- Playwright desktop/mobile smoke pass with screenshots
- `git diff --check`

If `build:site` still fails, reproduce the same failure on clean `dev` before classifying it as unrelated.

Review the final diff for unrelated files, stale generated copies, duplicate listeners, and accidental changes to other project components.

Commit only after the final tree is verified. Rebase or merge against the latest `dev` only when the integration path is conflict-safe.
