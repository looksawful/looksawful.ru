# Tooling pipeline

This document records the current command/workflow contracts that matter for routine development and CMS operation. It intentionally avoids duplicating the full CI implementation.

## Local development

Use Node 24. Install dependencies with `npm ci` when the lockfile/dependencies are not already installed.

`npm run dev` currently runs Vite directly.

`npm run build:site` runs the CMS generated-option check, Vite production build and site postbuild. Site postbuild applies CV content, generates the sitemap and validates metadata/local links. `npm run typecheck` remains a separate explicit command.

## Fast verification

`npm test` and `npm run test:fast` run the repository's fast Node-test group.

`npm run typecheck` runs TypeScript checking. `npm run build:site` is the production site build contract used by the current fast CI flow.

The Pages CMS `Проверить сайт` actions dispatch `.github/workflows/ci-fast.yml` at `ref: current`. Fast CI performs its existing media-state cache/recovery guard, then typecheck, fast tests and `build:site`.

## CMS push behavior

`.github/workflows/ci-fast.yml` listens to pushes on `dev`, but deliberately ignores the configured CMS text/content paths and media paths that have their own handling. Therefore a normal text-only CMS save does not automatically run Fast CI merely because it created a commit.

Use `Проверить сайт` when a manual fast verification is needed. Pull requests targeting `dev` or `prod` are still in the Fast CI PR trigger.

## CMS media mutation

The current mutation workflow is `.github/workflows/cms-media.yml` (`CMS media`). It is explicitly tied to `dev` media/content paths.

It can normalize catalog metadata and generated media state, but persistence is guarded to explicit allowed paths. Before writing back it confirms `origin/dev` still matches the source SHA and pushes non-force to `dev`. Verification workflows themselves should not gain arbitrary mutation behavior.

Source masters remain preserved; generated technical metadata and derivatives remain tooling-owned. Size limits and upload ownership are documented in `docs/media-upload-policy.md`.

## CMS publication

Pages CMS editing and publication trust are intentionally separate:

```text
edit/save branch: dev
trusted publication workflow ref: prod
production deployment branch: prod
```

`Подготовить публикацию` must validate current branch topology and the full `prod..dev` publication scope using trusted `prod` policy, then create/reuse a `dev -> prod` PR. It must not perform the merge/deploy itself.

The publication classifier is separate from ordinary CI change classification: verification coverage is not publication authorization.

## Production deployment

`.github/workflows/pages.yml` remains explicitly tied to `prod` by both its push branch and job guard. It checks out the exact production SHA and builds/deploys that production state. Changing the repository default branch must not weaken or implicitize this explicit `prod` deployment contract.

## Default-branch assumptions

Repository default-branch choice is not used as a substitute for operational branch names:

- development/CMS automation should explicitly target `dev`;
- production deployment and trusted CMS publication policy should explicitly target `prod`;
- Dependabot should explicitly target `dev`.

This keeps behavior stable if the GitHub repository default branch is later changed from `prod` to `dev`.
