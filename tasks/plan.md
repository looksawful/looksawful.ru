# Implementation Plan: Gallery Phase 2 + Design System Primitives

## Overview

Run two coordinated site workstreams in parallel:

1. **Gallery phase 2** expands the current photography-first Gallery into a curated multi-format portfolio archive.
2. **Design System primitives** establishes production-owned Button, Badge, Chip, Tag, Tabs, Pill, Divider and Tooltip contracts.

GitHub Issues are the canonical engineering task tracker. Todoist remains the personal execution mirror. Asset inventory and authored media metadata remain in the canonical Media Catalog + Media Desk / Pages CMS.

No second Gallery database, no parallel taxonomy and no Storybook-only component forks.

## Architecture Decisions

- Gallery curation changes public Placement, not Media Catalog identity.
- Media Catalog + Media Desk / Pages CMS remain the asset inventory/editorial source.
- Gallery keeps existing photography eligibility intact; non-photo media enters through explicit typed contracts.
- #935 remains the canonical 3D generation/library owner; Gallery consumes its validated outputs.
- #894 remains separate Animated Canvas/Moves runtime work.
- #861 remains the broad component/system parity audit; #1106 owns this primitive stream.
- UIAudit #1121 is baseline evidence. Its P1 accessibility findings are fixed before Gallery expansion/release rather than deferred to final polish.
- Storybook is an approval/verification surface, never a second implementation.
- Release remains a narrow prod promotion from the current production baseline.

## Dependency Graph

```text
Gallery
#1121 P1 remediation
   ├─ item-specific photo control names
   ├─ shared skip-to-main
   └─ semantic Gallery page orientation
          │
          v
#1107 inventory ──> #1108 typed multi-format contract ──> #1109 curated 2D/video ingestion
                         │
                         ├─ PhotoSwipe ownership consolidation
                         │
                         └─ shared media/runtime seams
                                                        │
#935 validated 3D library ──────────────────────────────┤
                         │                              v
                         └──────────────> #1110 Gallery 3D integration
                                              │
                                              v
                                      #1111 QA + release gate

Design System
#1112 semantic inventory
      │
      v
#1113 Button tracer slice
      │
      ├────────> #1114 Badge/Chip/Tag/Pill
      ├────────> #1115 Tabs
      ├────────> #1116 Divider
      └────────> #1117 Tooltip
                       │
                       v
                 #1118 migration + reconciliation
                       │
                       v
                 #861 system audit reconciliation
```

## Task List

Tasks are tracked in GitHub Issues; this file is the ordered index and dependency plan.

### Phase 0: Baseline remediation

- [ ] **#1121 P1 — distinguish Gallery photo controls**
  - Use item-specific accessible names.
  - Preserve canonical title/alt identity.
  - Add regression coverage at the renderer/browser seam.

- [ ] **#1121 P1 — shared keyboard bypass**
  - Add one shared skip-to-main path in the page shell.
  - Verify visible focus and keyboard operation.

- [ ] **#1121 P2 — semantic Gallery orientation**
  - Preserve the no-visible-heading composition.
  - Restore semantic page identity through a visually hidden heading or equally robust semantic mechanism.

### Checkpoint A: Accessibility baseline

- [ ] Gallery controls are distinguishable to assistive technology.
- [ ] Keyboard users can bypass repeated navigation.
- [ ] Gallery has semantic page orientation without changing the visible composition.
- [ ] Focused tests/typecheck/build are green.

### Phase 1: Foundations — run in parallel

#### Gallery

- [ ] **#1107 — canonical inventory of 11 requested asset classes**
  - Map logos, brand books, production, palettes, generations, design, covers, 3D, mockups, videos and character sheets to canonical Media Catalog taxonomy.
  - Identify missing registration/metadata/taxonomy instead of inventing duplicate categories.
  - Mark approved candidates separately from merely available assets.

#### Design System

- [ ] **#1112 — semantic inventory of current primitives**
  - Inventory current Button/Badge/Chip/Tag/Tabs/Pill/Divider/Tooltip-like usages.
  - Separate semantic roles from shape/style.
  - Prove whether Pill deserves a component identity or should remain a visual variant/token.

### Checkpoint B: Contracts known

- [ ] Every Gallery asset class has a canonical mapping or explicit gap.
- [ ] Every primitive has a settled semantic role and state model.
- [ ] No new taxonomy/database/component category exists only to satisfy the plan.

