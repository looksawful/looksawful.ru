# Pet Projects System V2 Design

## Goal

Prepare a production-like, extensible Pet Projects system for looksawful.ru without changing production yet. The system must support the current four public projects, future projects, explicit publication states, `NEW` and `COMING SOON` presentation, a mobile horizontal reel with an emphasized active card, a desktop grid, and canonical project pages that use the site's existing entity/page architecture.

The prototype must be realistic enough to review visually and behaviorally in Lab/Storybook before production integration.

## Source of truth and branch safety

- `prod` remains the production branch and is not modified by this design phase.
- `dev` remains archival and is not the implementation base for production work.
- The implementation branch must start from the current `prod` SHA.
- Lab/Storybook is a review surface, not a second application architecture.
- Production integration happens only after explicit visual approval.

## Current public Pet Projects

The public homepage candidate contains exactly these four projects:

1. `awful-cases`
   - Title: `Awful Cases`
   - Description: `Утилита для Windows: регистр и типографика выделенного текста.`
2. `moves-awful`
   - Title: `Moves Awful`
   - Description: `Библиотека с шаблонами анимированных canvas галерей для лендингов.`
3. `berserk-timer`
   - Title: `Berserk Timer`
   - Description: `Консольный помодоро-таймер для Windows.`
4. `awful-studio`
   - Title: `AWFUL STUDIO`
   - Description: `Расширение Blender для сборки виртуальной предметной студии.`

Roles and years are not shown in these cards.

## Reserved future Pet Projects

The architecture must reserve identifiers and support later activation for these projects without requiring component rewrites:

- `awful-mockups`
- `awful-textures`
- `photoshop-translation`
- `keys`
- `sea`
- `comfy-workflows`
- `photoshop-workflows`
- `blender-scenes`
- `shaders`
- `3d-assets`

These future projects are not published, linked, routed, or rendered on the production-like homepage candidate yet.

## Architectural approach

Use the existing `SubprojectCard` family as the visual/markup foundation, but introduce a dedicated Pet Projects data contract and rendering path instead of continuously adding Pet-specific exceptions to the generic `SubprojectCardData` interface.

The Pet Projects component must reuse the site's tokens, media renderer, reveal/motion contracts, responsive conventions, and canonical project-page architecture. It must not create a parallel mini design system.

The current inline Pet Projects CSS in `src/site/renderers/home/home-slots.ts` is architectural debt because it duplicates `src/styles/subproject-cards.css`. The implementation removes that duplication and gives Pet Projects one stylesheet owner.

## TypeScript model

The Pet Projects model is a discriminated union. State controls interactivity at the type level so invalid combinations are difficult to represent.

```ts
export type PetProjectId =
  | "awful-cases"
  | "moves-awful"
  | "berserk-timer"
  | "awful-studio"
  | "awful-mockups"
  | "awful-textures"
  | "photoshop-translation"
  | "keys"
  | "sea"
  | "comfy-workflows"
  | "photoshop-workflows"
  | "blender-scenes"
  | "shaders"
  | "3d-assets";

export type PetProjectKind =
  | "app"
  | "library"
  | "extension"
  | "workflow-library"
  | "asset-library"
  | "scene-library"
  | "shader-library"
  | "project";

interface PetProjectCardBase {
  id: PetProjectId;
  title: string;
  description: string;
  kind: PetProjectKind;
  shape: "landscape" | "square" | "portrait";
  coverEntryId?: MediaEntryId;
}

export interface LivePetProjectCard extends PetProjectCardBase {
  status: "live";
  href: string;
  badge?: "new";
}

export interface ComingSoonPetProjectCard extends PetProjectCardBase {
  status: "coming-soon";
  href?: never;
  badge?: never;
}

export interface HiddenPetProjectCard extends PetProjectCardBase {
  status: "hidden";
  href?: never;
  badge?: never;
}

export type PetProjectCardData =
  | LivePetProjectCard
  | ComingSoonPetProjectCard
  | HiddenPetProjectCard;
```

### Why this model

- `NEW` is deliberately manual. It never expires automatically based on a date.
- `COMING SOON` is derived from `status: "coming-soon"`, not independently toggled, so a card cannot accidentally be clickable while also marked unavailable.
- `hidden` records can exist architecturally without being rendered.
- `kind` is data for future grouping/filtering and does not need to appear visually now.
- `href` exists only for live cards.

## Rendering contract

### Live card

