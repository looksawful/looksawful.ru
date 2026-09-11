# Site operations

Status: CURRENT operator reference. See `docs/README.md` for documentation authority/classification.

This is the operating reference for `looksawful.ru` CMS/content/media publication. Architecture and ownership rules are defined in `docs/cms-architecture.md`; the shorter owner-facing manual is `docs/cms-handbook.md`.

## 1. Permanent branches

- `dev` — GitHub default branch and working/integration branch.
- `prod` — production/release/deploy branch and trusted source of production publication authorization policy.
- `content/text-cms` — permanent editorial authoring branch for Pages CMS/content cycles.

GitHub Pages production deployment remains explicitly tied to `prod`.

Canonical editorial flow:

```text
content/text-cms
  -> Save (real editorial commits)
  -> remain isolated until explicit user READY / "готово"
  -> reconcile against fresh dev
  -> content-only validation/review
  -> controlled integration -> dev
  -> verify resulting dev
  -> separate trusted dev -> prod release preparation
  -> create/reuse dev -> prod pull request
  -> review / required checks
  -> controlled merge/release to prod
  -> GitHub Pages deployment from prod
```

Pages CMS/Desk must not use `prod` as an ordinary editor. Direct editorial saves to `dev` are also not the normal authoring policy; `dev` is the integration target after the explicit ready gate.

### Current executable gap

The policy above is authoritative, but current tooling does not yet fully enforce it. GitHub #451 owns branch provenance, safe reconciliation of the long-lived `content/text-cms` branch, branch-specific validation and the explicit ready gate. #452/#453 own Desk read/write and persistence hardening.

At the 2026-09-11 reconciliation point, `content/text-cms` exists but is materially diverged from current `dev`; do not force-reset it or silently rebase an open editing session merely to restore topology.

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

`Save` creates a real Git commit on the selected Pages CMS branch.

For a new editorial cycle, select `content/text-cms`. A save there does not integrate into `dev` and does not deploy production.

Current Pages CMS tooling can still technically be pointed at other branches; that capability is not authorization to bypass the project branch contract. #451 must make provenance/allowed-authoring-state explicit and fail closed where practical.

Text-only CMS paths are intentionally ignored by the automatic `ci-fast.yml` push trigger on `dev`; this matters after integration, not as proof for an unintegrated authoring branch.

The separate `CMS media` workflow is currently tied to `dev` media/content paths. Until #451 reconciles branch-specific validation/tooling, media authored only on `content/text-cms` must not be assumed to have received the same normalization/verification merely because that workflow exists.

## 6. Local Content / Media Desk

The local Desk is a separate operator surface from Pages CMS.

`npm run desk` is CURRENTLY write-capable: the launcher enables `CONTENT_DESK_WRITE=1` / `VITE_CONTENT_DESK_WRITE=1`, and startup runs `media:ensure`, which may synchronize derived media state before the UI opens. It is therefore not a side-effect-free read-only inspection command.

The local HTTP/write contract, limits and error behavior are documented in `docs/content-media-desk-api.md`.

TARGET hardening is owned by #451/#452/#453: `content/text-cms` provenance and explicit ready gate, read-only-by-default launch, guarded write activation, stronger source authorization, stale-write/revision conflict handling and atomic persistence. These protections must not be claimed as executable CURRENT until code/tests verify them.

## 7. Проверить сайт

Configured `Проверить сайт` actions currently dispatch `.github/workflows/ci-fast.yml` using explicit `ref: dev`.

Therefore they validate `dev`, not an editorial batch that still exists only on `content/text-cms`. Do not use a green `dev` run as evidence for unintegrated content.

#451 must define/implement the safe branch-specific pre-integration verification path. After an approved batch is integrated into `dev`, the existing Fast CI contract remains an integration/release gate.

The action does not publish production.

## 8. Editorial ready gate and integration

Before explicit user `готово`, keep the batch on `content/text-cms`.

After `готово`:

1. fetch fresh `dev` and record exact SHA;
2. compare/reconcile `content/text-cms` deliberately; never force-reset and never hide conflicts through an automatic rebase under an open editor;
3. verify the changed-file set is the intended editorial/media scope;
4. run available content/media checks, plus #451 branch-specific verification when implemented;
5. integrate through a controlled review/merge flow into `dev`;
6. verify exact resulting `dev` state;
7. only then enter production release preparation.

## 9. Подготовить публикацию — trust model

The global Pages CMS publication action belongs to the release boundary after approved authored changes are already integrated into `dev`.

