# Site pages

This document describes the static page architecture for `looksawful.ru`.

## Core model

The domain catalog and the page system solve different problems.

### Case

A `Case` is a large narrative portfolio case. Current public Cases are:

- `jestei-pool`
- `styx`
- `sensetique`

A Case can contain many concrete Projects. Do not rename a Case to Project just because its public URL lives under `/work/`.

### Project

A `Project` is a concrete piece of work. It may belong to a Case, Collection, Engagement or Client, or it may be standalone.

Small works are ordinary Projects. Do not introduce `MiniProject`, `HiddenProject` or similar parallel entity types.

### Collection

A `Collection` groups related work. `music-photography` is the domain Collection displayed as `Shootings`.

Shootings is not a fourth Case.

### Engagement

An `Engagement` describes a relationship or period of work with a client. It is not a Project and does not automatically receive a portfolio route.

If an Engagement contains concrete work that needs a page, first normalize that work as `ProjectData`, then add a page definition for the Project.

## Responsibility boundaries

```text
Domain catalog
  what exists and how entities relate

Typed content + media registry
  authored copy and media presentation data

Page manifest
  canonical page identity, route, type, entity relation, discovery, renderer and build ownership

Discovery settings
  whether a page is listed and/or indexable

Renderer
  how the page body is composed or transformed

Page shell
  shared HTML document, metadata, navigation and page diagnostics for portfolio-rendered pages

Vite MPA
  physical HTML inputs for SitePages with build.kind = "vite"

Public-static build
  physical authored source under public/ copied to the matching dist target

Postbuild
  CMS transforms, sitemap, metadata and local-link validation

Runtime
  progressive enhancement only
```

Do not put route, canonical, navigation or homepage-mode fields into Case/Project/Collection catalog records unless they are genuinely domain data.

## Page manifest

Canonical page definitions live in:

`src/site/pages/manifest.ts`

The manifest is the source of truth for page identity, canonical route, page type, entity relation, discovery state, renderer ownership and build ownership.

Vite inputs are derived from manifest entries with `build.kind: "vite"` through:

`src/site/build/inputs.ts`

`build.kind: "public-static"` pages instead identify an authored source under `public/`. The same `sourcePath` is used to resolve their development request document and production `dist/` target through:

`src/site/build/public-static.ts`

Current public/indexable entity routes:

- `/work/jestei-pool/`
- `/work/styx/`
- `/work/sensetique/`
- `/shootings/`

Current direct-link-only Project routes:

- `/work/awful-cases/`
- `/work/moves-awful/`
- `/work/berry-social-content-2020/`

`/cv/` is a static SitePage. Its route, renderer identity and public-static build source are owned by the manifest. Its authored resume document remains `public/cv/index.html`, and its existing CMS/content transformation pipeline remains responsible for resume copy and production visibility sanitization. CV does not use the portfolio page shell or portfolio runtime.

`/404.html` is a managed static noindex page.

## Navigation

Primary navigation stores canonical SitePage identities, not independent hrefs. The fixed six-page order lives in:

`src/site/navigation/primary.ts`

`src/site/navigation/model.ts` resolves those identities through `sitePages` and obtains every menu and breadcrumb href from `SitePage.path`.

Pages CMS may edit the six navigation labels through `src/content/navigation.json`. The adapter in `src/data/navigation.ts` derives the fixed identity/order from the primary SitePage ID list; CMS does not own hrefs, routes, page type, discovery state or renderer/build mechanics.

## Discovery and indexability

Publication state is independent from entity type.

A normal public portfolio page uses:

```ts
discovery: {
  listed: true,
  indexable: true,
}
```

A direct-link-only page uses:

```ts
discovery: {
  listed: false,
  indexable: false,
}
```

Direct-link-only pages are public documents, not private documents. `noindex` is not access control.

The validator rejects an indexable unlisted page.

## Homepage

The homepage remains the full transitional portfolio page. Large Cases and Shootings are still rendered there in full.

The four CMS-managed cards come from:

`src/content/projects.json`

`src/data/projects.ts` validates that JSON as `HomeCard` presentation data, preserves the fixed card IDs and attaches a code-owned canonical `pageId` for each card.

Routing is not editable in Pages CMS. `src/site/pages/project-card-routes.ts` resolves each HomeCard's `pageId` through the canonical `sitePages` manifest instead of owning a second card-ID-to-page mapping.

This keeps CMS content and route ownership separate while making the HomeCard-to-page relationship explicit in the typed presentation model.

A future compact homepage must render less DOM and media. Do not implement compact mode by rendering a full Case and hiding most of it with CSS.

## Composition

Project-specific composition no longer belongs in `vite.config.ts`.

Homepage slot composition is owned by:

`src/site/renderers/home/home-slots.ts`

The file reuses the existing typed content modules and template renderers. It is intentionally explicit: project art direction is not forced into a generic CMS section schema.

