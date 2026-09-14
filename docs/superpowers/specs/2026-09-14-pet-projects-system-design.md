# Pet Projects system design

Status: approved for preview implementation on `preview/pet-projects-system`.

## Goal

Build the Pet Projects section as a production-ready, reusable homepage component that scales beyond the current four authored projects without changing the site architecture. The preview must use the real looksawful.ru shell, tokens, media pipeline, page model and responsive behavior so that approval is about the actual production candidate rather than a detached mockup.

Production remains untouched until explicit approval.

## Current authored set and release gate

The section heading is exactly `Полезное`.

The current authored set is:

1. **Awful Cases** — `Утилита для Windows: регистр и типографика выделенного текста.`
2. **Moves Awful** — `Библиотека с шаблонами анимированных canvas галерей для лендингов.`
3. **Berserk Timer** — `Консольный помодоро-таймер для Windows.`
4. **AWFUL STUDIO** — `Расширение Blender для сборки виртуальной предметной студии.`

Roles and years are not shown in these cards.

Awful Cases and Moves Awful are the currently live cards. Berserk Timer and AWFUL STUDIO are implementation-ready entities but remain release-gated until their final cards/pages are approved:

- their homepage cards use `state: "coming-soon"` and therefore expose no `href`;
- their production-candidate SitePage definitions exist but use `enabled: false`, `listed: false`, `indexable: false`;
- `getPageByPath()` must not resolve either disabled route;
- the private password-protected Lab may enable the same routes for development and visual review.

Moving Berserk Timer or AWFUL STUDIO to `live` is a separate release action: final media/content approval, card `href`, and SitePage `enabled: true` must land together. This avoids a half-published state where a card or guessed URL exposes unfinished work.

## Future projects

The component must be able to accept additional cards without renderer or layout rewrites. Planned names currently include:

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

These future projects are roadmap only for this change. They must not acquire public routes, public cards, sitemap entries, indexability or domain records merely to demonstrate extensibility.

## Domain boundary

The repository's existing Case / Project / Collection / Engagement model remains canonical. Pet Projects is a presentation/collection surface, not a new entity type.

A card may reference an existing project route, but the card component must not create routes or imply that a future project exists in the domain catalog. When a future project becomes real, it follows the normal flow: domain Project record -> EntityPageContent -> page manifest/presentation -> media -> card.

## Card model

Extend the existing subproject-card presentation contract rather than create a parallel card system.

The card contract must support two semantic interaction states:

- `live`: requires `href` and renders as an anchor.
- `coming-soon`: has no `href`, renders as a non-interactive article, and shows the `COMING SOON` badge.

A manual `NEW` badge is independent of lifecycle and can be enabled or removed by authored data. It is not date-derived.

TypeScript should enforce invalid combinations at compile time through a discriminated union. In particular, `coming-soon` must not accept `href`, and `live` must require it for Pet Project entries.

No separate `hidden` runtime card state is required. A project that should not appear simply does not exist in the rendered Pet Project card list. Page availability is independently controlled by the canonical SitePage `enabled` flag.

No `kind` taxonomy is introduced in this iteration because nothing in the current UI consumes it. Add it later only when filtering/grouping requires it.

## Markup and accessibility

Clickable cards are anchors. Coming-soon cards are articles, not disabled anchors and not `pointer-events: none` links.

Badges are visible text in the card chrome and do not replace title/description semantics. The component keeps progressive-enhancement HTML: titles and descriptions remain available without JavaScript.

Focus indication must remain visible and consistent with the site's existing focus contract.

## Responsive layout

CSS owns sizing, overflow and responsive composition.

The component is mobile-first and container-driven:

- narrow container: horizontal reel, one dominant landscape card at a time, visible neighboring card edges, native horizontal scrolling and CSS scroll snap;
- intermediate container: 2-column grid;
- wide container: 4-column grid;
- more than four cards naturally create additional grid rows on wide layouts.

The layout must depend on the component's inline size, not named devices. Use the existing spacing, typography, radius and color tokens. Do not introduce a new token system or framework.

### Active card emphasis on mobile

The snapped/central card receives the visual emphasis requested in the earlier homepage-preview design: full scale/opacity, while neighboring cards are slightly smaller and quieter.

