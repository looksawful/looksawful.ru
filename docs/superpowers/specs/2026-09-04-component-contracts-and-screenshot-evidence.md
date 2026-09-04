# Component Contracts & Screenshot Evidence

Status: **APPROVED / CANONICAL DOCUMENTATION COMPANION**

Branch: `agent/page-content-architecture-spec-20260904`

Architecture spec: `docs/superpowers/specs/2026-09-04-page-content-section-content-block-architecture-design.md`

## Purpose

This document completes the component-level contract layer required by the PageContent / Section / ContentBlock architecture. It does not change runtime behavior. It records canonical responsibilities, variant/state boundaries, migration targets, and visual-evidence requirements for the components that PageContent and Sections compose.

The detailed human-facing records live in Notion under:

- `04 — Content Blocks`
- `05A — Shared Composition Components`
- `Component & Architecture Screenshot Evidence Registry`

Git remains the executable source of truth; Notion is the detailed architecture/documentation source aligned to these contracts.

## Contract schema

Every canonical visual/composition component must document:

1. responsibility;
2. boundaries;
3. anatomy;
4. variants/states;
5. options/configuration;
6. content contract;
7. TypeScript contract;
8. valid/invalid combinations;
9. rendering/DOM ownership;
10. responsive contract;
11. interaction contract;
12. motion/reduced-motion contract;
13. accessibility contract;
14. media ownership;
15. CMS ownership;
16. production consumers/evidence;
17. abstraction status;
18. known problems;
19. target contract;
20. migration/deprecation;
21. traceability;
22. visual screenshot evidence.

A component is not fully evidenced merely because the contract is written. Screenshot/evidence slots remain open until production captures are bound to an exact SHA and state.

## ContentBlock contracts

### MediaFigure

Responsibility: one semantic contextual media usage with surface, caption, optional compound surface, optional embedded deck, lightbox and image/video behavior.

Canonical axes:

- presentation: default, banner;
- composition: single, pair, triptych, embedded-deck;
- caption: full, summary, overlay, lightbox-only;
- fit: contain, cover;
- media kind: image, video.

Important target rules:

- use `MediaEntryId`, never raw media path;
- compound pair/triptych remains one semantic figure;
- `lightbox-only + lightbox=false` is target-invalid;
- ratio ownership should become intrinsic/fixed/component-owned rather than loose contradictory fields;
- runtime classes are not public variants.

### MediaGroup

Responsibility: one multi-media composition with optional head/credits/note and layout-owned item arrangement.

Canonical discriminated layouts:

- grid/plain;
- grid/overflow-reel;
- grid/compact-reel;
- strip/static;
- strip/infinite-reel;
- masonry;
- bento;
- editorial;
- sequence/static middle;
- sequence/middle reel.

All existing finite variants are preserved even when current production use is not confirmed. Lack of usage is not deletion evidence.

Layout-specific fields must become unrepresentable on unrelated layouts.

### MediaSlider

Responsibility: ordered image/video slides in one viewport with synchronized captions/navigation.

Behavior modes:

- autoplay off;
- forward;
- ping-pong;
- optional advance-on-video-ended.

One visual component; behavior modes must not create artificial component families.

### Mockup

Responsibility: contextual media inside a device/browser-like frame.

Canonical axes:

- device: desktop, mobile;
- role: target finite union, currently confirmed default/wide;
- theme: target finite union, currently confirmed default/dark.

Current free `role?: string` / `theme?: string` are target normalization points.

### MockupDeck

Responsibility: ordered deck inside mockup/device shell.

Variants:

- standard;
- mobile-device.

Standard device: desktop/mobile.

Slide kind:

- image;
- canvas-gallery.

Caption policy: slides / hidden / current compatibility `empty` pending audit. Controls defaults must be normalized because current defaults differ by deck variant.

### JustifiedGallery

Responsibility: authored horizontal rows grouped by visual/orientation semantics.

Row kinds:

- landscape;
- portrait;
- mixed.

Remains distinct only while row semantics/responsive behavior remain meaningfully different from MediaGroup.

### BeforeAfter

Responsibility: one two-image comparison interaction.

No artificial visual variant family. Main authoring surface is before/after MediaEntry, labels/caption and optional initial split. Current mechanical min/max/step configuration should remain component-owned unless a real authoring need appears.

### PageFlip

Responsibility: ordered image pages in publication/book interaction.

Per-page density:

- soft;
- hard.

Density is page data, not whole-component variant. Reduced-motion must preserve navigation with simplified transition.

### AnimatedCanvasGallery

Responsibility: specialized canvas runtime; never interchangeable with DOM gallery layouts merely because both may use the word masonry.

Profiles:

- production -> masonry;
- moves -> arc | spiral | horizontal | diagonal | showcase-diagonal | masonry.

Profile/variant combinations must be strictly typed. Canvas cannot be the sole carrier of essential accessible content.

### JesteiThemeOrganism

Responsibility: Jestei-local specialized interactive theme showcase.

Project-local states:

- neutral;
- basic;
- event;
- pro;
- feature.

These are not global Design System variants. Do not genericize this organism without a separate abstraction decision.

## Shared composition contracts

### Hero

Home-only organism. Owns the opening Home composition and first-viewport identity. It is not a universal Section type.

### SiteNavigation

Global site navigation organism. Canonical states include default, focus-visible, hover where available and current-page semantics. Routes remain canonical/code-owned.

### ProjectNavigator

Portfolio/entity navigation organism. Targets resolve from canonical registries. Must preserve keyboard order, focus-visible and current-location semantics.

