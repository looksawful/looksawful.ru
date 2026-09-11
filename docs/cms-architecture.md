# CMS architecture

Status: current authoritative architecture for Pages CMS, content ownership, media ownership and CMS publication safety.

This document supersedes roadmap-era assumptions when they conflict with the current branch contract. Executable code and tests remain the implementation truth, but stale workflows do not redefine the intended architecture.

## Branch contract

`prod` is the active working / integration / production / deployment source-of-truth branch.

`dev` is archive only. It remains in the repository for historical reference and must not be used for current development, CMS authoring, Media Desk writes, preview, release or deployment.

Writable editorial work uses a temporary `content/*` branch or isolated worktree created from fresh `origin/prod`. Engineering work uses an appropriate temporary feature/fix/chore branch from the same fresh base. Neither CMS nor Media Desk writes directly to `prod`.

The intended authoring flow is:

```text
fresh origin/prod
  -> temporary content/* branch or isolated worktree
  -> CMS / Media Desk authored changes
  -> exact-SHA validation
  -> explicit user readiness
  -> reviewed PR to prod
  -> normal prod deployment
```

Any repository workflow that still assumes a permanent development branch is migration debt and must be changed in its own tested engineering slice. It does not override this contract.

## Architectural rule

Pages CMS edits authored data. TypeScript owns domain identity, architecture and presentation contracts. Media Catalog owns reusable media identity/metadata. Generators own derivatives and generated indexes. Git and GitHub Actions provide audit, validation and controlled integration.

A new page or domain entity does not become CMS-managed merely because it exists. CMS integration is added only after the domain/content boundary is stable and editorial editing is useful.

Media Desk is an operator UI over the same canonical CMS/media boundary, not a second CMS or an alternate canonical store. Opening the ordinary Desk must be read-only and side-effect-free.

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
| CMS integration policy | trusted `prod` engineering code | no | scope/workflow tests | authoring/integration actions |

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
- the authoring layer supplies the upload record/UUID;
- media tooling probes and generates technical metadata/derivatives;
- source masters remain preserved;
- generated fields are not editorial fields.

Placement-specific captions, alt text and presentation remain with the placement model. Catalog defaults do not silently overwrite page-specific copy.

## Authoring and integration trust boundary

A writable CMS or Media Desk session must operate only inside an explicitly authorized temporary `content/*` branch/worktree derived from fresh `origin/prod`.

Before any mutation, the write boundary must be able to prove at least:

- the working tree/worktree is not `prod`;
- the branch is not archival `dev`;
- the branch matches the allowed temporary authoring pattern;
- the known base/provenance points to the intended `prod` source state;
- the operation is within the narrow CMS/media ownership allowlist.

Before integration, the candidate is compared with current `origin/prod`, validated at its exact head SHA, and opened as a reviewed PR targeting `prod`. The authoring branch has no deployment authority and cannot expand its own publication permissions.

### Integration classes

Existing scope classification concepts remain useful:

- `CMS_CONTENT`
- `CMS_MEDIA`
- `CMS_GENERATED`
- `ENGINEERING`
- `UNKNOWN`

Only explicitly configured CMS/content/media/generated paths may qualify as authoring-only changes. `ENGINEERING`, `UNKNOWN`, or mixed scope must fail closed. New files do not gain authoring/integration rights merely by living under `src/content` or `public/media`.

The publication/integration classifier is intentionally separate from ordinary CI change classification. Regression coverage is not write or merge authorization.

## Branch protection policy

Required repository configuration is external to the code contracts.

`prod` should prevent force pushes and deletion and require controlled, reviewable updates with the appropriate verification checks. A mandatory approval count is not required solely for ceremony in a solo-maintainer repository.

`dev` is archival. It should remain preserved and disconnected from current write, preview, release and deployment automation. No current workflow should require direct writes to it.

Temporary `content/*` branches are disposable authoring branches. Their safety comes from fresh-base creation, explicit write guards, exact-SHA validation and reviewed integration into `prod`, not from treating them as permanent infrastructure.

Code/tests must not claim repository settings are active until the GitHub protection/ruleset state is re-read and confirms them.

## Development independence

New page flow:

```text
code-only experiment
  -> stable typed domain
  -> typed editorial layer if useful
  -> Pages CMS model only when useful
```

A new page does not require Media Desk changes. A new media asset uses the existing Media Catalog. Public runtime must not depend on CMS tooling or internal Media Desk dependencies.

## Migration debt

Some current workflows and tests may still encode the historical development-branch topology. They must be characterized and migrated in separate TDD slices. Documentation must not present those legacy assumptions as the intended architecture merely because the implementation has not yet been fully retired.

## Sources of executable truth

For implementation work, inspect in this order:

1. current explicit project branch contract;
2. current code and strict parsers;
3. current tests/contracts, distinguishing migration debt from target invariants;
4. current workflows/build tooling;
5. this architecture document;
6. older roadmaps/inventory notes.
