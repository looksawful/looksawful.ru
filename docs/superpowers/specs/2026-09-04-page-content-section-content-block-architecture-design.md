# PageContent / Section / ContentBlock Canonical Architecture

Status: **APPROVED / CANONICAL TARGET**

Notion canonical copy: `24_PAGE_CONTENT_SECTION_CONTENT_BLOCK_CANONICAL_ARCHITECTURE.md`

## Purpose

This document specifies the approved full architectural refactor of page composition in `looksawful/looksawful.ru`.

The refactor is structural. It must not change authored copy, media meaning, visible design, route identity, caption/lightbox behavior, slider/reel/canvas behavior, navigation semantics, or accessibility behavior unless a separate task explicitly authorizes such a change.

The final architecture must remove parallel composition authorities and establish one typed path from domain identity to rendered output.

## Approved decisions

1. The scope is full: normalize `PageContent -> Section -> ContentBlock`, decouple standalone Entity pages from Homepage rendering, migrate Case / Project / Collection to one composition model, fix incorrect entity boundaries, and complete the physical file-structure refactor.
2. Preserve all existing finite block/layout/behavior variants, even if a current production consumer is not found. Lack of usage is not a deletion criterion.
3. Perform a full physical refactor rather than keeping `src/templates` as the permanent mixed compatibility layer.
4. `PageContent` is the single source of truth for page composition.
5. Fix incorrect entity boundaries as part of the work, including Subproject duplication, misleading common-contract names, duplicated Project metadata, and unrestricted finite presentation strings.

## Baseline binding

The design is intentionally independent of the older architecture snapshot.

Implementation MUST start from the final `PRE_APPLY_READY_SHA` produced by the current media normalization / dedupe pre-apply chain.

At the time this design was committed, `agent/media-normalization-dedupe-wave1-preapply-20260904` pointed to:

`3140c01f001385e2a3e445a5622c08a5c63b1d79`

That SHA is not automatically the implementation base. The implementation branch must be created only after the final `PRE_APPLY_READY_SHA` is known.

Do not start this migration directly from `dev`, `prod`, or the older `f11f08ee...` architecture snapshot without a new explicit decision.

## Target architecture

```text
Domain
  -> PageDefinition
    -> PageContent
      -> Section[]
        -> ContentBlock[]
          -> typed block renderer
            -> HTML / runtime
```

There must be no second internal Case/Project/Collection composition authority in Homepage, no marker-owned ordering, and no standalone-page extraction from already-rendered Home HTML.

## Responsibility boundaries

### Domain

Canonical domain concepts remain distinct:

- `Project`: atomic work identity;
- `Case`: case/story grouping identity;
- `Collection`: collection identity over Projects;
- `MediaAsset`: canonical physical media identity;
- `MediaEntry`: contextual media usage identity.

Case and Collection must not create duplicate Project metadata records.

### PageDefinition

`PageDefinition` owns only page-level routing/build/discovery data:

- page id;
- route;
- page family;
- domain entity id;
- renderer family/shell;
- indexability/discovery.

It must not own body composition, block ordering, or project-specific styling.

### PageContent

`PageContent` is the only authority for the structure of a concrete Entity page.

```ts
interface EntityPageContent {
  pageId: EntityPageId;
  intro: EntityIntroData;
  sections: readonly Section[];
}
```

It owns semantic section order, Project ownership of sections/presentations, content-block order, and specialized section composition.

## Canonical Section model

```ts
type Section =
  | ContentSection
  | ProjectSection
  | ProjectGroupSection
  | SpecializedSection;
```

### ContentSection

A semantic page chapter that is not itself a canonical Project.

```ts
interface ContentSection {
  type: "content";
  id: SectionId;
  intro?: SectionIntroData;
  blocks: readonly ContentBlock[];
}
```

### ProjectSection

A semantic section corresponding to exactly one canonical Project.

```ts
interface ProjectSection {
  type: "project";
  id: SectionId;
  projectId: ProjectId;
  intro?: SectionIntroData;
  blocks: readonly ContentBlock[];
}
```

### ProjectGroupSection

An editorial chapter containing several canonical Projects without inventing an artificial group Project.