Standalone Case and Collection pages reuse the exact homepage-rendered article and therefore share one content source.

Selected hidden Project pages reuse their existing hidden homepage article. The standalone renderer:

1. locates the source article by its authored build-time marker;
2. renders only the slots present inside that article;
3. removes the homepage-only `hidden` state;
4. assigns a diagnostic article ID;
5. promotes the existing project title to the page-level `h1`;
6. wraps the result in the shared page shell.

Do not copy project text or media into a second page-specific content module just to create a route.

## Page shell and metadata

Shared shell files:

- `src/site/shell/page-shell.ts`
- `src/site/shell/metadata.ts`
- `src/site/shell/navigation.ts`

Portfolio-rendered managed pages expose:

- `data-page-type`
- `data-page-id`
- `data-entity-id` for entity pages

Indexable pages receive canonical and Open Graph URL metadata using the centralized production origin. Public-static CV keeps its existing authored metadata document while sharing canonical SitePage route/discovery identity.

Direct-link-only Project pages and 404 receive `noindex,nofollow` and are excluded from sitemap generation.

Do not create a second production-origin constant or a parallel sitemap/metadata system.

## Adding a Case page

1. Confirm the Case exists in `src/data/catalog/cases.ts`.
2. Keep authored Case content in the existing typed content modules.
3. Ensure its homepage composition is represented by the existing template/slot system.
4. Add a typed Case page definition in `src/site/pages/manifest.ts`.
5. Add or extend the standalone render contract in `src/site/renderers/entity-page.ts`.
6. Add the physical minimal HTML input required by Vite.
7. Add route/build/composition tests.
8. Add browser smoke coverage when the page introduces a new runtime pattern.
9. Run the full verification pipeline.

## Adding a Collection page

1. Confirm the Collection exists in `src/data/catalog/collections.ts`.
2. Do not convert the Collection into a Case.
3. Add the Collection page definition to the manifest.
4. Connect its renderer to the existing Collection content.
5. Add the Vite input and tests.
6. Decide `listed` and `indexable` independently from Collection domain visibility.

## Adding a Project page

1. Confirm a concrete `ProjectData` record exists in `src/data/catalog/projects/`.
2. If only an Engagement exists, create/normalize the concrete Project first.
3. Link the Project to existing Client/Engagement/Case/Collection/taxonomy records as appropriate.
4. Reuse existing typed content and media registry entries.
5. Add the Project page definition to `src/site/pages/manifest.ts`.
6. Choose discovery settings deliberately.
7. Add a renderer contract. Prefer reusing an existing article/body over duplicating content.
8. Add the physical Vite input.
9. Add route, build, metadata and browser tests.
10. Run verification.

## Promoting an unlisted Project

To publish an existing direct-link-only Project, change page/discovery configuration rather than changing entity type or moving content.

For example:

```ts
discovery: {
  listed: true,
  indexable: true,
}
```

Then add it to navigation/homepage presentation only if the product decision requires it. Listing, indexing, homepage presence and navigation presence are separate concerns.

## CMS boundary

Pages CMS owns only the authored sources explicitly listed in `.pages.yml`, including homepage-card content, navigation labels, CV authored content, validated Case copy and the fixed Shootings overview/record text files.

CMS does not own SitePage route/path, canonical URL, page type, renderer/build ownership, listed/indexable state, Vite entries or sitemap mechanics.

Do not make arbitrary routes editable through the CMS. Card and navigation IDs remain fixed and validated.

Shootings record titles/dates are adapted into the existing domain catalog, but IDs, taxonomy relationships and record registration remain in code. Do not move the canonical domain catalog wholesale into CMS as part of ordinary page work.

## Media boundary

Follow `AGENTS.md`.

Do not bypass:

- media registry entries;
- responsive generated media contracts;
- video source/delivery separation;
- `data-caption-view`;
- PhotoSwipe/lightbox ownership;
- generated-media builders.

Do not manually edit generated media output.

## Runtime boundary

Shared `src/main.js` must be DOM-safe on every portfolio-runtime page.

Project-specific side-effect runtimes are loaded only when their matching DOM exists. Avoid adding unconditional page-specific imports to the shared entry.

CV remains an authored public-static page and does not load the portfolio runtime.

JavaScript is progressive enhancement. Core text and media must exist in the built HTML.

## Verification

Mandatory local/CI contract:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:e2e:mpa
npm run test:e2e:projects
npm run test:e2e:cv
```

The aggregate command is:

```bash
npm run verify
```

The build also runs the existing postbuild pipeline:

```text
apply CV CMS content to the manifest-derived public-static target
generate sitemap
→ check site metadata
→ check local links
```

Before release also run, when the environment permits:

```bash
npm run check:production
npm run lighthouse
npm run check:external-links
```

Do not weaken existing assertions to make a new route pass. When architecture changes ownership of a contract, move the assertion to the new owner while preserving its strictness.
