# Repository Structure Normalization Execution Plan

Issue: #364
Notion: Project 67 — Repository Structure Normalization
Target: `dev`

## Goal

Normalize repository layout without changing authored content, visual output, routes, CMS semantics, Media Desk behavior, runtime hooks, build topology, or public URLs.

## Conflict boundaries

At branch creation, active drafts overlap these paths and are excluded from this work until they merge or are otherwise resolved:

- PR #362: `src/main.ts`, navigation runtime/model/shell/styles/tests, `tools/smoke-site-navigation.mjs`.
- PR #326: visibility sources/renderers and `tools/ci/run-tests.mjs`.
- PR #324: pet code sources/runtime and `tools/ci/run-tests.mjs`.
- PR #303: `test/site-composition.test.mjs`.

Do not edit those paths from this branch merely to make cleanup easier.

## TDD rule

Every package follows:

1. Add or strengthen the smallest durable contract.
2. Run it on the exact branch head and record RED for the intended reason.
3. Make the minimum structural/production change.
4. Re-run the targeted contract and record GREEN.
5. Run affected neighboring contracts, typecheck, build, and browser/CMS checks appropriate to the touched surface.
6. Refactor only while green.
7. Remove migration-only tests/scripts before package closeout.

For path-only refactors, the RED contract must prove the desired path/ownership invariant before any move.

## Packages

### WP0 Baseline / isolation

- Branch from current green `dev`.
- Confirm current Fast CI is green on the exact base SHA.
- Inventory active PR paths and reserve non-overlapping surfaces.

### WP1 Durable repository-structure contract

Add `test/repository-structure.test.mjs` and a dedicated cheap Fast CI step rather than touching the shared test allowlist while PRs #324/#326 are active.

The contract must verify:

- intentional root directories/files;
- Vite route entries exist for enabled Vite SitePages;
- public-static SitePage source files exist;
- no new authored `.js` is allowed under `src` beyond an explicit temporary allowlist for the two known legacy components;
- `src/main.js` and `src/interactive.js` are absent in the target structure;
- application dev tooling lives under `src/devtools`, not `src/tools`;
- the generic HTML helper has one unambiguous canonical location;
- manual root archive snapshots are absent from the target working tree.

First commit must be RED with no production/path edits.

### WP2 Compatibility shims

- Search all consumers of `src/main.js` and `src/interactive.js`.
- Do not touch `src/main.ts` while PR #362 is active.
- Update only independent consumers if any.
- Delete shims only after reference count is zero and WP1 is RED for their presence.

### WP3 Manual archive

- Search source/config/workflow/docs for `archive/` consumers.
- If no build/runtime/CMS dependency exists, delete snapshots from the working tree.
- Preserve recovery through Git history.
- Never confuse this technical snapshot archive with publication/draft ownership from #320.

### WP4 Application devtools boundary

- Move `src/tools/media-desk/**` to `src/devtools/media-desk/**`.
- Update only direct imports/configuration consumers atomically.
- Verify Media Desk plugin wiring, TypeScript, build, and CMS check.

### WP5 Renderer helper naming

- Move `src/site/rendering/html.ts` to an unambiguous renderer-support path after searching every consumer.
- Do not touch renderer implementation files owned by active architecture/CMS PRs unless a direct import update is unavoidable and conflict-free.
- Verify rendered-output contracts and build parity.

### WP6 Repository tooling organization

Do not begin while overlapping tooling PRs are active. Then move one cohesive family per RED/GREEN cycle, updating package/workflow/import references atomically. Prefer existing `tools/e2e`, `tools/ci`, `tools/media`, `tools/quality`, `tools/lib` boundaries before creating new ones.

### WP7 Test organization

Do not begin while active PRs edit the shared runner. First characterize recursive discovery and explicit fast/CI tiers. Move one domain family per cycle and preserve tier runtime/semantics.

### WP8 Animated canvas gallery JS migration

Separate high-signal TDD cycle. Preserve exact DOM/selectors/timing/runtime behavior. Migrate authored JS to TS, run targeted browser coverage, then remove obsolete `.js`/`.d.ts`.

### WP9 Awful Cases game JS migration

Separate high-risk cycle after overlapping pet work is resolved. Map public/browser API first, characterize behavior, then migrate without redesign. Remove legacy files only after exact-head browser and build proof.

### WP10 CSS aggregate reduction

Only extract clearly owned component slices from `src/styles/components.css`; preserve cascade/import order and verify affected responsive/visual surfaces. Skip any slice overlapping active design/navigation work.

### WP11 Closeout

- Add/update `docs/repository-structure.md` to match exact final tree.
- Keep only cheap durable structural regressions.
- Remove migration-only tests/scripts/debug artifacts.
- Search old paths and require zero unintended references.
- Run final matrix: typecheck, lint, format:check, cms:check, test:fast, test:ci, media contract, build:site, e2e smoke, plus targeted touched-surface checks.
- Rebase/update against current `dev` and rerun required checks on the exact final head.
- Mark PR ready only after fresh evidence.
- Merge to `dev`, close #364, reconcile Notion Project 67, remove temporary branch/worktree-equivalent artifacts.