```ts
interface ProjectPresentation {
  projectId: ProjectId;
  intro?: SectionIntroData;
  blocks: readonly ContentBlock[];
}

interface ProjectGroupSection {
  type: "project-group";
  id: SectionId;
  intro?: SectionIntroData;
  items: readonly ProjectPresentation[];
}
```

### SpecializedSection

Allowed only when the section itself owns unique runtime behavior that cannot be represented correctly as generic semantic Section + ContentBlocks.

Do not introduce an unrestricted escape hatch such as:

```ts
{ type: "custom", renderer: string }
```

Use explicit typed specialized contracts only, for example a Jestei track-filter section if the section-level runtime requires it.

## Superseded early Section proposal

The earlier proposal:

`narrative / media / gallery / feature / embed`

is not the canonical target. It mixed semantic section responsibility with visual/rendering categories.

The approved semantic Section union is:

`content / project / project-group / specialized`

## Canonical ContentBlock model

```ts
type ContentBlock =
  | MediaFigureBlock
  | MediaGroupBlock
  | MediaSliderBlock
  | MockupBlock
  | MockupDeckBlock
  | JustifiedGalleryBlock
  | BeforeAfterBlock
  | PageFlipBlock
  | AnimatedCanvasGalleryBlock
  | JesteiThemeBlock;
```

Wrappers are intentionally thin and discriminated:

```ts
interface MediaGroupBlock {
  type: "media-group";
  data: MediaGroupData<MediaEntryId>;
}
```

Visual blocks such as Slider, Gallery, MockupDeck, BeforeAfter, PageFlip, and Canvas are not semantic Section types.

## Variant preservation contract

The refactor preserves existing finite variants regardless of whether an active production consumer is currently identified.

This includes at minimum:

- MediaFigure presentation: default and `banner`;
- Media surface composition: single, pair, triptych, embedded deck;
- caption views: `full | summary | overlay | lightbox-only`;
- media fit: `cover | contain`;
- MediaGroup: grid/plain, grid/overflow-reel, grid/compact-reel, strip, strip/infinite-reel, masonry, bento, editorial, sequence, sequence/middle-reel;
- Slider autoplay: off, forward, ping-pong, plus advance-on-ended behavior;
- Mockup devices: desktop/mobile;
- MockupDeck variants: standard/mobile-device and image/canvas-gallery slides;
- JustifiedGallery rows: landscape/portrait/mixed;
- PageFlip density: soft/hard;
- AnimatedCanvasGallery production/masonry and Moves arc/spiral/horizontal/diagonal/showcase-diagonal/masonry;
- Jestei theme states as specialized domain/presentation data.

A variant may be removed only by a separate evidence-backed decision proving that it is a legacy alias, unreachable malformed state, or duplicate canonical contract.

## Variant vs option rule

Not every field is a variant.

- finite semantic state -> typed variant union;
- parameterized geometry such as ratio/columns/interval/position -> controlled presentation option;
- loading/preload/video/lightbox plumbing -> runtime option;
- title/text/meta/credits/note -> editorial data;
- arbitrary `className`, `style`, unrestricted role/theme -> escape hatch requiring normalization when a finite semantic set exists.

Rule:

```text
finite semantic set -> typed union
truly parameterized CSS/layout value -> controlled presentation value
historical implementation hack -> migrate and delete
```

Final finite unions must be derived from a complete usage audit, not guessed.

## Media ownership

All visual references from PageContent / Section / ContentBlock use `MediaEntryId`.

Do not reintroduce:

- raw physical media paths in page composition;
- copied MediaAsset metadata;
- project-local parallel media registries;
- direct project-media markup where a registry-backed renderer exists.

`MediaAsset` remains physical identity, `MediaEntry` remains contextual usage, and `MediaCatalog` remains the browsing/library projection.

## Entity intro normalization

A common presentation contract currently named `ProjectIntroData` must not keep a Project-only name when it is used by Case, Collection, and Project pages.

Target semantic name: `EntityIntroData` or an equivalent final name with the same responsibility.

## Remove Subproject as a domain concept

`Subproject` currently duplicates canonical Project identities and metadata. It must not remain a domain entity in the target architecture.

Target presentation data:

```ts
interface ProjectTeaserPresentation {
  projectId: ProjectId;
  coverEntryId: MediaEntryId;
  shape: "landscape" | "square" | "portrait";
  hrefOverride?: string;
}
```

