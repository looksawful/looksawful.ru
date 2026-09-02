# Agent Context: Pages and Routes

The detailed authority is `docs/site-pages.md`. Confirm every route and indexability claim against `src/site/pages/manifest.ts`, the page plugin, generated output, and tests.

## Domain model

Use the existing concepts Case, Project, Collection, and Engagement. Do not introduce parallel `MiniProject`, `HiddenProject`, or route-only entities without an explicit architecture decision.

## Current route categories

At the reviewed snapshot:

| Category | Routes |
|---|---|
| Public/listed/indexable | `/`, `/work/jestei-pool/`, `/work/styx/`, `/work/sensetique/`, `/shootings/`, `/cv/` |
| Public/direct-link-only, unlisted/noindex | `/work/awful-cases/`, `/work/moves-awful/`, `/work/berry-social-content-2020/` |
| Error route | `/404.html`, Vite-built `not-found`, unlisted/noindex |

`/cv/` is listed/indexable but uses the `public-static` build kind with source `public/cv/index.html`. Direct-link-only means publicly reachable and not listed/indexed; it is not access control.

## Ownership

- `src/site/pages/manifest.ts` is the canonical page manifest and Vite input source.
- Primary navigation IDs/order are code-owned in `src/site/navigation/primary.ts`; labels are authored in `src/content/navigation.json`.
- Homepage card data comes from `src/content/projects.json`, while fixed IDs and page relationships are code-owned.
- Composition belongs in existing renderers such as `src/site/renderers/home/home-slots.ts`; reuse existing article/content/media instead of duplicating it.
- Adding a Case, Collection, or Project normally requires a domain record, manifest entry, renderer/input, and appropriate browser coverage.

## Verification focus

For page work, inspect metadata, sitemap/local links, deep reloads, history/navigation, responsive output, and the affected smoke suite (`navigation`, `mpa`, `project-pages`, or full). Do not treat a CMS field as permission to change routing or indexability.
