# Pages CMS roadmap

This is the implementation roadmap for expanding Pages CMS on `looksawful.ru` after the static MPA migration.

The roadmap deliberately separates editable authored content from routing, rendering, runtime behavior and generated media. It is not a request to move the whole site into CMS at once.

## Goals

1. Make routine copy and cover updates safe without editing TypeScript by hand.
2. Keep production publication reviewable and reversible through Git.
3. Give editors useful controls without exposing architecture controls.
4. Keep media ownership explicit and scoped.
5. Preserve the current visual system, typed contracts and runtime behavior.
6. Expand CMS incrementally, with one content model proven before the next one is migrated.

## Non-goals

Pages CMS must not become a general-purpose site builder.

Do not expose the following as editorial fields:

- managed route paths or slugs;
- canonical URLs;
- `listed`, `indexable`, `enabled` page discovery state;
- page type;
- renderer names;
- Vite entry points;
- CSS classes used as layout/runtime contracts;
- GSAP, Three.js, canvas or animation configuration;
- Jestei filter configuration;
- PhotoSwipe/lightbox ownership;
- generated responsive-media output;
- video master/output mapping;
- sitemap implementation details.

## Architecture boundary

The current site separates:

```text
Domain catalog
  -> what entities exist and how they relate

Typed authored content
  -> copy and media presentation data

Page manifest
  -> which entities have URLs and discovery state

Renderers / shell
  -> page composition, metadata and navigation

Runtime
  -> progressive enhancement

Postbuild
  -> sitemap, metadata and local-link validation
```

CMS should gradually replace only appropriate authored-content storage. It should not absorb the other layers.

Managed routing remains in:

```text
src/site/pages/manifest.ts
```

Homepage-card route mapping remains in code.

## Branch and publication model

Permanent branches:

```text
dev   = CMS/integration working branch
prod  = production branch
```

Normal content flow:

```text
Pages CMS on dev
  -> Save
  -> Verify dev automatically
  -> optional explicit Проверить сайт action
  -> Подготовить публикацию
  -> dev -> prod pull request
  -> required PR checks
  -> human diff review
  -> manual merge
  -> GitHub Pages deploy
  -> production verification
```

No ordinary Pages CMS editing should happen directly on `prod`.

## Stage 0 — CMS safety foundation

Status: current implementation stage.

### Scope

Keep the existing homepage cards in:

```text
src/content/projects.json
```

### Deliverables

- fixed IDs remain readonly;
- create/rename/delete disabled;
- content save uses merge mode;
- project covers use a scoped WebP media source;
- image field replaces hand-written cover paths;
- helper descriptions explain fields;
- full verification action is available in CMS;
- safe publication action prepares `dev -> prod` PR only;
- cover paths and real image dimensions are verified by tests;
- site operations are documented;
- `prod` is protected by GitHub rules;
- Pages CMS is switched to `dev`.

### Acceptance criteria

A normal card copy edit can be completed without touching code and cannot be published to production without a reviewable Git history and passing checks.

## Stage 1 — Controlled CMS smoke test

Do this only after Stage 0 is merged to both `dev` and `prod` and Pages CMS is opened on `dev`.

### Test

Use a deliberately reversible change on one card, for example a temporary non-visible metadata change only if an appropriate field exists. If every field is user-visible, do not create a fake content edit merely to test the system.

Preferred test for the current model:

1. Open a card in CMS.
2. Confirm the image picker can browse the four existing covers.
3. Do not change the selected image.
4. Confirm helper text and read-only ID behavior.
5. Run `Проверить сайт` without saving fake content.
6. Confirm the workflow runs against `dev`.
7. Run `Подготовить публикацию` only when `dev` contains an intentional change.

### Acceptance criteria

- CMS reads the expected branch and schema;
- actions execute on `dev`;
- no direct production write occurs;
- verification failures are visible before publication.

## Stage 2 — Global editorial content inventory

Before moving more content, create an explicit inventory classifying every text/data field as one of:

```text
EDITORIAL
  safe to expose to CMS

PRESENTATION
  stays typed/in code unless a dedicated contract is designed

ARCHITECTURE
  never ordinary CMS content

GENERATED
  never manually edited
```

### Candidate editorial fields

Potentially suitable after inspection:

- hero descriptive copy;
- public contact links;
- selected project intro copy;
- role/period labels;
- long explanatory paragraphs;
- credits;
- publication/external links;
- accessibility alt text;
- selected SEO title/description overrides.

### Keep out of CMS

