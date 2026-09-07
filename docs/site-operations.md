# Site operations

This is the operating reference for `looksawful.ru` CMS/content/media publication. Architecture and ownership rules are defined in `docs/cms-architecture.md`; the shorter owner-facing manual is `docs/cms-handbook.md`.

## 1. Branch roles

- `content/<purpose>` — temporary/manual authoring branch for one coherent CMS/Desk batch, created from fresh `origin/dev`;
- `dev` — working integration branch and CMS publication source after validated authoring integration;
- `prod` — production/release branch and trusted source of CMS publication authorization policy.

GitHub Pages production deployment remains explicitly tied to `prod`.

At the time of this document the GitHub repository default branch is still `prod`. That repository setting is separate from authoring, integration and publication semantics.

Normal content flow:

```text
fresh origin/dev
  -> content/<purpose> authoring branch/worktree
  -> Pages CMS / local Desk save small authored commits
  -> cms:authoring:status / cms:authoring:check
  -> reviewable content-only integration -> dev
  -> Fast CI / relevant integrated-dev verification
  -> Подготовить публикацию
  -> trusted publication workflow from prod
  -> topology + explicit CMS diff authorization
  -> create/reuse dev -> prod pull request
  -> review / required checks
  -> separate controlled merge/release to prod
  -> GitHub Pages deployment from prod
```

Pages CMS must not be used as the ordinary editor for moving `dev` or for `prod`.

## 2. Responsibility boundaries

Pages CMS edits explicitly configured authored content and metadata plus configured source-media surfaces. It does not own routes/slugs/canonical URLs, stable domain IDs, layout/CSS, runtime/component implementation, generated media output, build/deployment architecture or publication policy.

`.pages.yml`, `.github/**`, `tools/**`, tests, docs, `AGENTS.md` and package/build configuration are engineering changes. They are not ordinary CMS-only publication content.

## 3. Current Pages CMS content scope

Current configured sources include:

```text
src/content/navigation.json
src/content/editorial/home-project-cards.json
src/content/projects.json
src/content/cases/jestei-pool.json
src/content/cases/styx.json
src/content/cases/sensetique.json
src/content/collections/shootings.json
src/content/shootings/*.json
src/content/standalone-projects/berry-social-content-2020.json
src/content/standalone-projects/awful-cases.json
src/content/client-logo-visibility.json
src/content/editorial/cv.json
src/content/media-catalog/registered/*.json
src/content/media-catalog/uploads/*.json
```

This inventory is not a generic publication glob. The trusted publication classifier maintains its own explicit allowlist. Stable IDs remain readonly where domain identity is fixed.

Optional editorial text should be cleared completely when no copy is wanted. Do not use a whitespace placeholder. Structural fields remain strict.

## 4. Current Pages CMS media scope

Project-card cover source is scoped to:

```text
public/media/projects/index/*
```

Reusable Media Catalog uploads use:

```text
public/media/catalog/*
src/content/media-catalog/uploads/*.json
```

Source masters are preserved. Generated responsive/video files and technical metadata are tooling-owned. Upload size policy remains in `docs/media-upload-policy.md`.

## 5. Starting and saving an authoring batch

Before a manual Pages CMS / local Desk batch:

```text
git fetch origin dev
git switch -c content/<purpose> origin/dev
npm run cms:authoring:status
```

A separate worktree is preferred when other agents/processes are using the main repository checkout. Pages CMS and local Content/Media Desk must point at the same branch/worktree for the same batch.

`Save` creates a real Git commit on the selected Pages CMS branch. For manual authoring, select the current `content/<purpose>` branch, not `dev` or `prod`. Save small coherent commits.

A save on `content/*` does not integrate into `dev` and does not deploy production.

Media-source changes may invoke normalization only when the relevant existing workflow is operating on its supported integration source. Do not assume a dev-bound automation has validated a temporary authoring branch merely because the authored files are identical in shape.

## 6. Authoring topology/status gate

`tools/cms-authoring-topology.mjs` is read-only. Its npm wrappers are:

```text
npm run cms:authoring:status
npm run cms:authoring:check
```

The status includes:

- current branch;
- HEAD SHA;
- merge-base SHA against current `origin/dev`;
- current `origin/dev` SHA;
- dirty state;
- changed files;
- existing CMS publication classification for the committed branch diff;
- intended integration target (`dev`).

`cms:authoring:check` fails unless all of the following hold:

- current branch is `content/<purpose>`;
- merge-base equals current `origin/dev`;
- worktree is clean;
- complete committed branch diff contains only CMS-safe content/media/generated paths.

The helper never fetches, rebases, commits, merges or publishes. Fetch `origin/dev` explicitly before relying on the freshness result.

## 7. Stale authoring state

If `origin/dev` advances while a CMS/Desk batch is open, the authoring helper reports `stale: true`.

Do not silently force/rebase beneath an open editor session or discard unsaved state. Instead:

1. finish and save the current coherent authored batch;
2. stop writes from Pages CMS / Desk;
3. inspect the complete intended diff;
4. move/replay only intended authored commits/changes onto fresh `origin/dev` through the normal reviewable integration flow;
5. rerun authoring/content-only checks;
6. integrate into `dev`;
7. discard/retire the old temporary authoring branch and start the next batch fresh.

A stale branch is evidence to refresh at the integration boundary, not permission to import unrelated old engineering state.

## 8. Проверить сайт

Configured Pages CMS `Проверить сайт` actions currently dispatch `ci-fast.yml` using explicit `ref: dev`. That action validates integrated `dev`; it does not prove a not-yet-integrated `content/*` branch.

