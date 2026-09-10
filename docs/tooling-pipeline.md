# Tooling pipeline

This document records the current command/workflow contracts that matter for routine development and CMS operation. It intentionally avoids duplicating the full CI implementation.

## Local development

Use Node 24. Install dependencies with `npm ci` when the lockfile/dependencies are not already installed.

`npm run dev` currently runs Vite directly.

`npm run build` is the ordinary fail-closed local build: it runs strict TypeScript checking first and then delegates to `npm run build:site`.

`npm run build:site` remains the production site-build stage used by CI after typecheck has already run. It runs the CMS generated-option check, Vite production build and site postbuild without repeating TypeScript checking. Site postbuild generates the sitemap and validates metadata/local links.

### Lightweight clones

Routine development does not require downloading the complete repository history. Prefer a partial clone of the development branch:

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

The Pages CMS `Проверить сайт` actions dispatch `.github/workflows/ci-fast.yml` at explicit `ref: dev`. Fast CI performs the repository-growth guard and existing media-state cache/recovery guard, then typecheck, fast tests and `build:site`.

## CMS push behavior

`.github/workflows/ci-fast.yml` listens to pushes on `dev`, but deliberately ignores the configured CMS text/content paths and media paths that have their own handling. Therefore a normal text-only CMS save does not automatically run Fast CI merely because it created a commit.

Use `Проверить сайт` when a manual fast verification is needed. Pull requests targeting `dev` or `prod` are still in the Fast CI PR trigger.

## CMS media mutation

The current mutation workflow is `.github/workflows/cms-media.yml` (`CMS media`). It is explicitly tied to `dev` media/content paths.

It can normalize catalog metadata and generated media state, but persistence is guarded to explicit allowed paths. Before writing back it confirms `origin/dev` still matches the source SHA and pushes non-force to `dev`. Verification workflows themselves should not gain arbitrary mutation behavior.

CMS media checks out the source SHA shallowly and fetches only the exact previous push commit needed for diffing and cache comparison. It does not require complete repository history.

Source masters remain preserved; generated technical metadata and derivatives remain tooling-owned. Size limits and upload ownership are documented in `docs/media-upload-policy.md`.

## CMS publication

Pages CMS editing and publication trust are intentionally separate:

```text
edit/save branch: dev
trusted publication workflow ref: prod
production deployment branch: prod
```

`Подготовить публикацию` must validate current branch topology and the full `prod..dev` publication scope using trusted `prod` policy, then create/reuse a `dev -> prod` PR. It must not perform the merge/deploy itself.

Publication starts from shallow `prod`/`dev` tips. When their trees differ and the common history is not yet available, the workflow deepens history in bounded stages before using a full-history fallback. The content-aware topology guard remains fail-closed.

The publication classifier is separate from ordinary CI change classification: verification coverage is not publication authorization.

## Production deployment

`.github/workflows/pages.yml` remains explicitly tied to `prod` by both its push branch and job guard. It checks out the exact production SHA and builds/deploys that production state. Changing the repository default branch must not weaken or implicitize this explicit `prod` deployment contract.

## Default-branch assumptions

Repository default-branch choice is not used as a substitute for operational branch names:

- development/CMS automation should explicitly target `dev`;
- production deployment and trusted CMS publication policy should explicitly target `prod`;
- Dependabot should explicitly target `dev`.

This keeps behavior stable if the GitHub repository default branch is later changed from `prod` to `dev`.