- DOM selectors;
- class names;
- render slot names;
- animation timing/options;
- media transform recipes;
- page discovery state;
- content-to-route mapping.

### Deliverable

Add a written field map before implementing another CMS schema.

## Stage 3 — One Case content-model pilot

Do not migrate Jestei, Styx and Sensetique simultaneously.

Choose one Case with enough representative content but manageable complexity. The pilot proves the storage pattern and adapter layer.

### Recommended architecture

```text
src/content/cases/<case-id>.json
  authored CMS data

src/data/content/<case-id>.ts
  typed parser/adapter and any intentionally code-owned presentation data

existing renderers/templates
  unchanged consumer contract where practical
```

The objective is not to turn every render slot into a generic CMS block.

### Migration method

1. Inventory the selected Case's TypeScript content file field by field.
2. Separate literal authored copy/data from renderer/presentation configuration.
3. Write regression tests capturing current rendered output before changing storage.
4. Create JSON content for only the editorial fields.
5. Add a strict TypeScript parser/adapter with no `any`.
6. Make the existing renderer consume the adapter output.
7. Confirm output is unchanged.
8. Add the Case to Pages CMS under a `Кейсы` group.
9. Add field descriptions and validation.
10. Run full verification and visual regression/smoke coverage.

### What not to do

Do not create a generic section-builder merely because Pages CMS supports blocks. The existing cases have intentional art direction and should retain explicit composition code.

### Acceptance criteria

The selected Case's copy can be edited through CMS while its layout, media ordering, runtime and route remain unchanged.

## Stage 4 — Remaining Case copy

After the pilot is stable, repeat the proven pattern for the other large Cases.

Current large authored modules include:

```text
src/data/content/jestei-pool.ts
src/data/content/styx.ts
src/data/content/sensetique.ts
```

Each migration must preserve the existing rendered output before editorial changes are made.

### Jestei special restrictions

Do not make the Jestei filter, its options, selectors, interaction behavior or isolated UI system ordinary CMS fields.

Only clearly editorial Jestei copy/data should be migrated.

## Stage 5 — Shootings data model

Shootings is a Collection, not a Case.

Current authored data lives in:

```text
src/data/content/shootings.ts
```

The long-term CMS model should support individual shooting records rather than one giant free-form document.

### First design task

Normalize what an individual shooting record means before moving it into CMS.

Candidate fields:

```text
id                 stable, code-validated
name/title         editorial
year/date          editorial
role               editorial
short description  editorial
credits            structured editorial data
publication        structured editorial data
external links     structured editorial data
cover              scoped media field
alt                editorial/accessibility
visibility/status  only if mapped to a deliberate content contract, not routing directly
```

### Storage direction

Prefer a collection of files, for example:

```text
src/content/shootings/<stable-id>.json
```

instead of one huge top-level JSON array if individual records will be created and maintained independently.

### CMS behavior

Once the record model is stable, Pages CMS `type: collection` can provide search, sorting and a meaningful `view.primary` title. This is better suited to a growing Shootings library than the current top-level-array editor.

### Routes

Creating a shooting CMS record must not automatically create an indexable route unless a separate product/architecture decision explicitly introduces individual shooting pages.

## Stage 6 — Standalone Projects

Existing typed project content includes examples such as:

```text
src/data/content/awful-cases.ts
src/data/content/moves-awful.ts
src/data/content/berry.ts
```

Other project content modules exist as well.

Before CMS migration:

1. confirm a stable domain `ProjectData` record exists;
2. confirm which copy is editorial;
3. keep route/discovery configuration in the page manifest;
4. capture current render output in tests;
5. migrate editorial fields only.

An unlisted/noindex project must not become listed/indexable merely because its content is editable in CMS.

## Stage 7 — CMS media architecture

Never expose one unrestricted `public/media` source.

Create purpose-specific named media sources as editorial models are introduced.

Possible future sources:

```text
project-covers
shooting-covers
case-content-images
publication-images
```

Each source should define:

- exact repository input folder;
- exact public output path;
- allowed extensions;
- safe rename behavior;
- clear ownership boundaries;
- validation in CI.

### Generated media

Do not let CMS overwrite generated responsive/video artifacts.

If editors need to upload source media that must pass through builders, build a dedicated workflow:

```text
CMS source upload
  -> validation
  -> media builder
  -> generated outputs
  -> data/registry update if required
  -> full verification
```

Do not make editors manually reproduce the generated folder structure.

## Stage 8 — Automatic image metadata

Current homepage covers still expose width and height because the runtime data contract uses them.

Current CI verifies those values against real WebP files.

Future improvement:

