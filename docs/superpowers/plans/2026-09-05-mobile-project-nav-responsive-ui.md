# Mobile project navigation + optional responsive UI verification

Issue: #327
Notion: 09 — Table of Contents
Branch: `fix/project-nav-mobile-327`
Base: `dev@1f41ddaa4587b1cfd39ed265122e5ca1453ac1a8`

## Pre-change retro

The mobile project navigation is already visually a bottom toolbar, but current `dev` mixes two positioning systems:

- CSS sticky placement using `100dvh` + `translate`;
- `initProjectNavigationViewportAnchor()` on every scroll/resize frame, using `VisualViewport`, `getBoundingClientRect()` and an inline CSS offset.

The JS layer is the avoidable scroll hot-path work and the only code that manually races changing mobile browser geometry. The existing regression test protects that workaround instead of the product invariant.

The nav is the first child of `.projects`, so replacing the current sticky geometry with `position: sticky; bottom: 0` without first changing DOM/layout does not preserve the same section-bounded behavior. This task therefore removes JS positioning first and keeps the browser-native sticky geometry unless browser evidence proves a simpler bottom-inset layout is equivalent.

## Constraints

- no copy/design changes;
- preserve desktop left rail, active section, horizontal list and back-to-top;
- no new dependency;
- do not edit `tools/ci/run-tests.mjs` while PR #326 owns that shared Fast manifest;
- temporary test/workflow triggers must be removed before merge;
- permanent checks must follow `docs/testing-policy.md`.

## Task 1 — RED permanent contract

Modify `test/project-navigation-mobile-viewport.test.mjs` so it asserts:

- mobile positioning remains CSS-native sticky;
- safe-area bottom padding is present;
- no `VisualViewport`/viewport-offset positioning runtime remains;
- desktop rail retains its wide-layout top constraint.

Run the focused test before implementation and capture the expected failure.

Classification: permanent AFFECTED/UNIT contract. It is cheap but is not added to Fast in this branch because #326 currently owns the shared Fast allowlist.

## Task 2 — Remove scroll-frame positioning

Edit:

- `src/components/project-navigation.ts`;
- `src/interactive.ts`;
- `src/styles/project-navigation-top.css`.

Remove:

- `ProjectNavigationViewportGeometry`;
- `calculateProjectNavigationViewportOffset()`;
- `initProjectNavigationViewportAnchor()`;
- runtime wiring;
- `[data-viewport-anchor]` CSS;
- inline viewport offset state.

Keep the existing narrow sticky placement in `src/styles/components.css` browser-native and unchanged. Add `env(safe-area-inset-bottom, 0px)` in the dedicated project-navigation style layer without changing wide rail geometry.

## Task 3 — GREEN focused contracts

Run:

- `node --test test/project-navigation-mobile-viewport.test.mjs`;
- project-navigation fallback/back-to-top tests;
- typecheck;
- required Fast CI.

## Task 4 — Optional responsive/UI layer

Create a small Playwright layer that is not part of normal Fast CI:

- command: `npm run test:ui:responsive`;
- manual GitHub workflow: `UI Responsive`;
- representative mobile widths 390 and 393;
- one wide viewport above the 96rem rail breakpoint;
- verify no horizontal overflow;
- verify mobile nav stays flush to the viewport bottom while scrolling inside `.projects`;
- resize viewport height while scrolled and verify bottom alignment remains stable;
- verify wide layout remains a rail rather than a bottom bar.

Use Chromium only initially to keep cost bounded. Real mobile browser chrome on iOS/Android remains a real-device acceptance check; desktop emulation must not be presented as proof of Safari/Chrome browser-toolbar animation.

For this PR only, a temporary `pull_request` trigger may be used to obtain browser evidence. Final workflow must be `workflow_dispatch` only.

## Task 5 — Integration and closeout

Before merge:

1. compare branch with latest `dev`;
2. ensure no relevant overlap appeared;
3. run fresh required checks and the optional responsive layer;
4. classify tests as KEEP/MOVE/DELETE;
5. remove temporary workflow triggers/tests;
6. mark PR ready and merge to `dev`;
7. close #327;
8. update Notion with PR, commit, checks, test lifecycle and remaining real-device caveat;
9. delete temporary branch if the repository workflow permits it.
