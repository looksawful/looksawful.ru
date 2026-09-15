# Storybook system closure retrospective

Date: 2026-09-15

## What worked

The strongest decision was to keep inventory v2 as the denominator truth instead of chasing a cosmetic coverage percentage. Removing proven non-visual support files from the UI denominator reduced false `missing` records without manufacturing stories.

Separating route discovery from visual visibility also removed an architectural ambiguity. An unlisted/non-indexable page can still be visually present and canonical in Storybook; those are different facts and are now represented separately.

Production-shaped page stories were effective. The page archetypes use the real render pipelines and data, while the Storybook helper owns only document extraction. This gives composition evidence without duplicating page markup or claiming runtime interaction coverage that belongs to organism/state stories.

Rebasing onto the live integration branch before final verification prevented the closure report from becoming stale while molecule/state/organism work was merging in parallel.

## Problems found

- The original closure checkout contained unrelated dirty work; a separate dedicated checkout avoided destructive cleanup.
- Sparse checkout silently reduced the denominator to 25 sources after rebase. Final verification therefore explicitly disabled sparse mode and reran inventory on the full repository.
- A normal `build:site` validated Lab links before Storybook/inventory artifacts existed. The fix now defers exactly two generated Lab routes while keeping arbitrary broken links blocking.
- A repeated Storybook invocation exhausted Windows worker-thread resources (`os error 1450`). Direct Storybook build with a bounded Rust worker pool verified the same source tree without closing unrelated user applications.
- The first browser smoke incorrectly treated empty-src images and cancelled video preload requests as failures. The corrected smoke validates only assigned images and relevant failed resources.

## Process changes to keep

- Always verify full-checkout source count before trusting inventory totals.
- Rebase closure/audit branches on the latest integration head before final evidence collection.
- Keep historical missing coverage report-only; structural metadata/source errors remain blocking.
- Separate build evidence, browser evidence, and manual visual review instead of using one as a proxy for another.
- Prefer grouped behavior/system issues over one issue per file.

## Handoff rule

A follow-up owner may close a coverage issue only when the canonical source leaves `missing`/`needs-classification` for the correct reason and the evidence matches the component's real behavior. A story that merely imports a source, a copied markup fixture, or an experimental demo is not closure evidence.

The next work should proceed through the existing focused issues, with #907 covering the only remaining shell/navigation pair. #908 is maintenance noise, not a closure blocker.
