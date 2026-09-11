# Site operations

Status: CURRENT operator reference. See `docs/README.md` for documentation authority/classification.

This is the operating reference for `looksawful.ru` CMS/content/media publication. Architecture and ownership rules are defined in `docs/cms-architecture.md`; the shorter owner-facing manual is `docs/cms-handbook.md`.

## 1. Permanent branches

- `dev` — GitHub default branch, working/integration branch and normal Pages CMS content source in the CURRENT implementation.
- `prod` — production/release branch and trusted source of CMS publication authorization policy.

GitHub Pages production deployment remains explicitly tied to `prod`.

Normal current content flow:

```text
Pages CMS on dev
  -> Save (real commit on dev)
  -> optional manual Проверить сайт / dev Fast CI
  -> Подготовить публикацию
  -> trusted publication workflow from prod
  -> topology + explicit CMS diff authorization
  -> create/reuse dev -> prod pull request
  -> review / required checks
  -> separate controlled merge/release to prod
  -> GitHub Pages deployment from prod
```

Pages CMS must not be used as the ordinary editor for `prod`.

### Current vs target authoring topology

The flow above is the CURRENT implemented/documented Pages CMS model. GitHub #451 tracks a safer TARGET model for parallel editorial work:

```text
fresh dev
  -> temporary content/* branch/worktree
  -> CMS/Desk authoring
  -> validation/review
  -> integration into fresh dev
  -> existing trusted dev -> prod publication boundary
```

Do not treat this TARGET topology as current until #451 lands in executable tooling/tests and all operator docs are reconciled together.

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

## 5. Saving in Pages CMS

`Save` creates a real Git commit on the selected Pages CMS branch. In the CURRENT implementation, ordinary editing uses `dev`.

A save on `dev` does not deploy production. Text-only CMS paths are intentionally ignored by the automatic `ci-fast.yml` push trigger; use the entity action `Проверить сайт` when verification is needed. Publication PRs targeting `prod` still run the normal PR verification configured for that workflow.

Media-source changes can invoke the separate `CMS media` workflow on `dev`, which may persist only its explicitly allowed normalized/generated metadata and uses a non-force update guard.

## 6. Local Content / Media Desk

The local Desk is a separate operator surface from Pages CMS.

`npm run desk` is CURRENTLY write-capable: the launcher enables `CONTENT_DESK_WRITE=1` / `VITE_CONTENT_DESK_WRITE=1`, and startup runs `media:ensure`, which may synchronize derived media state before the UI opens. It is therefore not a side-effect-free read-only inspection command.

The local HTTP/write contract, limits and error behavior are documented in `docs/content-media-desk-api.md`.

TARGET hardening is owned by #452/#453: read-only-by-default launch, explicit guarded write activation, stronger source authorization, stale-write/revision conflict handling and atomic persistence. These protections must not be claimed as CURRENT until executable code/tests verify them.

## 7. Проверить сайт

Configured `Проверить сайт` actions dispatch `ci-fast.yml` using explicit `ref: dev`, so they validate the `dev` CMS branch. The current Fast CI contract includes TypeScript, fast tests and a production site build, with its existing media-state recovery/validation path.

The action does not publish production.

## 8. Подготовить публикацию — trust model

The global Pages CMS action dispatches:

```text
workflow: pages-cms-publish.yml
ref: prod
```

The current invariant is:

```text
CMS content source = dev
publication policy source = prod
classifier source = prod
```

The trusted workflow validates the CMS source branch, current `prod`/`dev` topology and the complete changed-file set before a publication PR may be created or reused.

## 9. Branch topology gate

The topology guard is `tools/cms-publication-topology.mjs`.

- Identical refs or identical trees: successful no-op.
- `prod` ancestor of `dev`: inspect `origin/prod..origin/dev` and classify it.
- Diverged histories: allowed only when a conflict-free hypothetical merge of current `prod` into current `dev` produces exactly the current `dev` tree.
- If `prod` contains content missing from `dev`, the merge conflicts, or safety cannot be proven: block before publication authorization.

Release-only merge history is therefore acceptable; production-only content missing from `dev` is not.

## 10. CMS publication classifier

`tools/cms-publication-scope.mjs` classifies the full current diff as `CMS_CONTENT`, `CMS_MEDIA`, `CMS_GENERATED`, `ENGINEERING` or `UNKNOWN`.

Only an entirely allowed CMS content/media/generated diff can proceed. Any engineering, unknown or mixed engineering/CMS diff uses the normal engineering release path. `tools/ci/change-scope.mjs` selects verification coverage and does not grant publication permission.

## 11. Publication PR behavior

After topology and scope authorization, `Подготовить публикацию` should create or reuse an open `dev -> prod` PR and stop. It must not merge that PR or deploy production automatically.

The final merge/release to `prod` is a separate controlled action. A push to `prod` then triggers the explicit production Pages workflow.

## 12. Engineering release versus CMS publication

Use CMS publication only for explicit CMS-owned content/media plus allowed deterministic generated metadata.

Use normal engineering flow for TypeScript/runtime, CSS/HTML architecture, `.pages.yml`, workflows, tooling/classifiers, tests, docs/`AGENTS.md`, package/build configuration and any mixed/unknown diff.

## 13. Branch protection readiness

Repository rulesets/protection are external configuration. Before relying on them, verify live GitHub state rather than copying a dated claim into this document.

`prod` should block deletion and force-push/history rewrite and permit only controlled release updates.

`dev` should block deletion and destructive history rewrite while still permitting legitimate direct Pages CMS writes and the existing bot/media-normalization writes required by the CURRENT model.

Do not claim these controls are active until repository state confirms them.

## 14. Media Catalog operations

Registered media metadata lives under `src/content/media-catalog/registered/*.json`. New uploads use `public/media/catalog/*` plus `src/content/media-catalog/uploads/*.json`.

Tooling owns width/height/MIME/size/duration and generated delivery metadata. Editorial catalog metadata must survive deterministic sync, and catalog defaults must not silently overwrite placement-specific captions/alt/layout.

## 15. Emergency rules

If a CMS save breaks `dev`, do not publish it. Fix or revert through normal Git history and rerun the appropriate verification.

If a bad change reaches `prod`, use a normal revert/fix release. Do not force-push or reset permanent branches.

If publication is blocked by `ENGINEERING`, `UNKNOWN` or unsafe branch topology, do not bypass the gate.

## 16. Routine CMS publication checklist

```text
[ ] CURRENT Pages CMS source branch is dev
[ ] only intended authored/media fields changed
[ ] optional empty copy is actually empty, not a whitespace placeholder
[ ] Проверить сайт / relevant verification is green when required
[ ] topology contains no production-only content missing from dev
[ ] trusted prod classifier authorizes the complete prod..dev diff
[ ] dev -> prod PR exists
[ ] PR checks/diff are reviewed
[ ] separate controlled merge/release to prod
[ ] Pages deployment from prod is green
```