### EntityIntro

Target semantic replacement for the common contract currently named `ProjectIntroData` but used by Case/Collection/Project.

Current fields include:

- head;
- title;
- role;
- period;
- summary;
- lead;
- linksLabel;
- links.

Identity can be text or logo usage. The common contract must not retain a Project-only name.

### PortfolioEntityCard

Target replacement for Home `ProjectCard` where the target is actually a Case/Collection/entity page.

References canonical page/entity identity and presentation-only cover data. `ProjectCard` naming is reserved for actual canonical Project presentation.

### ProjectTeaser

Presentation-only replacement for the domain-like `SubprojectCard` duplication.

```ts
interface ProjectTeaserPresentation {
  projectId: ProjectId;
  coverEntryId: MediaEntryId;
  shape: "landscape" | "square" | "portrait";
  hrefOverride?: string;
}
```

Do not duplicate canonical Project title/description/date/role.

### SectionIntro

Shared molecule for semantic Section heading + editorial paragraphs. It must not own Section type/layout/project membership. Editorial copy is CMS-owned; structural composition remains code-owned.

### MediaCaption

Shared media molecule. Presentation states:

- full;
- summary;
- overlay;
- lightbox-only.

Overlay is progressive enhancement on fine-pointer/hover-capable input. Essential content cannot be hover-only. Touch fallback remains stable and non-hover dependent.

### Credits

Compact structured metadata lines with optional title. Editorial/CMS-owned where exposed. Shared only when current credits shapes are proven structurally equivalent.

### GroupNote

Supporting note slot, currently with semantic kinds `editorial | group`, required text and optional link. Not a SectionIntro replacement and not media-caption content.

### MediaSurface

Shared geometry molecule below MediaFigure-like owners.

Current concepts:

- derived/intrinsic ratio;
- authored fixed ratio;
- component-owned geometry;
- fit cover/contain;
- position;
- compound parent layouts pair/triptych.

Presentation wrappers must not duplicate media semantics.

### ClientLogo

Typed logo-usage renderer. Consumes canonical logo usage identity; does not own raw path/client identity. Accessibility must distinguish decorative vs meaningful usage.

### ResponsiveImage

Low-level responsive image delivery primitive. It does not own semantic placement, caption or Section meaning. Generated media variants remain tooling-owned; alt comes from contextual usage.

### ResourceLinks

Target shared molecule for ordered validated internal/external resource links. No generic visual variants are approved until repeated production presentation proves them. URL security/target policy remains code-owned.

## Screenshot evidence contract

Every visually observable component/page/section receives an explicit screenshot slot.

Every filled slot records:

- component/entity name;
- exact variant/state;
- page route/consumer;
- viewport;
- container width where container-query behavior matters;
- input/pointer mode where behavior differs;
- motion preference where behavior differs;
- exact source SHA;
- capture date;
- statement of what the capture proves.

A screenshot without state and SHA is illustrative material, not canonical evidence.

### Required page/shell evidence

- HomeShell/Home PageContent: 390x844, 768 checkpoint, 1440x900, wide 1920;
- EntityShell/Case: narrow + desktop, section boundary, representative media composition and project navigation modes;
- EntityShell/Collection: Shootings narrow + desktop with repeated ProjectSection composition;
- EntityShell/Direct Project: narrow + desktop proving direct PageContent rendering without Homepage extraction.

### Required semantic Section evidence

- ContentSection: example not bound to canonical Project;
- ProjectSection: example with annotated `projectId`;
- ProjectGroupSection: example with multiple annotated child `projectId` values;
- SpecializedSection: separate capture for each explicit specialized section-level runtime.

### Required component evidence

- MediaFigure: default/banner, single/pair/triptych if evidenced, embedded deck, caption states, fit examples, image/video;
- MediaGroup: every layout/mode plus wide/compact responsive transforms; unresolved bento/middle-reel remain evidence gaps;
- MediaSlider: controls, caption synchronization, image/video, behavior modes where observable;
- Mockup: desktop/mobile, wide, dark, representative video;
- MockupDeck: standard/mobile-device, controls/captions, image/canvas slide;
- JustifiedGallery: landscape/portrait/mixed and multi-row composition;
- BeforeAfter: centered/non-centered, keyboard focus, mobile touch state;
- PageFlip: initial/interior, soft/hard, focus controls, compact and reduced-motion reference;
- AnimatedCanvasGallery: production/masonry and all Moves variants plus fallback/reduced-motion state;
- JesteiThemeOrganism: all project-local theme states plus compact/reduced-motion state;
- Hero, SiteNavigation, ProjectNavigator, EntityIntro, PortfolioEntityCard, ProjectTeaser, SectionIntro, MediaCaption, Credits, GroupNote, MediaSurface, ClientLogo, ResponsiveImage and ResourceLinks each have a local Notion screenshot slot.

## Completion rule

A contract may be structurally documented while visual evidence remains open.

Visual documentation is complete only when every required slot is either:

- filled with exact evidence; or
- explicitly marked `NOT VISUALLY DISTINCT / NOT APPLICABLE` with rationale.

`EMPTY`, `VERIFY`, `UNKNOWN`, and `EVIDENCE GAP` are open documentation states and must not be represented as verified production evidence.

## Implementation boundary

This document does not authorize implementation from the documentation branch.

The code migration must still start from the final `PRE_APPLY_READY_SHA` produced by the media-normalization pre-apply chain, as required by the architecture spec.
