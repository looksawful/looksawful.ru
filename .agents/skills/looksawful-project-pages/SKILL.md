---
name: looksawful-project-pages
description: "Use when changing cases, projects, shootings, homepage cards, page manifests, routes, navigation, metadata, sitemap, or indexability in looksawful.ru."
---

# Looksawful Project Pages

Preserve the existing page model and separate discovery, reachability, and indexability. Read `docs/agent-context/pages.md` and `docs/site-pages.md` before changing a route or entity.

## Current model

- Use Case, Project, Collection, and Engagement. Do not add parallel `MiniProject`, `HiddenProject`, or route-only entities without an explicit architecture decision.
- `src/site/pages/manifest.ts` is the canonical page manifest and Vite input source.
- Primary navigation IDs/order are code-owned in `src/site/navigation/primary.ts`; labels are authored in `src/content/navigation.json`.
- Homepage cards use `src/content/projects.json`; fixed IDs and page relationships remain code-owned.
- Reuse existing article/content/media renderers and `src/site/renderers/home/home-slots.ts`; do not duplicate authored copy or media.

At the reviewed snapshot, listed/indexable routes are `/`, `/work/jestei-pool/`, `/work/styx/`, `/work/sensetique/`, `/shootings/`, and `/cv/`. Direct-link-only, unlisted/noindex routes are `/work/awful-cases/`, `/work/moves-awful/`, and `/work/berry-social-content-2020/`. `/cv/` uses the `public-static` build kind with source `public/cv/index.html`; `/404.html` is a Vite-built `not-found` route and is unlisted/noindex. Reconfirm this table in the current manifest before relying on it.

Direct-link-only means public and not listed/indexed; it is not access control.

## Change workflow

1. Identify the domain record, manifest entry, input, renderer, navigation relation, metadata, sitemap/local-link impact, and existing browser coverage.
2. Decide indexability separately from whether a page is reachable or discoverable.
3. Preserve stable IDs, route contracts, authored content, and progressive-enhancement HTML.
4. Add or update focused tests before implementation for behavior changes.
5. Run `npm run typecheck`, `npm run build:site`, and the relevant `test:e2e:navigation`, `test:e2e:mpa`, `test:e2e:projects`, or full suite. Use the change classifier for the final affected scope.

## Stop

Stop when a request asks CMS to create a route, changes canonical identity/slug ownership, introduces a parallel entity, conflates noindex with access control, or leaves the desired indexability/reachability behavior ambiguous.
