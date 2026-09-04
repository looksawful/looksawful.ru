# Site operations

This is the operating reference for `looksawful.ru` CMS/content/media publication. Architecture and ownership rules are defined in `docs/cms-architecture.md`; the shorter owner-facing manual is `docs/cms-handbook.md`.

## 1. Permanent branches

- `dev` — working/integration branch and normal Pages CMS content source.
- `prod` — production/release branch and GitHub Pages deploy source.

Normal flow:

```text
Pages CMS on dev
  -> Save (real commit on dev)
  -> optional Проверить сайт / Fast CI
  -> normal dev -> prod pull request
  -> review / checks
  -> controlled merge to prod
  -> GitHub Pages deployment from prod
```

Pages CMS must not be used as the ordinary editor for `prod`.

## 2. Responsibility boundaries

Pages CMS edits explicitly configured authored content/metadata and configured source-media surfaces. It does not own routes/slugs/canonical URLs, stable domain IDs, CSS/layout, runtime implementation, generated media output, build/deployment architecture or engineering policy.

`.pages.yml`, `.github/**`, `tools/**`, tests, docs, `AGENTS.md` and package/build configuration are engineering changes.

## 3. Current Pages CMS content scope

Configured sources include:

```text
src/content/navigation.json
src/content/editorial/home-project-cards.json
src/content/projects.json
src/content/cases/*.json
src/content/collections/shootings.json
src/content/shootings/*.json
src/content/standalone-projects/*.json
src/content/client-logo-visibility.json
src/content/editorial/cv.json
src/content/media-catalog/registered/*.json
src/content/media-catalog/uploads/*.json
```

Stable IDs remain readonly where domain identity is fixed. Optional authored text should be empty when no copy is wanted; do not use whitespace placeholders.

## 4. Media scope

Project-card covers:

```text
public/media/projects/index/*
```

Reusable Media Catalog uploads:

```text
public/media/catalog/*
src/content/media-catalog/uploads/*.json
```

Source masters are preserved. Generated responsive/video files and technical metadata are tooling-owned. Upload policy remains in `docs/media-upload-policy.md`.

## 5. Saving in Pages CMS

`Save` creates a real commit on the selected Pages CMS branch. For normal editing use `dev`.

Text-only CMS paths may be ignored by the automatic Fast CI push trigger. A manual `Проверить сайт` action may dispatch Fast CI on `dev` when verification is wanted.

Media-source changes use the separate `CMS media` workflow. It may persist only explicit deterministic generated metadata and refuses a non-fast-forward write if `dev` advanced during processing.

## 6. Fast verification

Current Fast CI is intentionally small:

```text
npm ci
exact generated-media cache restore/verify
npm run typecheck
npm run build
```

There is no generic `test:fast` suite and no automatic media regeneration on cache miss.

A missing exact cache is repaired through `CMS media`, not inside ordinary CI.

## 7. Publishing dev to prod

The former global Pages CMS `Подготовить публикацию` helper and its topology/scope workflow have been retired.

Publication is now the normal GitHub flow:

1. review the intended `dev..prod` diff;
2. create/use a normal `dev -> prod` pull request;
3. require the current PR verification to pass;
4. merge through the normal controlled release path;
5. let `.github/workflows/pages.yml` deploy the resulting exact `prod` SHA.

Pages CMS itself does not merge or deploy production.

## 8. Production deployment

`.github/workflows/pages.yml` is explicitly tied to `prod`.

Before deploy it requires:

- exact generated-media cache integrity;
- TypeScript check;
- production build;
- production CV preparation/verification;
- compact production browser smoke.

After deploy it verifies the exact published SHA, root page, `/cv/` and built CSS/JS assets.

Production deployment does not regenerate missing media.

## 9. Engineering versus content changes

Use Pages CMS for configured authored content/media.

Use normal engineering flow for TypeScript/runtime, CSS/HTML architecture, `.pages.yml`, workflows, tooling, tests, docs/`AGENTS.md`, package/build configuration and mixed/unknown diffs.

## 10. Media Catalog operations

Registered media metadata lives under `src/content/media-catalog/registered/*.json`. New uploads use `public/media/catalog/*` plus `src/content/media-catalog/uploads/*.json`.

Tooling owns technical width/height/MIME/size/duration and generated delivery metadata. Editorial catalog metadata must survive deterministic sync, and catalog defaults must not overwrite placement-specific caption/alt/layout semantics.

## 11. Emergency rules

If a CMS save breaks `dev`, fix or revert through normal Git history. Do not publish the broken state.

If a bad change reaches `prod`, use a normal revert/fix release. Do not force-push or reset permanent branches.

Do not bypass exact-cache, typecheck, build, production smoke or post-deploy SHA checks to force a release through.

## 12. Routine publication checklist

```text
[ ] Pages CMS source branch is dev
[ ] only intended authored/media fields changed
[ ] relevant media generation/integrity is green when media changed
[ ] Fast CI is green for the dev -> prod PR
[ ] PR diff is reviewed
[ ] controlled merge/release to prod
[ ] Pages deployment from prod is green
[ ] deployed SHA matches the intended prod commit
```