### Phase 2: Establish the reusable seams

#### Gallery

- [ ] **#1108 — typed multi-format Gallery contract**
  - Preserve the photo contract.
  - Define typed image/video/model/document-like presentation and fallback behavior.
  - Consolidate common PhotoSwipe dialog/caption/lifecycle ownership before adding more media kinds.
  - Keep Gallery-specific URL/history/curation state outside the shared adapter.

#### Design System

- [ ] **#1113 — Button tracer slice**
  - Establish the canonical primitive file/API/token/Storybook/test pattern.
  - Verify action-vs-link semantics, focus, disabled/loading and long-label behavior.
  - Use this slice as the architectural pattern for subsequent primitives.

### Checkpoint C: Reusable architecture

- [ ] Shared PhotoSwipe behavior has one owner.
- [ ] One production primitive has completed the full code → Storybook → test → browser path.
- [ ] No Storybook-only APIs or duplicated runtime seams introduced.

### Phase 3: Parallel vertical slices

#### Gallery

- [ ] **#1109 — curate and ingest approved 2D / production / video / character-sheet media**
  - Register/fix canonical media first.
  - Publish only explicit approved selections.
  - Preserve authored copy/captions/credits.

- [ ] **#935 — continue validated 3D library generation** independently.

#### Design System

After #1113 establishes the shared pattern:

- [ ] **#1114 — Badge / Chip / Tag / Pill**
- [ ] **#1115 — Tabs**
- [ ] **#1116 — Divider**
- [ ] **#1117 — Tooltip**

These may run in parallel only when they do not compete for the same shared token/component files. Shared contract changes land first; component-local work follows.

### Checkpoint D: Feature-complete surfaces

- [ ] Gallery approved non-3D classes render through canonical typed media.
- [ ] All eight requested primitive names have either a canonical implementation or an explicit decision that the name is only a variant/token.
- [ ] Focused tests, typecheck and build are green.

### Phase 4: 3D integration + migration

- [ ] **#1110 — consume validated #935 outputs**
  - Add keyboard-equivalent interaction or deliberately non-interactive accessible fallback.
  - Measure multi-WebGL context/GPU behavior before increasing model count.
  - Reuse canonical model viewer and poster/fallback contracts.

- [ ] **#1118 — migrate production usages**
  - Replace safe one-off implementations incrementally.
  - Remove dead duplicate CSS/runtime only after callers migrate.
  - Reconcile Storybook/system inventory and #861.
  - Run HardenUI edge cases before final polish.

### Checkpoint E: Hardened implementation

- [ ] Keyboard/touch/high-contrast/reduced-motion behavior verified.
- [ ] 200% zoom, long RU/DE/CJK/RTL/emoji content and narrow mobile do not break layout.
- [ ] Missing/failed media states degrade safely.
- [ ] Listener/observer/WebGL resource cleanup verified.
- [ ] No unexpected console/page/network errors.

### Phase 5: Final audit, polish and release

- [ ] Re-run **UIAudit #1121** on the exact implementation head.
- [ ] Resolve remaining P0/P1 findings before release.
- [ ] Run bounded Polish: one desktop+mobile defect pass, one correction batch, one confirmation pass.
- [ ] **#1111 — Gallery interaction/a11y/release gate**
  - focused + Fast CI green;
  - private/browser review green;
  - exact candidate SHA reviewed;
  - narrow prod release;
  - production workflow verifies exact deployed SHA.


## Final Gallery UX Contract (GrillMe Q1–Q56)

The following owner decisions are binding for Gallery phase 2 implementation:

