# CMS content ownership map

Status: current content/storage inventory. Architectural ownership rules are authoritative in `docs/cms-architecture.md`.

This map records the CMS-managed authored sources that exist now, their typed adapters, and important authored content that still lives outside the CMS layer. It deliberately does not describe routes, layout or runtime as editor-owned.

## Ownership legend

### DOMAIN

Code-owned canonical identity and relations: Case/Project/Collection/Client/Role IDs, taxonomy IDs and other stable relations. CMS may reference them but does not create alternative identity.

### EDITORIAL

Authored copy and explicitly curated metadata. These values may be CMS-managed only through a configured source plus a strict adapter/parser. Optional editorial text can be omitted or cleared; adapters normalize missing/empty/whitespace-only values to `""` where the field is defined as optional copy.

### PRESENTATION

Layout, grids, CSS classes, media composition, crop/fit, component options and interaction behavior. Code-owned unless a dedicated typed control is intentionally designed.

### ARCHITECTURE

Routes, canonical URLs, `SitePage`, page type, renderer identity, Vite inputs, sitemap/indexability and runtime selectors. Always code-owned.

### GENERATED

Responsive/video derivatives, generated manifests/indexes and build output. Tool-owned and never hand-authored.

## Cross-cutting field map

| Current data | Ownership | Current CMS direction |
| --- | --- | --- |
| Case/Project/Collection identity | DOMAIN | readonly/code-owned |
| Case `role` / `period` where canonical Case identity exists | DOMAIN | resolved from domain identity, not Case copy fields |
| Case `lead`, section `title`/`paragraphs`, configured overlays/credits/notes | EDITORIAL | CMS-managed where present in `.pages.yml` |
| navigation labels | EDITORIAL | CMS-managed; href/routes remain `SitePage`-owned |
| project-card editorial copy | EDITORIAL | `src/content/editorial/home-project-cards.json` |
| project-card visibility/cover selection | EDITORIAL / constrained presentation | `src/content/projects.json`; route identity remains code-owned |
| CV structural IDs/shape | DOMAIN | `src/content/cv.json`; not the current Pages CMS edit surface |
| CV editorial copy | EDITORIAL | `src/content/editorial/cv.json` through CV adapters |
| reusable media title/default alt/description/date/taxonomy/tags/credits/reuse/archive | EDITORIAL | CMS-managed through Media Catalog records |
| MediaAsset ID/type/src/source/dimensions | DOMAIN / GENERATED | readonly in CMS |
| uploaded media technical metadata/delivery path | GENERATED | synchronized by media tooling; readonly in CMS |
| placement caption/alt | EDITORIAL placement data | remains placement-specific; catalog defaults do not overwrite it |
| layout/classes/columns/ratios/device/theme/video behavior | PRESENTATION | code-owned |
| routes/canonical/indexability/renderer | ARCHITECTURE | code-owned |
| responsive/generated media paths | GENERATED | builder-owned |

## Current Pages CMS authored sources

### Navigation

Storage:

```text
src/content/navigation.json
```

CMS edits stable navigation labels. Item identity/order and route href resolution remain code-owned and validated against canonical `SitePage` data.

### Homepage project cards

Editorial copy storage:

```text
src/content/editorial/home-project-cards.json
```

Visibility and configured cover selection storage:

```text
src/content/projects.json
```

CMS may edit only the configured copy/visibility/cover controls. Stable card identity and canonical page relation remain code-owned. Project-cover files are restricted to `public/media/projects/index/`.

### Jestei Pool

Storage:

```text
src/content/cases/jestei-pool.json
```

Typed boundary:

```text
src/data/content/jestei-editorial.ts
src/data/content/jestei-pool.ts
```

Current CMS-owned fields are authored lead/section/overlay copy. Stable IDs are readonly. Canonical role/period, layout, media identity, filters, animation/runtime and route ownership remain in code.

### Styx

Storage:

```text
src/content/cases/styx.json
```

Current CMS-owned fields include the Case lead, fixed section copy and configured credit/title records. Stable IDs are readonly. Canonical Case identity, routes, media composition and presentation remain code-owned.

### Sensetique

Storage:

```text
src/content/cases/sensetique.json
```

Current CMS-owned fields include intro/section copy, fixed credit records and configured editorial notes. Stable IDs are readonly. Canonical Case identity and presentation/runtime/media composition remain code-owned.

### Shootings

Storage:

```text
src/content/collections/shootings.json
src/content/shootings/*.json
```

The overview exposes configured authored header/copy fields. Individual existing shooting records expose stable readonly identity with editable title/date/description. Record lifecycle remains constrained because identity and presentation relations are code-owned.

### Standalone projects

Current configured sources:

```text
src/content/standalone-projects/berry-social-content-2020.json
src/content/standalone-projects/awful-cases.json
```

CMS edits the configured authored intro copy only. Route, visibility/discovery, taxonomy, links, media and composition remain code-owned unless an explicit existing control says otherwise.

### Client logo visibility

Storage:

```text
src/content/client-logo-visibility.json
```

CMS edits only existing visibility controls. Logo identity/name/file relations remain code-owned.

### CV

Structural source:

```text
src/content/cv.json
```

Current Pages CMS editorial source:

```text
src/content/editorial/cv.json
```

The CMS edits configured profile/contact, skill/tool, education and experience copy. Structural IDs/shape, link mechanics, layout and production sanitization remain code-owned and validated.

## Reusable Media Catalog

The reusable Media Catalog is an editorial metadata layer over the existing typed media registry; it is not a second media registry.

### Registered media

Storage:

```text
src/content/media-catalog/registered/*.json
```

Coverage is one editable metadata record per registered `MediaAsset`. Stable asset ID/type/source and technical properties are readonly. Editorial metadata includes title/default alt/description/date, taxonomy relations, tags, credits, reusable and archived state.

### CMS uploads

Files:

```text
public/media/catalog/*
```

Records:

```text
src/content/media-catalog/uploads/*.json
```

Pages CMS creates a UUID-backed record and accepts configured image/video source types. Media tooling probes technical metadata and generates delivery metadata where required. Source masters are preserved.

### Taxonomy ownership

Media taxonomy values reuse canonical IDs from the TypeScript taxonomy layer. Pages CMS option lists are generated from current canonical IDs; free tags remain an additional editorial search facet.

## Generated media boundary

The following current metadata outputs are deterministic and are not authored by editors:

```text
src/data/media/catalog-records.generated.ts
public/media/generated/responsive-manifest.json
public/media/generated/video-inventory.json
src/data/media/responsive-generated.ts
```

Generated derivative binaries and `dist` are also tool-owned. Do not hand-edit generated output.

## Restricted runtime/presentation structures

Layout/runtime internals remain code-owned: filters, component composition, PageFlip/decks, lightbox mechanics, GSAP/Three.js/Canvas behavior, route extraction, responsive composition and similar implementation details.

## Publication ownership

CMS content ownership does not imply publication-policy ownership. `.pages.yml`, `.github/**`, `tools/**`, tests, documentation and `AGENTS.md` are engineering changes.

Pages CMS works on `dev`; publication authorization executes from trusted `prod` and uses the fail-closed classifier documented in `docs/cms-architecture.md`. Safe diverged release history is allowed only when `prod` contains no content that would be added back to `dev`. A new CMS source becomes publishable only after its model and trusted authorization policy have passed the normal engineering release path.
