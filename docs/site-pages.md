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
  which entities have URLs

Discovery settings
  whether a page is listed and/or indexable

Renderer
  how the entity body is composed

Page shell
  shared HTML document, metadata, navigation and page diagnostics

Vite MPA
  physical HTML inputs and build-time transforms

Postbuild
  sitemap, metadata and local-link validation

Runtime
  progressive enhancement only
```

Do not put route, canonical, navigation or homepage-mode fields into Case/Project/Collection catalog records unless they are genuinely domain data.

## Page manifest

Managed routes live in:

`src/site/pages/manifest.ts`

The manifest is the source of truth for managed MPA routes. Vite inputs are derived from it through:

`src/site/build/inputs.ts`

Current public/indexable entity routes:

- `/work/jestei-pool/`
- `/work/styx/`
- `/work/sensetique/`
- `/shootings/`

Current direct-link-only Project routes:

- `/work/awful-cases/`
- `/work/moves-awful/`
- `/work/berry-social-content-2020/`

`/cv/` is intentionally not owned by the page manifest during this migration. It remains the existing static artifact in `public/cv/`.

`/404.html` is a managed static noindex page.

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

`src/data/projects.ts` validates that JSON and preserves the fixed card IDs.

Routing is not editable in Pages CMS. The explicit card-ID-to-page mapping is owned by:

`src/site/pages/project-card-routes.ts`

This keeps CMS content and route ownership separate.

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

Managed pages expose:

- `data-page-type`
- `data-page-id`
- `data-entity-id` for entity pages

Indexable pages receive canonical and Open Graph URL metadata using the centralized production origin.

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

Pages CMS currently owns editable homepage-card content in `src/content/projects.json`.

Do not make arbitrary routes editable through the CMS. Card IDs remain fixed and validated.

Do not move the canonical domain catalog into the CMS as part of ordinary page work.

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

Shared `src/main.js` must be DOM-safe on every managed page.

Project-specific side-effect runtimes are loaded only when their matching DOM exists. Avoid adding unconditional page-specific imports to the shared entry.

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