- Gallery is editorial, not catalog UI: explicit series order and explicit in-series order; no public filters/tabs.
- A Gallery series is a real editorial boundary. Its quiet marker shows the project name only, once at each series start; markers are not links. Viewer navigation never crosses a series boundary.
- Series may mix image, video, 3D and short document-like sequences when they form one visual narrative.
- A canonical Media Catalog asset appears at most once in the public Gallery. Gallery placement may add presentation metadata without changing canonical asset identity.
- Featured is an explicit placement property, never an algorithm or separate queue. Hard maximum: two featured placements per series. The first opens the series; an optional second may appear later. Featured spans two grid columns on desktop and mobile, preserves editorial order, and may own a Gallery-only crop/position. Viewer always shows the full canonical asset. Featured is visual hierarchy, not assistive-technology state.
- Grid cards have no permanent captions. Project markers provide orientation; authored title/credits live in the viewer. Interaction affordances may identify video/3D behavior.
- Video grid preview is muted on hover and keyboard focus, starts from zero, and fully stops/resets on leave/blur. Touch keeps poster + play affordance and opens viewer on first tap. Viewer video may autoplay muted after explicit opening; sound requires user action.
- 3D is preview-first in the grid. Full 3D interaction opens in the shared Gallery viewer shell, never autorotates, supports drag/pinch plus explicit rotate left/right, zoom +/- and reset controls, and has keyboard-equivalent operation.
- One viewer shell owns image/video/3D/document-like presentation; only media-specific controls vary. Loading uses stable poster/skeleton state with unavailable controls disabled. Media failure stays recoverable inside viewer; next/close remain available.
- Short multi-page visual works may appear as an editorial subset inside Gallery. Long/context-heavy/multi-section material belongs in a Case. Sequence navigation uses previous/next + current/total, swipe and keyboard, with no thumbnail strip.
- URL contract: `?item=<canonical-id>`; multi-page items may add `&slide=<n>`. Item changes replace the current viewer URL after the initial open; slide changes replace history rather than creating Back entries. Direct deep-link Back closes viewer to Gallery. Close restores scroll and focus to the originating card.
- Mobile and desktop share one editorial order. Layout changes only; consecutive featured items remain consecutive.
- Very long series are editorially reduced rather than hidden behind `Show more`.
- Empty Gallery uses a neutral authored empty state. Broken media preserves its placement with a neutral fallback and authored title; no technical error prose is exposed.
- A series with a fuller public Case may end with a quiet `View case / Смотреть кейс`; omit it when no Case exists. The final Gallery handoff is a quiet text-link block: Selected cases → CV → Contact.
- Visible editorial text is explicitly authored. Taxonomy/project metadata may structure the experience but must not synthesize user-facing copy.
- The final viewer item remains normal content followed by a quiet continuation/end-state. No auto-close and no loop.

These decisions refine #1108 and #1111 and override any older Gallery behavior that conflicts with them while preserving canonical Media Catalog identity, authored copy, and the narrow release contract.

## Verification Strategy

Use the cheapest sufficient repository-owned verification at each slice:

- focused permanent contract tests at public behavior seams;
- typecheck;
- production build;
- Storybook only for production-backed state evidence;
- browser verification for keyboard/focus, responsive behavior, overlays, video/model interaction and runtime errors;
- accessibility automation plus manual keyboard/focus checks;
- measured performance pass for expanded multi-WebGL Gallery only when 3D volume changes.

Any tests created during implementation must be classified KEEP / MOVE / DELETE under the repository testing policy before completion.

## Parallelization

Safe:
- #1107 and #1112 immediately.
- #935 alongside Gallery/Design System work.
- #1114/#1115/#1116/#1117 after #1113 establishes shared primitive conventions, if file ownership is disjoint.
- Gallery ingestion and component slices after their respective contracts settle.

Sequential:
- #1107 → #1108 → #1109.
- #935 + #1108 → #1110.
- #1112 → #1113 → remaining primitive slices → #1118.
- implementation → HardenUI → UIAudit rerun → Polish → #1111 release.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gallery becomes a second media database | High | Canonical Media Catalog IDs only; Media Desk/CMS remains authoring boundary |
| Non-photo support weakens photography rules | High | Separate typed eligibility contracts; preserve photo tests |
| Primitive names encode appearance instead of semantics | High | #1112 must settle roles before implementation |
| Shared CSS/token files cause parallel merge churn | Medium | Land Button/shared contract first; parallelize only component-local slices |
| PhotoSwipe fixes drift between adapters | High | Consolidate common ownership in #1108 before new media kinds |
| More 3D models exhaust GPU/WebGL resources | Medium | Measure before scaling; bounded mount strategy only if evidence requires |
| Accessibility is deferred to release | High | #1121 P1 remediation moved to Phase 0 |
| Polish becomes redesign | Medium | Preserve incumbent world; bounded one-pass + confirmation rule |

## Open Questions

None blocking. Current requirements are sufficient to start Phase 0 + Phase 1.

## Definition of Ready for Build

- GitHub issues #1105–#1121 remain the canonical task tracker.
- First executable work: **#1121 P1 remediation**, **#1107**, **#1112**.
- #1107 and #1112 can run concurrently.
- No production release until #1111 after the final UIAudit and Polish gates.