Do not duplicate title, description, date, or role when they belong to the canonical Project.

## Correct Homepage card semantics

The current homepage `ProjectCard` concept points to Case/Collection identities in places. Its semantic name must be corrected, for example to `PortfolioEntityCardPresentation`.

Reserve `ProjectCard` / `ProjectTeaser` naming for presentation of actual canonical Projects.

## Decouple Homepage and standalone Entity rendering

Incorrect current dependency direction:

```text
Homepage render
  -> extract article
    -> standalone Case/Project page
```

Target:

```text
canonical PageContent
  -> standalone Entity page
  -> optional Home embedded/presentation consumer
```

Homepage may decide which entities to show and which Home-specific teaser/embedded presentation to use. It must not own a second copy of internal Entity composition.

## Page family, visual shell, editorial preset

These are separate axes.

Page families:

- Home;
- Case;
- Project;
- Collection;
- CV;
- NotFound/System.

Visual shells:

- HomeShell;
- EntityShell;
- CvShell;
- NotFoundShell.

Case/Project/Collection may share EntityShell.

Editorial presets remain storytelling/content guidance, not runtime template classes:

- Compact Client Case;
- Large Product Case;
- Large Visual / Brand Case;
- Collection;
- Tool / Product Catalog.

## Renderer boundaries

Canonical renderer entry points:

```ts
function renderContentBlock(block: ContentBlock): string;
function renderSection(section: Section): string;
function renderEntityPage(content: EntityPageContent): string;
```

`renderContentBlock` is the single typed registry boundary between page composition and block renderers. Dispatch must be exhaustive by discriminant.

## Marker/slot retirement

After all consumers migrate, remove runtime composition mechanisms based on:

- HTML marker replacement;
- marker-owned ordering;
- `home-slots` as parallel composition authority;
- article extraction from Homepage;
- giant project-id conditions replacing typed Section/Block dispatch.

Page order must be expressed only by `sections[]`. Block order must be expressed only by `blocks[]` or ProjectPresentation block arrays.

## Specialized components

Do not genericize unique runtime systems merely to reduce filenames.

Systems such as AnimatedCanvasGallery, JesteiThemeOrganism, and Jestei Track Filter may consume shared primitives/tokens while remaining SPECIALIZED until the abstraction lifecycle proves a generic contract.

## CMS boundary

This migration does not create a freeform page builder.

CMS/editorial ownership may include:

- titles;
- paragraphs;
- captions;
- alt text;
- credits;
- validated links;
- approved editorial metadata.

Code ownership includes:

- page identity;
- section/block discriminants;
- layout variants and structural IDs;
- routes;
- runtime behavior;
- code-owned presentation contracts.

A future Section Editor is a consumer of these canonical contracts, not a prerequisite for this refactor.

## Target physical structure

```text
src/
├── domain/
│   └── portfolio/
│       ├── cases/
│       ├── collections/
│       ├── projects/
│       └── queries/
├── content/
│   ├── pages/
│   │   ├── home/
│   │   ├── cases/
│   │   ├── projects/
│   │   └── collections/
│   └── editorial/
├── components/
│   ├── content/
│   ├── specialized/
│   └── navigation/
├── site/
│   ├── pages/
│   ├── renderers/
│   │   ├── home/
│   │   ├── entity/
│   │   └── system/
│   └── routing/
└── types/
    ├── page-content.ts
    ├── sections.ts
    └── ...
```

Physical moves must accompany migration of the corresponding responsibility. Do not create a standalone mass import-churn commit with no semantic migration value.

## CSS migration rule

Do not rewrite CSS for cosmetic cleanup.

For every affected selector:

- legacy selector serving removed architecture -> migrate/remove;
- selector expressing a real component contract -> preserve/move with component;
- genuinely page-specific visual rule -> keep scoped;
- project-specific escape hatch representing a finite semantic set -> normalize to typed contract where safe.

No visible redesign or copy change belongs in this structural migration.

## Architectural validators

At minimum, validation must prove:

