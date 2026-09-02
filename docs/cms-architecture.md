# CMS architecture

Status: current authoritative architecture for Pages CMS, content ownership, media ownership and CMS publication safety.

This document supersedes roadmap-era assumptions when they conflict with current code or tests. `docs/cms-content-map.md` remains a detailed inventory, but ownership decisions are governed by this document plus the executable contracts in TypeScript, tests and workflows.

## Architectural rule

Pages CMS edits authored data. TypeScript owns domain identity, architecture and presentation contracts. Media Catalog owns reusable media identity/metadata. Generators own derivatives and generated indexes. Git and GitHub Actions provide audit, validation and controlled publication.

A new page or domain entity does not become CMS-managed merely because it exists. CMS integration is added only after the domain/content boundary is stable and editorial editing is useful.

## Ownership classes

### DOMAIN

Answers what exists and how canonical entities relate.

Owner: TypeScript.

Examples:

- Case / Project / Collection / Client / Role identity;
- canonical relations and taxonomy IDs;
- stable media asset identity;
- fixed structural IDs used by typed adapters.

CMS may reference these IDs but must not create a second canonical identity system.

### EDITORIAL

Answers what is written or curator-managed.

Owner: `src/content/**` where an explicit Pages CMS model exists; otherwise the current typed authored source remains authoritative.

Examples:

- titles, leads, paragraphs, descriptions and summaries;
- captions, credits and notes;
- navigation labels;
- reusable media title/default alt/description/tags/credits/taxonomy relations;
- explicit visibility flags where a tested render contract exists.

Editorial JSON is treated as `unknown` at its parser boundary and must pass strict validation before becoming typed application data. Optional editorial text accepts a missing value, an empty string or whitespace-only input and normalizes those states to `""`; wrong types still fail. Structural fields do not inherit this optional-copy rule.

### PRESENTATION

Answers how content is composed and behaves visually.

Owner: code unless a dedicated typed editorial control is explicitly designed.

Examples:

- layout, grid, columns, ratios, fit and position;
- DOM wrappers and CSS classes;
- animation configuration;
- carousel/lightbox/deck behavior;
- GSAP, Three.js, Canvas/WebGL and PageFlip implementation details;
- video autoplay/loop/runtime behavior.

CMS must not become a generic page builder.

### ARCHITECTURE

Answers where/how the application is routed, built and rendered.

Owner: code.

Examples:

- routes, slugs and canonical URLs;
- `SitePage`, renderer identity, page type, indexability and sitemap ownership;
- Vite inputs and build composition;
- runtime selectors and component identities;
- CMS publication policy itself.

`.pages.yml`, workflows and publication authorization code are engineering configuration, not CMS content.

### GENERATED

Derived technical state. Never authored manually.

Owner: deterministic generators/tooling.

Examples:

- responsive derivatives;
- optimized video delivery assets;
- responsive manifests;
- generated media catalog/index TypeScript;
- video inventory;
- build output.

Media masters are preserved. Source and delivery assets have different ownership roles.

## Current ownership table

| Entity / data | Canonical owner | CMS editable | Validator / guard | Consumer |
| --- | --- | --- | --- | --- |
| Case identity | TypeScript domain catalog | no | domain/catalog tests | renderers/adapters |
| Case copy | `src/content/cases/*.json` for configured Cases | yes | strict editorial parser | typed Case adapter |
| Collection/Shootings identity | TypeScript domain catalog | no | domain/catalog tests | collection renderer |
| Shootings copy | `src/content/collections/shootings.json` + configured records | yes | shootings editorial parser | typed adapter |
| Project-card identity/routes | TypeScript/SitePage relations | no | project/page tests | homepage renderer |
| Project-card editorial copy | `src/content/editorial/home-project-cards.json` | yes | project-card copy parser/tests | project presentations |
| Project-card visibility/cover selection | `src/content/projects.json` | yes, only configured controls | structural project parser/tests | project presentations |
| Navigation route identity | `SitePage` | no | route/navigation tests | navigation runtime/build |
| Navigation label | `src/content/navigation.json` | yes | navigation content adapter | menu/breadcrumb rendering |
| CV structural data | `src/content/cv.json` | no in current Pages CMS model | CV contract/adapters | CV build transform |
| CV editorial copy | `src/content/editorial/cv.json` | yes | CV editorial adapter/tests | CV build transform |
| Media identity | typed media registry | no | media registry/contracts | Media Catalog/public renderers |
| Registered reusable media metadata | `src/content/media-catalog/registered/*.json` | yes | Media Catalog parser | typed Media Catalog |
| Uploaded media authored metadata | `src/content/media-catalog/uploads/*.json` | yes | Media Catalog parser + sync tooling | typed Media Catalog |
| Uploaded media technical metadata | media tooling | no | probe/media checks | Media Catalog/build |
| Routes / canonical / renderer identity | TypeScript `SitePage` architecture | no | route/meta/build tests | runtime/build |
| CMS option lists | canonical TypeScript IDs + generator | no direct hand sync | `cms:generate` / `cms:check` | `.pages.yml` |
| CMS publication policy | trusted `prod` engineering code | no | publication-scope/workflow tests | Pages CMS publication action |

