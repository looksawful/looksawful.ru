# Tooling pipeline

Status: CURRENT operational map. See `docs/README.md` for documentation authority/classification.

This document records the current command/workflow contracts that matter for routine development and CMS operation. It intentionally avoids duplicating the full CI implementation.

## Local development

Use Node 24. Install dependencies with `npm ci` when the lockfile/dependencies are not already installed.

`npm run dev` currently runs Vite directly.

`npm run build` is the ordinary fail-closed local build: it runs strict TypeScript checking first and then delegates to `npm run build:site`.

`npm run build:site` remains the production site-build stage used by CI after typecheck has already run. It runs the CMS generated-option check, Vite production build and site postbuild without repeating TypeScript checking. Site postbuild generates the sitemap and validates metadata/local links.

### Lightweight clones

Routine engineering development does not require downloading the complete repository history. Prefer a partial clone of the integration branch:

```bash
git clone --filter=blob:none --single-branch --branch dev https://github.com/looksawful/looksawful.ru.git
```

This keeps historical blobs lazy while checking out the complete current `dev` tree. For disposable CI-like work where history is not needed at all, use a shallow clone:

```bash
git clone --depth=1 --single-branch --branch dev https://github.com/looksawful/looksawful.ru.git
```

If a shallow working copy later genuinely needs complete history, opt into it explicitly with `git fetch --unshallow` rather than paying that cost on every clone.

Large source masters and archives belong outside Git. `npm run check:repo-growth` rejects tracked heavyweight source formats, legacy/generated media roots and files above the repository limits before they become routine history.

Git LFS is intentionally not used for the GitHub Pages media contract. Do not add LFS attributes for `public/media/**`; GitHub Pages delivery must continue to receive normal web-ready files. Heavy masters should live outside the repository instead of moving into LFS while Pages remains the production host.

## Fast verification

`npm test` and `npm run test:fast` run the repository's fast Node-test group.

`npm run typecheck` runs TypeScript checking. `npm run build:site` is the production site build contract used by the current fast CI flow, where typecheck remains a separate preceding step to avoid duplicate work.

The current Pages CMS `Проверить сайт` actions dispatch `.github/workflows/ci-fast.yml` at explicit `ref: dev`. Fast CI performs the repository-growth guard and existing media-state cache/recovery guard, then typecheck, fast tests and `build:site`.

Important: this verifies `dev`. It does **not** prove an editorial batch that still exists only on `content/text-cms`. #451 owns the missing safe branch-specific pre-integration verification/reconciliation contract.

## CMS / editorial branch behavior

Project branch policy is explicit:

```text
engineering: feature/fix/chore -> dev -> separate release -> prod
editorial: content/text-cms -> explicit READY/"готово" -> dev -> separate release -> prod
```

`content/text-cms` is permanent, not a disposable temporary branch. It currently exists but must be deliberately reconciled with fresh `dev` before the next authoring cycle. Do not force-reset it and do not silently rebase under an open editor.

`.github/workflows/ci-fast.yml` listens to pushes on `dev`, but deliberately ignores configured CMS text/content paths and media paths that have their own handling. That behavior applies at the integration branch. It does not create verification for unintegrated `content/text-cms` commits.

Pull requests targeting `dev` remain part of the normal engineering verification path.

## CMS media mutation

The current mutation workflow is `.github/workflows/cms-media.yml` (`CMS media`). It is explicitly tied to `dev` media/content paths.

It can normalize catalog metadata and generated media state, but persistence is guarded to explicit allowed paths. Before writing back it confirms `origin/dev` still matches the source SHA and pushes non-force to `dev`. Verification workflows themselves should not gain arbitrary mutation behavior.

Because the permanent editorial branch is `content/text-cms`, this existing dev-only mutation path must not be mistaken for branch-specific authoring validation. #451 owns the reconciliation/integration boundary; any future branch-specific media tooling must preserve the same generated ownership and fail-closed write guards.

CMS media checks out the source SHA shallowly and fetches only the exact previous push commit needed for diffing and cache comparison. It does not require complete repository history.

Source masters remain preserved; generated technical metadata and derivatives remain tooling-owned. Size limits and upload ownership are documented in `docs/media-upload-policy.md`.

## Local Content / Media Desk

`npm run desk` is currently a **write-capable** operator mode, not a read-only browser. Its launcher enables `CONTENT_DESK_WRITE=1` / `VITE_CONTENT_DESK_WRITE=1`, and startup runs `media:ensure`, which may synchronize derived media state before the UI opens.

The current local HTTP contract is documented in `docs/content-media-desk-api.md`.

#451/#452/#453 own safer operation: permanent `content/text-cms` provenance and explicit ready gate, read-only-by-default launch, guarded write activation, revision-aware conflict handling and atomic persistence. Do not describe those protections as executable current behavior until code/tests prove them.

## CMS publication

Authoring, integration and publication trust are intentionally separate:

```text
editorial authoring branch: content/text-cms
integration branch: dev
trusted publication workflow ref: prod
production deployment branch: prod
```

A content batch remains on `content/text-cms` until explicit user `готово`, then is reconciled/validated and integrated into fresh `dev`. Publication preparation begins only from the resulting validated `dev` state.

`Подготовить публикацию` must validate current `dev`/`prod` topology and the full candidate publication scope using trusted `prod` policy, then create/reuse a `dev -> prod` PR. It must not publish directly from `content/text-cms`, perform the merge, or deploy production itself.

Publication starts from shallow `prod`/`dev` tips. When their trees differ and the common history is not yet available, the workflow deepens history in bounded stages before using a full-history fallback. The content-aware topology guard remains fail-closed.

The publication classifier is separate from ordinary CI change classification: verification coverage is not publication authorization.

## Production deployment

`.github/workflows/pages.yml` remains explicitly tied to `prod` by both its push branch and job guard. It checks out the exact production SHA and builds/deploys that production state. The repository default branch must not weaken or implicitize this explicit `prod` deployment contract.

## Default-branch assumptions

The GitHub repository default branch is currently `dev`. Operational branch names remain explicit and must not depend on that repository setting:

- engineering integration and existing development automation explicitly target `dev`;
- permanent editorial authoring policy uses `content/text-cms` before integration to `dev`;
- production deployment and trusted CMS publication policy explicitly target `prod`;
- Dependabot explicitly targets `dev`.

If the GitHub default branch changes in the future, these operational contracts must be reviewed explicitly rather than inheriting the new default implicitly.