- every enabled Entity page has PageContent;
- PageContent.pageId exists in the page manifest;
- every ProjectSection.projectId exists;
- every ProjectPresentation.projectId exists;
- no duplicate PageContent pageId exists;
- ContentBlock dispatch is exhaustive;
- every MediaEntryId reference resolves;
- raw media paths are absent from PageContent;
- Subproject domain records are absent after migration;
- standalone Entity renderer does not depend on Home renderer;
- marker-based composition is absent after retirement;
- teaser presentation does not duplicate canonical Project metadata;
- unrestricted custom Section renderer does not exist.

## Verification strategy

### Contract tests

Validate registries, discriminated unions, IDs, ownership boundaries, and architectural invariants.

### Renderer parity

Preserve current block behavior while render ownership/files move.

### Semantic page golden

Maintain semantic baselines for:

- Home;
- Jestei;
- Styx;
- Sensetique;
- Shootings;
- Awful Cases;
- Moves Awful;
- Berry.

Goldens must not pin CMS-editable wording. They should validate structure, identity, composition, and code-owned semantics.

### Browser gates

Use the cheapest sufficient verification tier under `docs/testing-policy.md`. Visible DOM/layout changes require the appropriate smoke/affected evidence.

## Implementation waves

### Wave 1: Architecture foundation

Add PageContent, Section, ContentBlock, registries, dispatchers, and validators without changing production output.

### Wave 2: Canonical entity cleanup

Normalize EntityIntro naming, remove Subproject as a domain concept, correct homepage entity-card semantics, and remove presentation copies of canonical Project metadata.

### Wave 3: Shootings pilot

Migrate CollectionPage/Shootings to ProjectSection-based composition first because it is the cleanest low-cost validation of the generic model.

### Wave 4: Direct Projects

Migrate Awful Cases, Moves Awful, and Berry.

### Wave 5: Jestei

Map Jestei to canonical ProjectSection / ContentSection / SpecializedSection composition.

### Wave 6: Styx

Map broader chapters and grouped work to ProjectGroupSection where semantically correct.

### Wave 7: Sensetique

Perform the most complex stress migration after generic infrastructure is proven by simpler consumers.

### Wave 8: Home

Switch Homepage to canonical Entity PageContent consumption and remove parallel internal Case composition authority.

### Wave 9: Physical cleanup

Retire mixed legacy `src/templates`, home-slots, article extraction, obsolete markers, compatibility adapters, and dead imports once all consumers are on the canonical path.

### Wave 10: Full gates

Run typecheck, relevant integrity checks, contract tests, semantic goldens, build, and required smoke/E2E tiers. Reconcile documentation against the candidate SHA.

This migration-specific order supersedes the older `Styx -> Sensetique -> Jestei -> ...` pilot order for this implementation program. It does not change later global UI Kit / Tokens / CMS Section Editor / Design System work.

## Git strategy

- Do not directly mutate `dev` or `prod`.
- Keep this design/spec work separate from the media pre-apply branch.
- Recommended implementation branch: `agent/page-content-architecture-refactor-20260904`.
- Create the implementation branch only from final `PRE_APPLY_READY_SHA`.
- Do not use force-push, destructive reset, rebase, or merge as incidental repair steps.

## Definition of Done

The refactor is complete only when all of the following are true:

1. Every Case / Project / Collection has canonical PageContent.
2. PageContent is the sole composition authority.
3. Homepage is not a source of standalone Entity HTML.
4. Marker-based page composition is retired.
5. Subproject is removed as a domain concept.
6. Presentation records do not duplicate canonical Project metadata.
7. Page family, visual shell, and editorial preset are separate concepts.
8. Sections are semantic rather than renderer-name copies.
9. ContentBlocks use one typed dispatcher boundary.
10. Existing finite variants are preserved unless separately retired by explicit evidence-backed decision.
11. Unrestricted presentation strings are narrowed where a real finite semantic set exists.
12. Visual references use MediaEntryId.
13. The mixed legacy `src/templates` layer is not the final canonical architecture.
14. Runtime/content/visual semantics have not regressed.
15. Architectural validators pass.
16. Required repository verification gates pass separately.
17. Documentation is reconciled with the candidate SHA.

## Authority

If an earlier architecture document conflicts with this approved design specifically on PageContent / Section / ContentBlock architecture, this document is authoritative until superseded by a new explicit architecture decision.