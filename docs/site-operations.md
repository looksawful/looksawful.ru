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

### Current executable baseline and remaining work

The current `dev` executable baseline already includes the core local Desk and authoring-topology safeguards that were originally tracked by #451/#452/#453:

- ordinary `npm run desk` is read-only and has no hidden `media:ensure` startup;
- `npm run desk:write` is explicit, loopback-only, rejected in CI/GitHub Actions and rejected outside exact `content/text-cms`;
- the Desk exposes mode/branch/HEAD/dirty/dev-divergence provenance;
- `tools/cms-authoring-topology.mjs` reports branch/worktree/HEAD, fresh `dev`, dirty/ahead/behind/divergence, READY state and CMS publication scope without mutating history;
- local Desk mutations use revision-aware conflict handling and transactional replacement/rollback semantics documented in `docs/content-media-desk-api.md`.

Issues #451/#452/#453 remain open and therefore still own any residual end-to-end acceptance, Pages CMS enforcement, E2E verification and closeout work. Their open state is not evidence that the safeguards above are absent.

At the 2026-09-11 reconciliation point, `content/text-cms` existed but was materially diverged from then-current `dev`; do not use that dated statement as proof of present divergence. Re-inspect fresh topology before each authoring/integration cycle. Never force-reset or silently rebase an open editing session merely to restore topology.

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

Pages CMS tooling can still technically be pointed at other branches; that capability is not authorization to bypass the project branch contract. The local Desk now fails closed outside `content/text-cms`, while Pages CMS branch-selection enforcement remains a distinct surface. #451 remains open for residual end-to-end Pages CMS/integration acceptance where executable enforcement is still incomplete.

Text-only CMS paths are intentionally ignored by the automatic `ci-fast.yml` push trigger on `dev`; this matters after integration, not as proof for an unintegrated authoring branch.

The separate `CMS media` workflow is currently tied to `dev` media/content paths. Media authored only on `content/text-cms` must not be assumed to have received that `dev` workflow merely because it exists. Use the authoring topology guard and the relevant content/media validation on the actual candidate before integration.

## 6. Local Content / Media Desk

The local Desk is a separate operator surface from Pages CMS.

Ordinary inspection:

```text
npm run desk
```

is CURRENTLY read-only. The launcher does not run `media:ensure`, sets `CONTENT_DESK_WRITE=0` / `VITE_CONTENT_DESK_WRITE=0`, binds Vite to `127.0.0.1`, and exposes READ ONLY provenance in the operator UI.

Explicit write mode:

```text
npm run desk:write
```

is accepted only on exact `content/text-cms`, outside CI/GitHub Actions and without a host override. Direct `dev`, `prod`, feature/fix branches and non-loopback host overrides fail closed before the write-capable Desk starts.

The local HTTP/write contract, request limits, `expectedRevision` conflict behavior and transactional persistence guarantees are documented in `docs/content-media-desk-api.md`.

Issues #451/#452/#453 remain open owners of any residual acceptance/closeout work. Do not describe the already-landed read-only default, guarded write activation or revision-aware transaction behavior as future-only TARGET state.

## 7. Проверить сайт

Configured `Проверить сайт` actions currently dispatch `.github/workflows/ci-fast.yml` using explicit `ref: dev`.

Therefore they validate `dev`, not an editorial batch that still exists only on `content/text-cms`. Do not use a green `dev` run as evidence for unintegrated content.

For a pre-integration candidate, `tools/cms-authoring-topology.mjs` currently checks exact authoring context, READY state, divergence and candidate scope without mutating history. Run the relevant content/media validation against the actual candidate as well. This does not turn the `dev`-only Fast CI dispatch into branch-specific CI; #451 remains open for residual end-to-end automation/acceptance where needed.

The action does not publish production.

## 8. Editorial ready gate and integration

Before explicit user `готово`, keep the batch on `content/text-cms`.

After `готово`:

1. fetch fresh `dev` and record exact SHA;
2. compare/reconcile `content/text-cms` deliberately; never force-reset and never hide conflicts through an automatic rebase under an open editor;
3. verify the changed-file set is the intended editorial/media scope;
4. run the current authoring topology guard plus relevant content/media checks;
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

Release-only merge history is therefore acceptable; production-only content missing from `dev` is not. This production topology gate does not replace the separate `content/text-cms -> dev` authoring reconciliation contract.

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
