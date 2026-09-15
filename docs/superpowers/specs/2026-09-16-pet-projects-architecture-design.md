# Pet Projects Architecture Design

## Goal

Make the `Полезное` / Pet Projects subsystem extensible beyond the current four projects without exposing unfinished work, while preserving the existing site shell, media catalog, page manifest and editorial ownership model.

## Current problems

- `USEFUL_PROJECT_DEFINITIONS` mixes visibility and lifecycle state, so `visible` and `state` can contradict each other.
- Hidden future projects cannot exist without authored card copy and a cover asset because the current parser requires all card records and every definition requires `coverEntryId`.
- `badge` is an arbitrary string even though the intended authored control is only the manual `NEW` badge; `COMING SOON` is a lifecycle state, not authored copy.
- Production currently contains future cards that should not be public yet.
- `awful-3d-mockups` duplicates the intended `awful-mockups` direction and is not part of the approved project list.
- AWFUL STUDIO already has a canonical domain entity, PageContent and manifest entry, but its route remains disabled and its page body is not ready for production publication.

## Approved project registry

Current/public projects:

1. `awful-cases`
2. `moves-awful`
3. `berserk-timer`
4. `awful-studio`

Future/hidden projects:

5. `awful-mockups`
6. `awful-textures`
7. `photoshop-translation`
8. `keys`
9. `sea`
10. `comfy-workflows`
11. `photoshop-workflows`
12. `blender-scenes`
13. `shaders`
14. `3d-assets`

No route or public card is created for a hidden project.

## Data model

Use one lifecycle field as the source of truth:

```ts
type UsefulProjectState = "live" | "coming-soon" | "hidden";
type UsefulProjectBadge = "new";

type UsefulProjectDefinition =
  | {
      id: string;
      state: "live";
      href: string;
      coverEntryId: MediaEntryId;
      badge?: UsefulProjectBadge;
    }
  | {
      id: string;
      state: "coming-soon";
      coverEntryId: MediaEntryId;
    }
  | {
      id: string;
      state: "hidden";
    };
```

Rules:

- `live` is clickable and must have both `href` and `coverEntryId`.
- `coming-soon` renders only when intentionally selected as such, is not clickable, and gets the code-owned `COMING SOON` presentation.
- `hidden` is registry-only. It requires neither page route, cover nor editorial card copy and does not render.
- `NEW` is a manual code-owned boolean-like badge expressed as the typed value `"new"`; it never expires automatically.
- Editorial JSON owns public card title/description only for projects that can render (`live` or `coming-soon`).

## Rendering

`PetProjectCardData` remains the renderer-facing type. The renderer should not need to understand registry parsing.

- Live card: semantic `<a>`.
- Coming soon card: semantic `<article>`, no fake href and no `pointer-events: none` link.
- `NEW` label is rendered from the typed `badge` value.
- `COMING SOON` label is derived from `state`, not stored as editable text.
- Hidden definitions never reach `renderPetProjectCards()`.

Card visual redesign is out of production scope for this wave. Existing production CSS remains unchanged except for state/badge selectors needed by the typed contract. A separate prototype may demonstrate the future reel without changing the live homepage.

## Editorial copy

Current four card texts are fixed to the owner's approved wording:

- Awful Cases: `Утилита для Windows: регистр и типографика выделенного текста.`
- Moves Awful: `Библиотека с шаблонами анимированных canvas галерей для лендингов.`
- Berserk Timer: `Консольный помодоро-таймер для Windows.`
- AWFUL STUDIO: `Расширение Blender для сборки виртуальной предметной студии.`

No role/year metadata is part of these card descriptions.

## Pages

- Keep existing canonical `/work/awful-cases/`, `/work/moves-awful/`, `/work/berserk-timer/` routes.
- Keep `/work/awful-studio/` disabled until its content/media page is sufficiently complete for production.
- Hidden future projects get no route entries yet.
- When a future project is ready, promotion is explicit: `hidden -> coming-soon` or `hidden -> live`, plus editorial card content, cover and route/page only if the selected state requires them.

## Production-like prototype

Prototype work must reuse the production card renderer/data semantics rather than a second fake card model. The preferred preview is a temporary PR-preview-only Vite page on the feature branch. It may add prototype-specific composition CSS, but production state/data semantics remain shared.

The preview demonstrates:

- the four approved current cards;
- one synthetic `NEW` state using real card data semantics;
- one synthetic `COMING SOON` state using real card data semantics;
- desktop, intermediate and mobile compositions;
- the intended mobile horizontal reel with centered snap emphasis as progressive enhancement;
- representative project-page navigation targets without enabling unfinished production routes.

Prototype-only files are removed or kept clearly outside production runtime before final merge, depending on owner approval.

## Responsive direction for the prototype

- Mobile first.
- Narrow containers: horizontal scroll-snap reel with card width derived from available inline size, not device names.
- Active/snapped card may receive a subtle scale/emphasis only where supported; the baseline remains fully usable without scroll-state queries.
- Medium containers: 2-column grid.
- Wide containers: 4-column grid for the current four projects.
- CSS owns layout and responsive behavior. No JS geometry calculations.
- Respect `prefers-reduced-motion`.

## Testing and verification

Permanent tests should protect only stable architecture contracts:

- hidden definitions do not require editorial card copy or assets;
- live definitions require href + cover;
- coming-soon definitions are non-clickable at render time;
- manual badge vocabulary is typed/restricted;
- current registry contains the approved project IDs and future entries remain hidden.

Literal editable descriptions are not pinned by permanent tests. Copy is verified by content review/build rather than permanent literal assertions.

Required gates for the final branch: typecheck, focused contract tests, Fast CI, build:site and PR preview deployment. Responsive browser checks are affected/manual evidence, not a new fast-CI obligation.

## Non-goals

- No redesign of the live Pet Projects cards in this wave.
- No publication of future project pages.
- No new design system, utility framework, reset or JS responsive engine.
- No invented media or placeholder production assets.
- No production merge until exact branch/CI/preview state has been reviewed.
