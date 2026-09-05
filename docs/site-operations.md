# Site operations

This is the operating reference for `looksawful.ru` CMS/content/media publication. Architecture and ownership rules are defined in `docs/cms-architecture.md`; the shorter owner-facing manual is `docs/cms-handbook.md`.

## 1. Permanent branches

- `content/text-cms` — permanent manual Pages CMS staging branch for text/copy editing only.
- `dev` — working/integration branch and the source used by the existing publication flow.
- `prod` — production/release branch and trusted source of CMS publication authorization policy.

GitHub Pages production deployment remains explicitly tied to `prod`. The repository default branch is `dev`; that repository setting is separate from the manual text-staging role of `content/text-cms`.

Normal text-editing flow:

```text
Pages CMS text editing on content/text-cms
  -> Save (real CMS microcommits on the permanent staging branch)
  -> owner requests transfer
  -> re-read current content/text-cms and latest dev
  -> isolate intended/approved editorial changes
  -> create a temporary integration branch from latest dev
  -> apply only those editorial values
  -> review diff / relevant checks / PR to dev
  -> controlled merge to dev
  -> when no CMS edits remain pending, sync content/text-cms tree back to latest dev without force-push
  -> existing trusted dev -> prod publication flow
  -> GitHub Pages deployment from prod
```

`content/text-cms` must not be merged wholesale into `dev` and must not be used as the head branch of an ordinary merge PR. It is permanent, while the repository may automatically delete merged PR branches. Pages CMS must not be used as the ordinary editor for `prod`.

## 2. Responsibility boundaries

Pages CMS edits explicitly configured authored content and metadata plus configured source-media surfaces. It does not own routes/slugs/canonical URLs, stable domain IDs, layout/CSS, runtime/component implementation, generated media output, build/deployment architecture or publication policy.

The permanent `content/text-cms` workflow is intentionally narrower than the full CMS surface: it is the manual staging branch for text/copy work. A CMS save that also changes visibility, media fields, JSON shape or other non-text data does not make those changes automatically approved for transfer to `dev`.

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

The `content/text-cms` branch does not replace the existing media mutation contract. Media-source changes and normalization remain on their current `dev`-bound workflow unless a separate reviewed engineering change explicitly changes that architecture.

## 5. Saving in Pages CMS

For manual text editing, select `content/text-cms`. `Save` creates a real Git commit on that permanent staging branch; many small CMS commits are acceptable.

A save on `content/text-cms` does not change `dev`, does not deploy production and should not be treated as authorization to transfer every changed field. The owner decides when the editing session is ready to transfer.

When transferring, compare the staging state against its last synchronization point, not merely against an old historical branch base. Re-read live branch heads immediately before applying changes because parallel work may have advanced `dev`.

Media-source changes can invoke the separate `CMS media` workflow on `dev`, which may persist only its explicitly allowed normalized/generated metadata and uses a non-force update guard.

## 6. Проверить сайт

Configured `Проверить сайт` actions dispatch `ci-fast.yml` using explicit `ref: dev`, so they validate `dev`, not the text staging branch.

Text staged in `content/text-cms` is therefore validated after it has been copied onto a fresh temporary integration branch/PR based on current `dev`, or after it reaches `dev`. The current Fast CI contract includes TypeScript, fast tests and a production site build, with its existing media-state recovery/validation path.

The action does not publish production.

## 7. Подготовить публикацию — trust model

The global Pages CMS action dispatches:

```text
workflow: pages-cms-publish.yml
ref: prod
```

The intended publication invariant remains:

```text
manual text staging = content/text-cms
publication source = dev
publication policy source = prod
classifier source = prod
```

`content/text-cms` has no direct publication authority. Its text must first be integrated into current `dev` through the controlled staging-transfer flow. The trusted workflow then validates current `prod`/`dev` topology and the complete changed-file set before a publication PR may be created or reused.

## 8. Branch topology gate

The topology guard is `tools/cms-publication-topology.mjs` and continues to reason only about `prod` and `dev`.

- Identical refs or identical trees: successful no-op.
- `prod` ancestor of `dev`: inspect `origin/prod..origin/dev` and classify it.
- Diverged histories: allowed only when a conflict-free hypothetical merge of current `prod` into current `dev` produces exactly the current `dev` tree.
- If `prod` contains content missing from `dev`, the merge conflicts, or safety cannot be proven: block before publication authorization.