1. upload/select image;
2. workflow reads dimensions with Sharp;
3. workflow updates metadata deterministically;
4. CI verifies result.

Until this exists, width and height stay explicit and verified.

## Stage 9 — Global site settings

Only introduce `src/content/site.json` after deciding which genuinely global values should be editorial.

Possible candidates:

- selected public contact URLs;
- selected hero copy;
- global social/profile links.

Do not put these into the same file:

- production origin;
- route definitions;
- analytics IDs/secrets;
- build configuration;
- environment-specific settings.

Environment/config values remain repository variables or code-owned configuration.

## Stage 10 — SEO editorial controls

The site already has centralized metadata/page infrastructure.

CMS may eventually expose carefully selected editorial overrides, such as:

```text
seoTitle
seoDescription
ogImage editorial choice
```

Only add a field when an editor has a real reason to override the generated/default value.

Never expose ordinary CMS fields for:

```text
canonical
robots/indexability
route path
sitemap inclusion
```

Those are architecture/discovery contracts.

## Stage 11 — Preview experience

Current verification builds `dist` and stores artifacts on `dev`, but this is not yet a public branch preview.

Options for a later stage:

1. keep artifact-only preview and inspect locally when necessary;
2. add an intentionally isolated preview deployment service;
3. create a GitHub-hosted preview environment only if it can be done without confusing the production custom domain.

Do not repoint production GitHub Pages or DNS just to obtain previews.

A preview implementation must have an explicit cleanup/retention model and must not be indexable.

## Stage 12 — Collaborators

Only add collaborators when another person actually needs editorial access.

Recommended principle:

- user with GitHub repository access for technical/admin work;
- Pages CMS collaborator for content/media-only work when GitHub access is unnecessary.

Collaborators should inherit the same narrow CMS schemas. Do not expand content permissions merely to make collaboration easier.

## Stage 13 — Operational monitoring

CMS publication remains connected to existing repository checks.

Maintain:

- full dev verification on every CMS save/push;
- PR verification before prod;
- CodeQL;
- production health checks;
- external-link checks;
- dependency audits;
- Lighthouse runs;
- Pages deployment verification.

When CMS scope expands, add focused contract tests for every new content model rather than weakening existing site checks.

## Stage 14 — Analytics and privacy integration

Analytics is separate from Pages CMS.

Do not expose analytics IDs as editable CMS content.

Use environment/repository configuration and the shared analytics runtime.

Planned stack:

```text
Cloudflare Web Analytics
  lightweight RUM

Yandex Metrica
  detailed analytics, later loaded through the shared provider layer

Webvisor
  enabled only under the chosen privacy/consent behavior
```

Clarity remains unnecessary unless a later product need justifies a second behavioral recorder.

## Stage 15 — Search operations

CMS editors do not manually edit `sitemap.xml` or `robots.txt` for routine content changes.

The site architecture and postbuild pipeline own sitemap generation.

Search-console operating model:

```text
new public/indexable route
  -> page manifest/discovery decision in code
  -> build generates sitemap
  -> deployment
  -> search engines discover updated sitemap
```

Manual URL inspection/indexing requests are diagnostic/exception tools, not the publication mechanism.

## Recommended implementation sequence from here

```text
A. Finish CMS v1 foundation
B. Protect prod and switch Pages CMS to dev
C. Run controlled CMS smoke test
D. Complete external webmaster/analytics dashboard setup
E. Design editorial field inventory
F. Migrate one Case as pilot
G. Migrate remaining Case copy
H. Normalize Shootings records
I. Add Shootings collection to CMS
J. Add standalone Project content selectively
K. Expand purpose-specific media sources
L. Add automatic media metadata/build workflows
M. Add selected global site settings
N. Add selected SEO editorial overrides
O. Evaluate branch preview only if needed
P. Add collaborators only when needed
```

## Definition of done for each future CMS migration

Every content type added to CMS must satisfy all of the following:

```text
[ ] authored data source is explicit
[ ] strict parser/type boundary exists
[ ] existing output is captured before migration
[ ] rendering is unchanged unless separately requested
[ ] routes remain outside CMS
[ ] indexability remains outside CMS
[ ] media source is scoped
[ ] destructive operations are intentionally configured
[ ] field helper text exists where misuse is plausible
[ ] validation rejects malformed data
[ ] CI covers the new contract
[ ] dev verification is green
[ ] production PR is reviewable
[ ] production deployment is verified
[ ] runbook is updated
```

This checklist is the gate for expanding CMS scope. A new editable field is not complete merely because it appears in the Pages CMS UI.
