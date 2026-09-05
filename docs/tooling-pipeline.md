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

`Проверить сайт` does not validate unsynchronized text that exists only on `content/text-cms`. Staged copy is validated after it is applied to a temporary integration branch based on current `dev`, where the normal PR checks can run, or after it reaches `dev`.

## Manual text staging

`content/text-cms` is a permanent manual Pages CMS branch for text/copy editing. It is not an integration, publication or deployment branch.

Normal transfer is deliberately two-stage:

```text
content/text-cms
  -> owner-approved text diff
  -> disposable integration branch created from latest dev
  -> checks / PR
  -> dev
```

Do not merge `content/text-cms` wholesale into `dev`. Do not use it as the head of an ordinary merge PR, because repository settings may automatically delete merged PR branches. After a successful transfer, synchronize the permanent branch back to the latest `dev` tree only when a fresh comparison shows that no new CMS edits remain pending. Routine synchronization preserves history and is non-force.

## CMS push behavior

`.github/workflows/ci-fast.yml` listens to pushes on `dev`, but deliberately ignores the configured CMS text/content paths and media paths that have their own handling. A text-only save on `content/text-cms` does not create a `dev` push at all, and therefore does not run the `dev` push pipeline.

Use the temporary integration PR to obtain normal PR verification for staged text. Pull requests targeting `dev` or `prod` remain in the Fast CI PR trigger.

## CMS media mutation

The current mutation workflow is `.github/workflows/cms-media.yml` (`CMS media`). It is explicitly tied to `dev` media/content paths.

The permanent `content/text-cms` branch does not replace or broaden this media contract. It is for manual text staging. Media uploads, normalization and generated metadata continue through the existing `dev`-bound workflow unless a separate engineering change explicitly redesigns that system.

The media workflow can normalize catalog metadata and generated media state, but persistence is guarded to explicit allowed paths. Before writing back it confirms `origin/dev` still matches the source SHA and pushes non-force to `dev`. Verification workflows themselves should not gain arbitrary mutation behavior.

CMS media checks out the source SHA shallowly and fetches only the exact previous push commit needed for diffing and cache comparison. It does not require complete repository history.

Source masters remain preserved; generated technical metadata and derivatives remain tooling-owned. Size limits and upload ownership are documented in `docs/media-upload-policy.md`.

## CMS publication

Manual text editing, integration, publication trust and production deployment are intentionally separate:

```text
manual text edit/save branch: content/text-cms
integration/publication source: dev
trusted publication workflow ref: prod
production deployment branch: prod
```

Text on `content/text-cms` has no direct publication authority. It must first be copied as approved editorial values onto a fresh integration branch based on current `dev`, pass the relevant checks and be merged to `dev`.

`Подготовить публикацию` continues to validate current branch topology and the full `prod..dev` publication scope using trusted `prod` policy, then create/reuse a `dev -> prod` PR. It must not perform the merge/deploy itself.

Publication starts from shallow `prod`/`dev` tips. When their trees differ and the common history is not yet available, the workflow deepens history in bounded stages before using a full-history fallback. The content-aware topology guard remains fail-closed.

The publication classifier is separate from ordinary CI change classification: verification coverage is not publication authorization. The staging branch is outside this classifier until approved values have reached `dev`.

## Production deployment

`.github/workflows/pages.yml` remains explicitly tied to `prod` by both its push branch and job guard. It checks out the exact production SHA and builds/deploys that production state. Changing the repository default branch must not weaken or implicitize this explicit `prod` deployment contract.

## Default-branch assumptions

Repository default-branch choice is not used as a substitute for operational branch names:

- ordinary development and integration explicitly target `dev`;
- manual Pages CMS text staging explicitly targets `content/text-cms`;
- existing CMS media automation explicitly targets `dev`;
- production deployment and trusted CMS publication policy explicitly target `prod`;
- Dependabot explicitly targets `dev`.

This keeps behavior stable even though the repository default branch is currently `dev`, and keeps the permanent text-staging branch isolated from concurrent engineering work.
