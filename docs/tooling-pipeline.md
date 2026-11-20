# Tooling pipeline

Status: CURRENT operational map. See `docs/README.md` for documentation authority/classification.

This document records the current command/workflow contracts that matter for routine development and manual content/media operation. It intentionally avoids duplicating the full CI implementation.

## Local development

Use Node 24. Install dependencies with `npm ci` when the lockfile/dependencies are not already installed.

`npm run dev` currently runs Vite directly.

`npm run build` is the ordinary fail-closed local build: it runs strict TypeScript checking first and then delegates to `npm run build:site`.

`npm run build:site` remains the production site-build stage used by CI after typecheck has already run. It runs Vite production build and site postbuild without repeating TypeScript checking. Site postbuild generates the sitemap and validates metadata/local links.

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

Fast CI runs on configured engineering `dev` pushes and PRs. It checks repository growth, exact media cache/recovery, typecheck, the complete fast allowlist and site build. Fast tests bound child concurrency to four processes to avoid exhausting Windows process creation; no selected tests are skipped.

## Manual content and media

Permanent branches: `dev` for code, authored content and private Lab/Storybook; `prod` for the separately protected public release. Pages CMS, Content Desk and Media Desk launchers/write interfaces are retired. See `docs/site-operations.md` for ownership and external retirement boundaries.

`.github/workflows/media-preparation.yml` listens to explicit `dev` media/content paths. It normalizes catalog metadata, generates affected images or required video/media output, verifies exact cache state and persists only allowed metadata paths. Writeback requires the source SHA still to equal `origin/dev` and uses a non-force push.

The workflow checks out the source SHA shallowly and fetches the exact previous push commit. Full history is unnecessary. Preserve masters; builders own generated output. Validate with `media:catalog:check`, `media:page-usage:check`, `media:static-usage:check`, `test:media:contract` and `test:media:checks`.

## Private Lab and Storybook

`npm run lab` starts local Lab. `npm run lab:build` builds private Lab, integrated Storybook (`lab:system`) and inventory (`lab:inventory`). Do not substitute a nonexistent standalone Storybook command or publish Lab with the public site. See `docs/private-lab.md`.

## Production deployment

`.github/workflows/pages.yml` remains explicitly tied to `prod` by both its push branch and job guard. It checks out the exact production SHA and builds/deploys that production state. The repository default branch must not weaken or implicitize this explicit `prod` deployment contract.

## Default-branch assumptions

The GitHub repository default branch is currently `dev`. Operational branch names remain explicit and must not depend on that repository setting:

- engineering integration and existing development automation explicitly target `dev`;
- manually authored content is edited and verified in `dev`;
- production deployment explicitly target `prod`;
- Dependabot explicitly targets `dev`.

If the GitHub default branch changes in the future, these operational contracts must be reviewed explicitly rather than inheriting the new default implicitly.
