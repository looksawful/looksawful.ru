# CMS content ownership map

Status: current content/storage inventory. Architectural ownership rules are authoritative in `docs/cms-architecture.md`.

This map records the CMS-managed authored sources that exist now, their typed adapters, and important authored content that still lives outside the CMS layer. It deliberately does not describe routes, layout or runtime as editor-owned.

The previous migration-era version of this file contained stale statements such as “Jestei CMS managed = No” and treated Case `role` / `period` as future CMS candidates. Those statements are no longer correct: the current Case parsers resolve canonical identity from the TypeScript domain layer and Pages CMS edits only the dedicated authored copy fields.

## Ownership legend

### DOMAIN

Code-owned canonical identity and relations: Case/Project/Collection/Client/Role IDs, taxonomy IDs and other stable relations. CMS may reference them but does not create alternative identity.

### EDITORIAL

Authored copy and explicitly curated metadata. These values may be CMS-managed only through a configured source plus a strict adapter/parser.

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
| Case `role` / `period` where canonical Case identity exists | DOMAIN | not Case JSON fields; resolved from domain identity |
| Case `lead`, section `title`/`paragraphs`, configured overlays/credits/notes | EDITORIAL | CMS-managed where present in `.pages.yml` |
| navigation labels | EDITORIAL | CMS-managed; href/routes remain `SitePage`-owned |
| project-card visibility/copy overrides and cover selection | EDITORIAL | CMS-managed; route identity remains code-owned |
| CV authored copy/visibility | EDITORIAL | CMS-managed through CV adapters |
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

Storage:

```text
src/content/projects.json
```

CMS may edit the configured editorial/presentation overrides, visibility and scoped project-cover source metadata. Stable card identity and canonical page relation remain code-owned. Project-cover files are restricted to `public/media/projects/index/`.

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

Current CMS-owned fields:

- `lead`;
- seven fixed section records: stable readonly `id`, editable `title` and `paragraphs`;
- six fixed overlay records: stable readonly `id`, editable `text`.

Canonical role and period are resolved from Case identity and are not authored in this Case JSON. Layout, media identity, filter behavior, theme-organism runtime, mockup/deck configuration, GSAP/Three.js/Canvas behavior and route ownership remain in code.

### Styx

Storage:

```text
src/content/cases/styx.json
```

Current CMS-owned fields include the Case lead, five fixed section copy records and three fixed credit/title records. Stable IDs are readonly. Canonical Case identity, routes, media composition and presentation remain code-owned.

### Sensetique

Storage:

```text
src/content/cases/sensetique.json
```

Current CMS-owned fields include intro lead, two fixed section copy records, fixed credit records and configured editorial notes. Stable IDs are readonly. Canonical Case identity and all presentation/runtime/media composition remain code-owned.

### Shootings

Storage:

```text
src/content/collections/shootings.json
src/content/shootings/*.json
```

The overview exposes configured authored header/copy fields. Individual existing shooting records expose stable readonly identity with editable title/date/description. Record create/rename/delete are disabled because identity and presentation relations remain code-owned.

Shootings remains a Collection/domain concept; CMS storage does not create routes or new canonical records.

### Standalone projects

Current configured sources:

```text
src/content/standalone-projects/berry-social-content-2020.json
src/content/standalone-projects/awful-cases.json
```

CMS edits the configured authored intro copy only. Route, visibility/discovery, taxonomy, links, media and composition remain code-owned.

### Client logo visibility

Storage:

```text
src/content/client-logo-visibility.json
```

CMS edits only visibility. Logo identity/name/file relations remain code-owned.

### CV

Storage:

```text
src/content/cv.json
```

CMS owns configured profile/contact copy, skills/tool text, education copy, experience copy and visibility controls. Stable row/entry IDs, link mechanics, layout and production sanitization remain code-owned and validated.

## Reusable Media Catalog

The reusable Media Catalog is an editorial metadata layer over the existing typed media registry; it is not a second media registry.

### Registered media

Storage:

```text
src/content/media-catalog/registered/*.json
```

Coverage is one editable metadata record per registered `MediaAsset`.

Readonly/code or tool-owned fields include stable asset ID, media type, source path and technical properties. Editable metadata includes title, reusable default alt, description, date, project/work-area/project-type/deliverable relations, tags, credits, reusable and archived state.

### CMS uploads

Files:

```text
public/media/catalog/*
```

Records:

```text
src/content/media-catalog/uploads/*.json
```

Pages CMS creates a UUID-backed record and accepts configured image/video source types. Media tooling probes width/height/MIME/byte length/duration and generates delivery metadata where required. Source masters are preserved.

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

## Inline authored copy still outside typed/CMS content

These remain candidates for a later content-completion wave only if they still exist after a fresh repository inventory:

- Jestei editorial resource-row explanatory copy and resource labels;
- Jestei landings group note;
- Styx production/social-instruction explanatory notes/credits surrounding typed slots;
- Sensetique equipment/resource copy, production notes/credits and trailing community/masterclass note;
- Shootings ESMI inline photographer credits.

These are inventory candidates, not permission to migrate or rewrite them during unrelated work. Any migration must preserve the rendered copy and existing DOM/presentation contract.

## Restricted runtime/presentation structures

The following remain code-owned:

- Jestei filter structure/logic;
- Jestei theme-organism renderer;
- before/after component structure and interaction;
- PageFlip page order/density/runtime;
- sequence leading/middle/trailing roles;
- mockup-deck device/layout/runtime settings;
- embedded deck autoplay/active-slide behavior;
- justified-gallery row composition;
- infinite-reel timing/sizing;
- GSAP, Three.js and Canvas behavior;
- route extraction and standalone page composition;
- `data-caption-view` and lightbox implementation mechanics.

## Publication ownership

CMS content ownership does not imply publication-policy ownership. `.pages.yml`, `.github/**`, `tools/**`, tests and documentation are engineering changes.

Pages CMS works on `dev`; publication authorization is executed from trusted `prod` and uses the explicit fail-closed classifier documented in `docs/cms-architecture.md`. A new CMS source becomes publishable only after its CMS model and trusted authorization policy have passed the normal engineering release path.
