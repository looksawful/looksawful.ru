# looksawful.ru — static MPA architecture design

## Goal

Convert the current portfolio from a homepage-centric Vite build into a static multi-page architecture without redesigning the site or changing authored copy. Keep the current production infrastructure intact: media registry/builders, motion, captions, lightbox/decks/reels, analytics, SEO/postbuild validation, sitemap generation, Pages CMS project cards, CV, Lighthouse, and GitHub Pages deployment.

## Source branch and constraints

Implementation starts from the current `prod` branch. `dev` is not treated as the canonical source because production infrastructure has moved ahead. Work happens on `feat/site-mpa-architecture`.

Do not change user-facing copy, captions, credits, labels, project names, typography, spacing, colors, media ordering, component behavior, or responsive design except for narrowly scoped fixes required to make the existing presentation work on standalone routes. Follow `AGENTS.md` media/caption/runtime contracts.

## Existing domain model

The existing catalog remains the source of truth for semantic entities:

- `Case` — large narrative case study; current primary cases include Jestei Pool, Styx, Sensetique.
- `Project` — concrete work; may belong to a Case or Collection, or stand alone.
- `Collection` — aggregation; Shootings is represented as a collection rather than a Case.
- `Engagement` — period/relationship with a client; never automatically becomes a Project page.
- `Client` and taxonomy — metadata and relationships.

`src/content/projects.json` and `src/data/projects.ts` remain presentation data for the four homepage project cards and must not replace the domain catalog.

## Page layer

Add a dedicated `src/site/` layer with:

- strongly typed page definitions/manifest;
- route validation;
- entity-aware renderer registry;
- shared page shell and metadata renderer;
- Vite MPA input/build helpers;
- homepage presentation configuration separate from domain data.

The page manifest answers which entities have URLs and whether a page is listed/indexable. Domain entities do not receive routing/navigation/SEO fields merely for the page system.

Use discriminated unions for `case`, `project`, `collection`, `home`, static pages, and `not-found`. Case/Project/Collection page definitions reference existing typed IDs.

## Routes

Use physical directory routes that build to `dist/<path>/index.html`, compatible with direct navigation and refresh on GitHub Pages. Initial public portfolio routes are expected to include:

- `/`
- `/work/jestei-pool/`
- `/work/styx/`
- `/work/sensetique/`
- `/shootings/`
- selected standalone Project routes only where complete content already exists
- existing `/cv/`
- `404.html`

Existing public URLs discovered during implementation take precedence; do not create duplicate canonicals.

## Rendering model

Content is stored once and may have multiple renderers. The homepage initially keeps its current full project presentations while standalone pages render the same source content in isolation.

Do not create separate duplicated data files for homepage vs detail pages. Do not implement compact homepage presentation by rendering a full case and hiding it with CSS. Compact rendering is deferred but the architecture must allow a future smaller DOM/media renderer.

Large cases keep explicit compositions built from the existing templates. Do not replace their art-directed structure with a generic CMS section schema.

## Vite refactor

Move project-specific imports and slot composition out of `vite.config.ts`. Vite config should become infrastructure-only: configure the site page plugin/build inputs and other general Vite settings.

The existing slot replacement utilities may be reused inside page/home renderers where useful, but the Vite config itself must not know individual Jestei/Styx/Sensetique/Shootings sections.

## Shared shell and metadata

New portfolio pages use a build-time shell that centralizes document structure, navigation, global CSS/JS references, body page attributes, and SEO metadata.

Reuse the existing production origin `https://www.looksawful.ru` and integrate with existing `tools/site-html-utils.mjs`, sitemap, site-meta, and local-link checks. Public/indexable pages receive title, description, canonical, robots policy and Open Graph metadata. Unlisted pages use `noindex` and are excluded from sitemap.

The existing `/cv/` remains owned by `public/cv/` during this migration to avoid output collisions and visual regressions; its existing smoke test remains mandatory.

## Runtime

Audit `src/main.js`, `src/interactive.js`, `src/motion.ts`, and components as global, DOM-discovered, homepage-only, or project-specific. Shared initialization must no-op when targets are absent.

Heavy project-specific runtime should be dynamically loaded when a matching DOM contract exists, where that avoids unrelated project code on standalone pages. Preserve analytics, BFCache/pagehide handling, reduced-motion behavior, media runtime health, caption numbering, `data-caption-view`, PhotoSwipe/lightbox behavior, media decks/reels, page flip, before/after, autoplay video, Jestei theme organism, expertise/experience mounts, and generated-media contracts.

## Homepage

The first production migration keeps the homepage visually and structurally equivalent to the current production baseline. Full Jestei, Styx, Sensetique and Shootings presentations remain available on the homepage. The project cards may link to new standalone routes only after those routes are complete and verified.

## Testing and verification

Before and after the migration, preserve/extend the existing verification pipeline. Add tests for:

- page-manifest uniqueness and valid entity references;
- enabled page → renderer mapping;
- generated HTML existence for enabled routes;
- metadata/canonical/indexability contracts;
- sitemap inclusion/exclusion;
- local links;
- direct route load and reload;
- document overflow;
- image decode and video metadata;
- canvas health;
- lightbox;
- media decks/reels/sliders;
- page flip;
- before/after;
- motion/reduced motion;
- absence of unrelated project DOM/media on standalone pages.

Keep the existing full homepage viewport matrix. Use a smaller representative matrix for each standalone entity page. Preserve `tools/smoke-cv.mjs`.

Final gate: `npm run verify`, `npm run check:site-meta`, `npm run check:links`, and `git diff --check`; run production/Lighthouse/external-link checks when the environment supports them. Never weaken existing tests to make the migration pass.

## Completion criteria

The work is complete when:

1. The site is a real static MPA with direct-refresh-safe physical HTML routes.
2. Case/Project/Collection/Engagement semantics remain distinct.
3. `vite.config.ts` no longer contains site-wide project composition knowledge.
4. Homepage presentation is preserved.
5. Jestei, Styx and Sensetique have standalone Case pages.
6. Shootings has a standalone Collection page.
7. The architecture supports selected standalone Project pages without new routing machinery.
8. CV remains intact.
9. Existing SEO/sitemap/link/CMS/analytics/media/motion infrastructure is preserved and integrated.
10. Standalone pages do not contain/load unrelated project content.
11. Verification and browser smoke tests pass, or any environment-blocked checks are reported exactly.