Authoring-branch verification happens through the reviewable `content/* -> dev` PR/controlled integration path, where Fast CI checks the proposed merge. After integration, `Проверить сайт` may be used as the existing explicit verification action for `dev`.

The action does not publish production.

## 9. Integration into dev

A finished manual authoring batch targets only `dev`.

Before integration:

```text
git fetch origin dev
npm run cms:authoring:status
npm run cms:authoring:check
```

The diff must be reviewed as a complete batch. `ENGINEERING`, `UNKNOWN` or mixed engineering/CMS changes are not eligible for content-only integration; use the normal engineering workflow instead.

Do not automatically merge an arbitrary authoring diff into `dev`. The intended contract is a reviewable PR/controlled integration with relevant checks.

After successful integration, `dev` becomes the source for the existing trusted publication stage. Temporary `content/*` branches never become release sources.

## 10. Подготовить публикацию — trust model

The global Pages CMS action dispatches:

```text
workflow: pages-cms-publish.yml
ref: prod
```

The publication invariant remains:

```text
CMS publication source = integrated dev
publication policy source = prod
classifier source = prod
```

The trusted workflow validates the CMS publication source branch, current `prod`/`dev` topology and the complete changed-file set before a publication PR may be created or reused.

`content/*` has no direct `prod` publication authority.

## 11. Branch topology gate

The release topology guard is `tools/cms-publication-topology.mjs`.

- Identical refs or identical trees: successful no-op.
- `prod` ancestor of `dev`: inspect `origin/prod..origin/dev` and classify it.
- Diverged histories: allowed only when a conflict-free hypothetical merge of current `prod` into current `dev` produces exactly the current `dev` tree.
- If `prod` contains content missing from `dev`, the merge conflicts, or safety cannot be proven: block before publication authorization.

Release-only merge history is therefore acceptable; production-only content missing from `dev` is not.

This guard remains separate from the authoring-topology helper. The authoring helper protects `content/* -> dev`; the publication topology guard protects `dev -> prod`.

## 12. CMS publication classifier

`tools/cms-publication-scope.mjs` classifies the full current diff as `CMS_CONTENT`, `CMS_MEDIA`, `CMS_GENERATED`, `ENGINEERING` or `UNKNOWN`.

Only an entirely allowed CMS content/media/generated diff can proceed. Any engineering, unknown or mixed engineering/CMS diff uses the normal engineering release path. `tools/ci/change-scope.mjs` selects verification coverage and does not grant publication permission.

The same classifier is reused by the authoring status/check. Reuse only classifies branch contents; it does not give temporary branches publication rights.

## 13. Publication PR behavior

After topology and scope authorization, `Подготовить публикацию` should create or reuse an open `dev -> prod` PR and stop. It must not merge that PR or deploy production automatically.

The final merge/release to `prod` is a separate controlled action. A push to `prod` then triggers the explicit production Pages workflow.

## 14. Engineering release versus CMS publication

Use CMS publication only for explicit CMS-owned content/media plus allowed deterministic generated metadata that has already been integrated into `dev`.

Use normal engineering flow for TypeScript/runtime, CSS/HTML architecture, `.pages.yml`, workflows, tooling/classifiers, tests, docs/`AGENTS.md`, package/build configuration and any mixed/unknown diff.

## 15. Branch protection readiness

Repository rulesets/protection are external configuration. Before enabling them, preserve the operating model:

`prod` should block deletion and force-push/history rewrite and permit only controlled release updates.

`dev` should block deletion and destructive history rewrite while permitting controlled engineering/content integration and existing approved automation. Manual long-running CMS sessions no longer require editing directly on moving `dev`.

Temporary `content/*` branches are disposable batch surfaces and are validated at integration time rather than treated as permanent protected branches.

Do not claim controls are active until repository state confirms them.

## 16. Media Catalog operations

Registered media metadata lives under `src/content/media-catalog/registered/*.json`. New uploads use `public/media/catalog/*` plus `src/content/media-catalog/uploads/*.json`.

Tooling owns width/height/MIME/size/duration and generated delivery metadata. Editorial catalog metadata must survive deterministic sync, and catalog defaults must not silently overwrite placement-specific captions/alt/layout.

## 17. Emergency rules

If a CMS save breaks an authoring branch, do not integrate it. Fix or revert through normal Git history and rerun the appropriate verification.

If a bad change reaches `dev`, do not publish it. Fix or revert through normal Git history and rerun verification.

If a bad change reaches `prod`, use a normal revert/fix release. Do not force-push or reset permanent branches.

If authoring integration or publication is blocked by `ENGINEERING`, `UNKNOWN`, stale topology or unsafe branch topology, do not bypass the gate.

## 18. Routine CMS authoring/publication checklist

```text
[ ] origin/dev fetched immediately before starting/checking the batch
[ ] Pages CMS and local Desk point at the same content/<purpose> branch/worktree
[ ] cms:authoring:status shows the expected branch/base/current dev
[ ] only intended authored/media fields changed
[ ] optional empty copy is actually empty, not a whitespace placeholder
[ ] worktree is clean and cms:authoring:check is green before integration
[ ] content/* -> dev PR / controlled integration is reviewed and green
[ ] integrated dev verification is green when required
[ ] topology contains no production-only content missing from dev
[ ] trusted prod classifier authorizes the complete prod..dev diff
[ ] dev -> prod PR exists
[ ] PR checks/diff are reviewed
[ ] separate controlled merge/release to prod
[ ] Pages deployment from prod is green
```