Release-only merge history is therefore acceptable; production-only content missing from `dev` is not. The text staging branch is deliberately outside this production trust boundary.

## 9. CMS publication classifier

`tools/cms-publication-scope.mjs` classifies the full current `prod..dev` diff as `CMS_CONTENT`, `CMS_MEDIA`, `CMS_GENERATED`, `ENGINEERING` or `UNKNOWN`.

Only an entirely allowed CMS content/media/generated diff can proceed. Any engineering, unknown or mixed engineering/CMS diff uses the normal engineering release path. `tools/ci/change-scope.mjs` selects verification coverage and does not grant publication permission.

Staging a text value in `content/text-cms` never bypasses this classifier. Only the values actually integrated into `dev` become candidates for publication.

## 10. Publication PR behavior

After topology and scope authorization, `Подготовить публикацию` should create or reuse an open `dev -> prod` PR and stop. It must not merge that PR or deploy production automatically.

The final merge/release to `prod` is a separate controlled action. A push to `prod` then triggers the explicit production Pages workflow.

## 11. Engineering release versus CMS publication

Use the staging-transfer flow for manual text/copy edits from `content/text-cms` into `dev`.

Use CMS publication only for explicit CMS-owned content/media plus allowed deterministic generated metadata already present in `dev`.

Use normal engineering flow for TypeScript/runtime, CSS/HTML architecture, `.pages.yml`, workflows, tooling/classifiers, tests, docs/`AGENTS.md`, package/build configuration and any mixed/unknown diff.

## 12. Branch protection readiness

Repository rulesets/protection are external configuration. Before enabling or changing them, preserve the operating model:

`prod` should block deletion and force-push/history rewrite and permit only controlled release updates.

`dev` should block deletion and destructive history rewrite while still permitting legitimate integration and the existing bot/media-normalization writes.

`content/text-cms` should be treated as permanent: block deletion and destructive history rewrite while still permitting ordinary Pages CMS saves and non-force synchronization commits after successful transfers. Do not require this staging branch to become a production publication source.

Do not claim these controls are active until repository state confirms them.

## 13. Media Catalog operations

Registered media metadata lives under `src/content/media-catalog/registered/*.json`. New uploads use `public/media/catalog/*` plus `src/content/media-catalog/uploads/*.json`.

Tooling owns width/height/MIME/size/duration and generated delivery metadata. Editorial catalog metadata must survive deterministic sync, and catalog defaults must not silently overwrite placement-specific captions/alt/layout.

## 14. Staging synchronization rules

After a successful text transfer to `dev`, synchronize `content/text-cms` only if a fresh comparison proves that no new or unapproved CMS edits appeared while the integration was running.

Routine synchronization must preserve history and must not use force-push, rebase or history rewrite. A merge/sync commit whose resulting tree equals the current `dev` tree is acceptable. If new staging edits appeared, leave them intact for the next editorial cycle instead of overwriting them.

Because merged PR branches may be deleted automatically, always use a disposable integration branch for the PR. Never submit `content/text-cms` itself as the PR head.

## 15. Emergency rules

If a CMS save breaks or contains accidental changes in `content/text-cms`, do not transfer it wholesale. Isolate or revert the staging mistake through normal history.

If a bad change reaches `dev`, fix or revert it through normal Git history and rerun the appropriate verification.

If a bad change reaches `prod`, use a normal revert/fix release. Do not force-push or reset permanent branches.

If publication is blocked by `ENGINEERING`, `UNKNOWN` or unsafe branch topology, do not bypass the gate.

## 16. Routine text transfer and publication checklist

```text
[ ] Pages CMS text staging branch is content/text-cms
[ ] owner has finished/approved the editing batch
[ ] current content/text-cms and dev heads were re-read
[ ] staging diff was reduced to intended/approved text values only
[ ] temporary integration branch was created from latest dev
[ ] relevant verification/PR checks are green
[ ] integration PR was merged to dev
[ ] no new pending staging edits appeared during integration
[ ] content/text-cms was synchronized to latest dev without history rewrite
[ ] trusted prod classifier authorizes the complete prod..dev publication diff when publishing
[ ] dev -> prod PR exists when publishing
[ ] separate controlled merge/release to prod
[ ] Pages deployment from prod is green
```