- Render as `<a>`.
- Use canonical internal `/work/.../` URL when the project has a canonical page.
- Optional `NEW` badge is rendered only when `badge: "new"` is present.
- Keyboard and pointer behavior remain native link behavior.

### Coming Soon card

- Render as `<article>`, never as an anchor with disabled pointer events.
- Render a visible `COMING SOON` badge.
- Do not add fake `href`, click handler, or keyboard activation.
- Do not apply interactive hover treatment.

### Hidden card

- Do not render at all.

### Badge presentation

- Badge sits within the card media area, aligned to the existing spacing/radius tokens.
- Badge is compact, legible, and visually subordinate to the project image/title.
- `NEW` and `COMING SOON` use the same badge component/geometry with different labels.
- No automatic timestamps, countdowns, or animated attention effects.

## Homepage responsive behavior

### Narrow containers / mobile

The Pet Projects homepage component is a horizontal reel:

- CSS owns sizing and overflow.
- Cards use a large intrinsic width so one card is primary and adjacent cards remain partially visible.
- `overflow-x: auto` and `scroll-snap-type: inline mandatory` provide native scrolling.
- Cards snap to the center.
- The active/snapped card is visually emphasized through `scale` and opacity.
- Neighboring cards remain visible and slightly reduced.
- Layout does not use JavaScript width calculations.
- JavaScript may only manage the cross-browser active-state marker when CSS scroll-state queries are not sufficient.
- Reduced-motion mode removes scale animation while preserving scroll and content access.

Target review viewport: approximately 390 px.

### Intermediate containers

- Switch from reel to a two-column grid.
- Disable snap behavior and active-card scaling.
- Preserve the same card markup and data source.

Target review viewport: approximately 834 px.

### Wide containers

- Four current cards appear as a balanced four-column grid.
- When more projects are later enabled, additional cards flow into subsequent rows without changing component markup.
- Avoid the current three-column endpoint for a four-card set.

Target review viewport: approximately 1440 px.

## CSS principles

- Mobile-first.
- Component-local container queries where behavior depends on component width rather than viewport width.
- Logical properties (`inline`, `block`) instead of physical left/right sizing where practical.
- Existing spacing, typography, border, radius, motion, and color tokens remain authoritative.
- No duplicated component CSS embedded in TypeScript renderers.
- No separate Pet Projects token set unless a value is truly component-specific.
- CSS owns layout. TypeScript owns state/data/semantics.
- Prefer intrinsic layout primitives (`minmax`, `clamp`, grid/flex, scroll snap) over device-specific breakpoint catalogs.

## Card content and hierarchy

The card contains:

1. media
2. optional state badge
3. project title
4. short description

No role/year metadata is shown.

The image remains the dominant element. Title and description use the existing site caption hierarchy rather than introducing a separate promotional-card typography system.

## Media behavior

- Continue using the canonical media catalog and `renderMediaElement`/existing media templates.
- `coverEntryId` remains the canonical source for production cards.
- Do not hand-edit generated responsive media outputs.
- For prototype-only future-state stories, mock media may be used only inside Storybook fixtures and must not enter the canonical media catalog as fake project content.
- Current production-like four-card story should use real project media.

## Canonical current project pages

Current Pet Project cards must resolve to canonical pages using the existing entity architecture:

- `/work/awful-cases/`
- `/work/moves-awful/`
- `/work/berserk-timer/`
- `/work/awful-studio/`

`Awful Cases` and `Moves Awful` already establish the intended page pattern. `Berserk Timer` and `AWFUL STUDIO` should use the same `EntityPageContent` + `EntityShellPresentation` + page manifest architecture rather than standalone Pet HTML pages.

Future ten projects do not receive public routes or pages yet.

## Production-like page prototype

The review prototype must let the user inspect more than a card specimen. It must show the real experience expected after production integration:

1. homepage-like Pet Projects section in site context;
2. mobile horizontal reel behavior;
3. intermediate 2-column behavior;
4. wide 4-column behavior;
5. clickable transitions to the four current canonical-style project pages;
6. `NEW` state specimen;
7. `COMING SOON` non-clickable specimen;
8. hidden-state fixture proving hidden records do not render;
9. realistic project-page shell and media hierarchy.

The state specimens belong in Storybook/Lab review stories, not in the production-like homepage candidate unless explicitly enabled.

## Storybook / Lab review structure

Storybook is used as a component review surface, not the source of production implementation.

Recommended stories:

- `03 Organisms / Pet Projects / Production Candidate`
  - exact four current public cards
  - real media
  - site tokens/styles