## CMS generator contract

`npm run cms:generate` updates canonical option lists in `.pages.yml` from current TypeScript-owned IDs. Human-facing labels/descriptions and the rest of the CMS UI remain explicitly authored.

`npm run cms:check` is read-only and fails when generated CMS fragments are stale. Production site builds already depend on this check.

Do not create a second CMS schema framework or generate all of `.pages.yml` without a demonstrated need.

## Case/content contracts

Configured Case content files store authored copy only. Stable identity and presentation/runtime data remain outside CMS content.

For example, Jestei content stores `lead`, fixed section copy and fixed overlay text, while canonical role/period are resolved from Case domain identity. The parser rejects ownership leakage such as Case-owned identity or presentation fields.

The same principle applies to Styx, Sensetique, Shootings, CV and other migrated models: parser contracts are the boundary and unknown fields fail closed where the current model is strict.

## Media architecture

Reusable media uses one typed Media Catalog. Pages CMS does not create a second registry.

Registered assets:

- physical/canonical identity comes from the typed registry;
- CMS records expose reusable authored metadata;
- identity/type/source/technical properties remain readonly.

CMS uploads:

- source files are stored only in the configured CMS media surface;
- Pages CMS supplies the upload record/UUID;
- media tooling probes and generates technical metadata/derivatives;
- source masters remain preserved;
- generated fields are not editorial fields.

Placement-specific captions, alt text and presentation remain with the placement model. Catalog defaults do not silently overwrite page-specific copy.

## CMS publication trust boundary

Pages CMS edits `dev`. CMS publication authorization is executed from trusted `prod`.

```text
Pages CMS on dev
        |
        v
save/verify dev
        |
        v
prepare publication action
        |
        v
workflow ref = prod
        |
        v
trusted prod checkout + trusted classifier
        |
        v
validate prod/dev topology
        |
        v
classify prod..dev changed paths
        |
        +-- engineering or unknown -> BLOCK
        |
        +-- explicit CMS-only scope -> create/reuse dev -> prod PR
```

The invariant is: unpublished `dev` cannot expand the permissions used to authorize publication of that same `dev`.

### Branch topology

- identical refs, or different release-history SHAs with identical trees: successful no-op; nothing to publish;
- `prod` is an ancestor of `dev`: inspect the exact current `origin/prod..origin/dev` file set and apply the publication classifier;
- diverged history is allowed only when a hypothetical conflict-free merge of current `prod` back into current `dev` produces exactly the current `dev` tree;
- if that merge would add/change content in `dev`, conflicts, or cannot be proven safe: block before path authorization and synchronize through the normal engineering workflow.

Release-only merge history is therefore not itself a blocker. Production-only content missing from `dev` is a blocker.

### Publication classes

`tools/cms-publication-scope.mjs` has five outcomes:

- `CMS_CONTENT`
- `CMS_MEDIA`
- `CMS_GENERATED`
- `ENGINEERING`
- `UNKNOWN`

Only the first three are publishable, and only for explicit current ownership paths. `ENGINEERING` and `UNKNOWN` always block. A mixed diff always blocks.

The publication classifier is intentionally separate from `tools/ci/change-scope.mjs`. The latter selects regression coverage; it does not grant production publication rights.

### CMS_CONTENT

Authorization uses explicit current Pages CMS files/collections rather than `src/content/**` as a blanket rule. New files do not gain publication rights merely by being placed under `src/content`.

### CMS_MEDIA

Only configured Pages CMS source media surfaces are allowed. Broad `public/media/**` authorization is forbidden.

### CMS_GENERATED

Only exact deterministic metadata outputs produced by the existing CMS/media synchronization contract are allowed. Broad `public/media/generated/**` authorization is forbidden.

### Engineering/unknown

At minimum, `.pages.yml`, `.github/**`, `tools/**`, application TypeScript, CSS, tests, docs, package/build configuration and all unrecognized paths are not CMS-publishable.

Future CMS ownership must first be introduced as a normal engineering change and reach trusted `prod`; only then may the trusted classifier authorize that new surface.

## Branch protection policy

Required repository configuration is external to the code contracts.

`prod` should prevent force pushes and deletion and require normal updates through a controlled, reviewable release path with appropriate verification checks. A mandatory approval count is not required solely for ceremony in a solo-maintainer repository.

`dev` should prevent destructive force-push/history rewrite and deletion while retaining direct writes required by Pages CMS/media synchronization automation and normal development.

Code/tests must not claim these settings are active until the GitHub protection/ruleset state is re-read and confirms them.

## Development independence

New page flow:

```text
code-only experiment
  -> stable typed domain
  -> typed editorial layer if useful
  -> Pages CMS model only when useful
```

A new page does not require Media Desk changes. A new media asset uses the existing Media Catalog. Public runtime must not depend on CMS tooling or future internal Media Desk dependencies.

## Sources of executable truth

When documentation conflicts with current behavior, inspect in this order:

1. current code and strict parsers;
2. current tests/contracts;
3. current workflows/build tooling;
4. this architecture document;
5. older roadmaps/inventory notes.