Prefer native CSS state when supported by the project's Chromium floor. The required baseline remains fully usable if the enhancement is unsupported: the reel still scrolls and snaps, but all cards may remain at equal scale. Do not add JavaScript merely to calculate responsive geometry.

`prefers-reduced-motion: reduce` disables scaling transitions while preserving scrolling and content.

## Desktop behavior

Desktop is not a forced carousel. Once the component has enough inline space, it becomes a stable grid. With the current four authored cards the wide layout is one row of four cards; with future additions it becomes subsequent rows without changing authored data or markup.

## Media behavior

Cards continue to use the canonical media catalog and `renderMediaElement`. The component does not use remote hotlinked prototype assets in the final candidate.

Landscape card media uses a stable aspect ratio and deterministic `object-fit` policy. Project-specific media choice is data-owned, not CSS-owned.

## Homepage integration

The homepage renderer must stop embedding a duplicate stylesheet string for Pet Projects. `home-slots.ts` owns composition only; `src/styles/subproject-cards.css` owns the card and Pet Projects layout.

The homepage must render the exact heading and card copy above. Release-gated cards may remain visible as non-interactive `COMING SOON` articles, but they must never expose a public link before their page is enabled.

## Project pages

Existing canonical pages remain:

- `/work/awful-cases/`
- `/work/moves-awful/`

Prepare production-like EntityPage architecture for:

- `/work/berserk-timer/`
- `/work/awful-studio/`

They must use the existing `EntityPageContent` + `EntityShellPresentation` + entity renderer architecture. Do not create standalone page shells or a generic page builder.

Until their final cards/pages are approved, both production-candidate manifest entries stay `enabled:false`, `listed:false`, `indexable:false`. Their files/content may exist in the branch so development can continue without making the routes publicly routable. The password-protected Lab may enable them for review.

Berserk Timer page content must represent the console Pomodoro timer described by the approved card copy and available project evidence. Do not silently mix unrelated desktop/CLI product identities or expose a private repository as a public link.

AWFUL STUDIO uses the current Blender-native product-studio facts and real prepared media. Its eventual presentation hierarchy is: intro -> strong hero -> mockup/product deck -> technical/system slider -> compact final media group. Reuse existing media blocks and page shell.

## Preview strategy

The primary production-candidate surface is a draft PR based on current `prod`. Release-gated routes remain disabled there until final page/card approval.

Additionally expose an isolated password-protected Lab preview fixture for card states and private route review so the following can be inspected without exposing unfinished work to real users:

- normal live card;
- live card with `NEW`;
- `COMING SOON` non-clickable card;
- 4-card current authored set;
- larger synthetic set to demonstrate multiple desktop rows and mobile scrolling;
- enabled private versions of the Berserk Timer and AWFUL STUDIO routes when needed for development.

Storybook may consume the same renderer/fixtures if the current Lab Storybook infrastructure is available, but Storybook must not become a second implementation of the component. The production renderer and CSS are the source of truth.

## Tests and verification

Use TDD for long-lived contracts. Permanent tests should protect semantic/type/page contracts, not screenshot literals or incidental CSS implementation.

Required verification before calling the preview ready:

- TypeScript typecheck;
- focused card-rendering/route contracts;
- permanent release-gate contracts proving unfinished cards have no `href` and unfinished production-candidate pages are disabled/unlisted/non-indexable;
- `test:fast` if affected contracts are in its manifest;
- `npm run build:site`;
- relevant project/MPA E2E where applicable;
- manual/affected responsive Chromium check for 390, 834 and 1440 class viewports;
- private Lab/Storybook deploy for visual review;
- PR Preview checks on the exact branch SHA.

Final report must classify new tests according to `docs/testing-policy.md`.

## Non-goals

- no production merge without explicit approval;
- no publicly routable unfinished Berserk Timer or AWFUL STUDIO page;
- no public future-project routes or placeholder pages;
- no new CSS framework/reset/token system;
- no JS-driven breakpoint/layout calculations;
- no CMS route creation;
- no filtering/grouping taxonomy until the UI actually needs it;
- no redesign of unrelated shooting/subproject cards.