- `03 Organisms / Pet Projects / States`
  - normal live
  - `NEW`
  - `COMING SOON`
  - hidden record omitted
- `03 Organisms / Pet Projects / Mobile Reel`
  - constrained 390 px review surface
- `03 Organisms / Pet Projects / Intermediate Grid`
  - constrained 834 px review surface
- `03 Organisms / Pet Projects / Wide Grid`
  - constrained 1440 px review surface
- `04 Pages / Pet Project / Production Candidate`
  - project-page shell using current canonical architecture

Lab should link to these stable stories and a production-like integrated preview route.

## Prototype fidelity

The prototype is considered acceptable only if the visual result is representative of actual production integration. It must therefore reuse:

- production tokens;
- production fonts;
- production card markup or the implementation candidate markup;
- production media rendering;
- production page shell;
- actual approved card copy;
- actual project media for the four current cards.

A standalone fake card layout with approximate spacing is not sufficient.

## Accessibility

- Native anchor semantics for live cards.
- Non-interactive semantics for coming-soon cards.
- Visible focus treatment inherited from site conventions.
- Badge text is real text, not background imagery.
- Horizontal reel remains keyboard/trackpad/touch scrollable.
- Reduced-motion preference removes nonessential scale animation.
- No content or functionality depends exclusively on hover.

## Motion and active state

The active-card enlargement is present only in reel mode.

Preferred implementation:

1. native CSS scroll snap controls position;
2. use CSS scroll-state container queries when supported;
3. use a minimal `IntersectionObserver`/closest-to-center controller as a compatibility fallback if required by the supported-browser matrix;
4. the controller sets only state (`data-active`/equivalent), never widths or positions.

This preserves CSS ownership of layout while guaranteeing the agreed active-card treatment on supported production browsers.

## Current technical debt addressed by this work

Only debt directly blocking this component is included:

- remove duplicated Pet Projects CSS from `src/site/renderers/home/home-slots.ts`;
- keep Pet-specific layout in its stylesheet owner;
- remove homepage-time hard-coded ID-to-href mapping once canonical Pet data owns its own live URLs;
- separate Pet-specific state from the generic shooting/subproject card data contract.

Broader unrelated CSS cleanup remains outside this implementation unless it is required by one of these changes.

## Data flow

```text
Pet Project registry
    -> visible-card selector (status !== hidden)
    -> Pet Project renderer
       -> live => anchor
       -> coming-soon => article + badge
    -> homepage Pet Projects section

Pet Project registry
    -> Storybook fixtures / state stories

Canonical project catalog + page content + presentation + manifest
    -> /work/<project>/
```

The card component does not own route registration. A project becomes fully live only after its route/page exists and its Pet Project entry is intentionally switched to `status: "live"` with a valid canonical `href`.

## Validation and tests

Implementation must add or update tests for:

- live cards require `href` at compile/type level;
- coming-soon/hidden cards cannot carry `href`;
- hidden records do not render;
- coming-soon cards render no anchor;
- `NEW` renders only when manually requested;
- coming-soon badge is derived from status;
- exact approved copy for the four current cards;
- four current cards are the only cards in the production candidate;
- Berserk Timer and AWFUL STUDIO canonical routes are registered when those pages are implemented;
- current page/domain identity tests include AWFUL STUDIO as required;
- Fast test suite remains green;
- TypeScript typecheck remains green;
- Storybook static build succeeds;
- Lab build succeeds;
- responsive review at 390 / 834 / 1440 has no unintended page-level horizontal overflow.

## Non-goals

This phase does not:

- publish any of the ten future projects;
- create fake public pages for unfinished projects;
- add search/filter UI to Pet Projects;
- add automatic `NEW` expiration;
- add CMS authoring for these states;
- merge to `prod`;
- redesign unrelated homepage sections;
- invent project facts or media.

## Acceptance criteria

The design is ready for implementation when all of the following are true:

- the data model can represent all 14 known Pet Project IDs;
- only four current projects appear in the production-like homepage candidate;
- a live card may optionally display `NEW`;
- a coming-soon card is visibly marked and genuinely non-clickable;
- a hidden project is absent from rendering;
- mobile uses a horizontal snapping reel with an emphasized active card;
- intermediate layout uses two columns;
- wide layout uses four columns for the current four-card set;
- current project pages use the site's canonical page architecture;
- future projects require data/page activation rather than card-component rewrites;
- Storybook/Lab can demonstrate production candidate, responsive behavior, states, and page shell;
- production remains unchanged until explicit approval.
