# Testing lifecycle implementation plan

## Goal

Bring the existing test/check pipeline into compliance with `docs/testing-policy.md` without weakening production fail-closed guarantees.

## Constraints

- Work on `dev` only until a separate production release is explicitly requested.
- Do not redesign application architecture or authored content.
- Do not mass-delete tests without classification.
- Preserve exact-SHA deployment verification, production smoke, CMS authorization, media integrity and security schedules.
- Prefer routing/removal of redundant checks over adding new checks.

## Tasks

1. Inventory current Node test files, E2E runners and workflow entrypoints.
2. Classify current ordinary-push coverage into CONTRACT, AFFECTED, PRODUCTION SMOKE, FULL/QUALITY and obvious TEMPORARY/history-only tests.
3. Replace `test:fast = almost every *.test.mjs` with an explicit curated fast allowlist.
4. Keep a broader cheap `test:unit` path available for manual/scheduled coverage.
5. Update the existing test-group contract so an unknown/new test is not selected by `fast` automatically.
6. Delete the temporary mobile VisualViewport RED→GREEN regression test after the production hotfix evidence is complete.
7. Remove editable-copy literal pins and obvious completed-migration checks from ordinary Fast CI where they do not protect a live contract; retain useful files outside Fast when deletion is not justified.
8. Ensure scheduled/manual Quality remains the home for broad/heavy checks rather than push CI.
9. Run only the relevant selector/test-group checks first, then `test:fast`, typecheck and build. Do not run full E2E unless the changes affect its contract.
10. Report final classification counts: NEW PERMANENT TESTS, TEMPORARY TESTS REMOVED, MOVED TO AFFECTED/FULL.

## Acceptance

- New arbitrary `*.test.mjs` files do not enter Fast CI automatically.
- Fast CI contains only explicitly selected cheap long-lived contracts.
- Existing broader cheap tests remain runnable outside ordinary push CI.
- The temporary mobile viewport regression test is gone.
- Production/CMS/media/security safety contracts remain available at the appropriate tiers.
- Exact final `dev` SHA has a green relevant Fast CI/typecheck/build gate.