The trusted policy currently executes from `prod` and should validate the complete `dev -> prod` candidate diff. It must not publish directly from `content/text-cms`.

The intended invariant is:

```text
editorial authoring = content/text-cms
integration candidate = dev
publication policy source = prod
production deployment = prod
```

Publication preparation may create or reuse an open `dev -> prod` PR and stop. It must not merge that PR or deploy production automatically.

## 10. Branch topology gate

The topology guard is `tools/cms-publication-topology.mjs`.

- Identical refs or identical trees: successful no-op.
- `prod` ancestor of `dev`: inspect `origin/prod..origin/dev` and classify it.
- Diverged histories: allowed only when a conflict-free hypothetical merge of current `prod` into current `dev` produces exactly the current `dev` tree.
- If `prod` contains content missing from `dev`, the merge conflicts, or safety cannot be proven: block before publication authorization.

Release-only merge history is therefore acceptable; production-only content missing from `dev` is not. This production topology gate does not replace the separate `content/text-cms -> dev` authoring reconciliation contract in #451.

## 11. CMS publication classifier

`tools/cms-publication-scope.mjs` classifies the full current release diff as `CMS_CONTENT`, `CMS_MEDIA`, `CMS_GENERATED`, `ENGINEERING` or `UNKNOWN`.

Only an entirely allowed CMS content/media/generated diff can proceed through CMS publication preparation. Any engineering, unknown or mixed engineering/CMS diff uses the normal engineering release path. `tools/ci/change-scope.mjs` selects verification coverage and does not grant publication permission.

## 12. Publication PR behavior

After topology and scope authorization, `Подготовить публикацию` should create or reuse an open `dev -> prod` PR and stop. It must not merge that PR or deploy production automatically.

The final merge/release to `prod` is a separate controlled action. A push to `prod` then triggers the explicit production Pages workflow.

## 13. Engineering release versus CMS publication

Use CMS publication only for explicit CMS-owned content/media plus allowed deterministic generated metadata after the batch has passed the authoring and `dev` integration gates.

Use normal engineering flow for TypeScript/runtime, CSS/HTML architecture, `.pages.yml`, workflows, tooling/classifiers, tests, docs/`AGENTS.md`, package/build configuration and any mixed/unknown diff.

Engineering implementation normally starts from fresh `dev`, integrates into `dev`, then reaches `prod` through the separate release boundary.

## 14. Branch protection readiness

Repository rulesets/protection are external configuration. Before relying on them, verify live GitHub state rather than copying a dated claim into this document.

`prod` should block deletion and force-push/history rewrite and permit only controlled release updates.

`dev` should block deletion and destructive history rewrite while supporting the actual integration mechanisms needed by the repository. Legacy direct CMS/media writers may still exist technically; that does not redefine the intended editorial authoring path through `content/text-cms`.

Do not claim controls are active until repository state confirms them.

## 15. Media Catalog operations

Registered media metadata lives under `src/content/media-catalog/registered/*.json`. New uploads use `public/media/catalog/*` plus `src/content/media-catalog/uploads/*.json`.

Tooling owns width/height/MIME/size/duration and generated delivery metadata. Editorial catalog metadata must survive deterministic sync, and catalog defaults must not silently overwrite placement-specific captions/alt/layout.

## 16. Emergency rules

If an editorial save breaks the authoring branch, fix or revert it there; do not push it into `dev` to "see whether CI catches it".

If a bad change reaches `dev`, stop production preparation, fix/revert through normal Git history and rerun verification.

If a bad change reaches `prod`, use a normal revert/fix release and safely reconcile any production-only hotfix back into `dev`. Do not force-push or reset permanent branches.

If publication is blocked by `ENGINEERING`, `UNKNOWN` or unsafe topology, do not bypass the gate.

## 17. Routine editorial publication checklist

```text
[ ] Pages CMS/editorial branch is content/text-cms
[ ] content/text-cms has been deliberately reconciled with current dev for this cycle
[ ] only intended authored/media fields changed
[ ] optional empty copy is actually empty, not a whitespace placeholder
[ ] user explicitly confirmed READY / "готово"
[ ] pre-integration validation is green for the actual batch
[ ] batch integrated into fresh dev through controlled review/merge
[ ] exact resulting dev verification is green
[ ] topology contains no production-only content missing from dev
[ ] trusted prod classifier authorizes the complete dev -> prod candidate diff
[ ] dev -> prod PR exists
[ ] PR checks/diff are reviewed
[ ] separate controlled merge/release to prod
[ ] Pages deployment from prod is green
```
