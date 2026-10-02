# Current PROD UI system research — 2026-10-02

Status: evidence report / no implementation  
Research base: `prod@3e6f60c1d2890ea72c39c61b7790da0415030fa0`  
Purpose: verify the current UI-system priorities against production source, current trackers, previous sprints, historical audits and library artifacts.

## Research question

What actually describes the current looksawful.ru UI, which previous audit conclusions remain useful, and which audit work is worth doing now if the goal is UI consistency and reusable production components rather than another general web-quality audit?

## Source precedence for this research

1. Current deployed/production behavior and current `prod` source.
2. Current owner decisions and active implementation trackers.
3. Current GitHub issues that own existing work.
4. Recent completed sprint evidence.
5. Historical audits/prototypes/library artifacts.
6. `dev` and open WIP branches as future/supporting evidence only.

This ordering matters because `prod` and `dev` are currently diverged rather than one being a simple continuation of the other.

Current heads at research time:

- `prod`: `3e6f60c1d2890ea72c39c61b7790da0415030fa0`
- `dev`: `a9170b6d3fd5e6095e71f39f9184793aaf772de3`
- GitHub compare reports `dev` 168 commits ahead and 34 behind `prod` from their current merge base.

Therefore a document or audit based only on current `dev` cannot be treated as a description of the UI that users see today.

## Executive conclusion

The current audit program is over-broad for the actual problem.

The evidence supports a much narrower center of gravity:

1. **Reusable production UI is the main audit.**
   Buttons, button-like links, compact text actions, chips, badges/labels, tabs/selectors, icon controls, counters, control bars and small panels are distributed across local owners. The problem is not lack of UI, but inconsistent ownership and reuse.

2. **Typography is an active unfinished system migration.**
   The historical typography audit remains useful conceptually, but its concrete Rubik-era map is stale. Current production uses Inter globally and already has newer `fs/lh/ls` tokens. The next typography pass should reconcile current production roles, not restart the August proposal.

3. **Gallery layout is a separate product/design problem.**
   Current production is not true masonry. Each `seriesId` is rendered as an independent fixed-column CSS grid. Short series naturally leave large empty regions and one-item series occupy one isolated grid cell.

4. **The production 3D viewer is a separate organism/product problem.**
   Production already has a capable Three.js runtime, but the Gallery presentation disables autorotation, has no fullscreen control, intentionally hides/defer public controls, and presents models as square Gallery cards. A large control prototype already exists in Storybook, so the task is to distill a useful production viewer, not invent a control universe from zero.

5. **Storybook is a preview/human-gate surface today.**
   It is useful for isolated comparison of components/states that are awkward to review on the live/local page. Existing issues contain a broader future ambition around Storybook parity and architectural coverage; that ambition should not be confused with its current operational role or with production source of truth.

6. **Do not restart broad audits without a current defect signal.**
   Navigation architecture, page anatomy, global layout/spacing, general responsive behavior, contrast and generic media behavior do not currently justify separate audit phases. Check them locally when a touched component creates a relevant risk.

## Point-by-point verification

### 1. The audit must start from PROD, not DEV

**Verdict: CONFIRMED.**

Evidence:

- Current `prod` and `dev` are diverged.
- The live/public site is the rendered product.
- Private Visual Review tracker explicitly states that production remains the only public rendered surface.
- Engineering tracker already warns that historical Storybook inventory is not live coverage authority.

Research rule:

> Observe/compare the production component first. Use `dev` and WIP branches only to understand pending changes or possible future solutions.

The previous comprehensive-audit task “Reconcile existing audit evidence against current dev” is therefore the wrong baseline for the present UI-consistency audit.

### 2. Storybook is preview + human gate, not current architectural source of truth

**Verdict: CONFIRMED, with documentation drift.**

Current production already contains many Storybook previews:

- site navigation;
- project navigation;
- media deck;
- media lightbox;
- page flip;
- Gallery full content;
- model viewer controls;
- layout patterns;
- project cards;
- resource links;
- animated canvas gallery;
- foundations and other surfaces.

This is useful review infrastructure.

However, #861 and #929 use stronger language around canonical Storybook coverage, parity and inventory. That represents an architectural direction/aspiration, not evidence that Storybook currently owns product architecture.

Current operational contract for this work:

- production/browser = UI truth;
- source component = implementation owner;
- Storybook = convenient isolated preview / human approval surface;
- Storybook metadata/inventory = supporting development information;
- future agent architectural SoT = explicitly future work, not assumed now.

Do not manufacture Storybook states that do not exist in production. #929 itself already contains this guardrail.

### 3. Separate Design System / System Quality / Accessibility / Contrast audits are organizational duplication

**Verdict: CONFIRMED for the current objective.**

The current Asana “Comprehensive UI / UX / Design System Audit” has separate sections for:

- UX/IA;
- visual/editorial;
- tokens/foundations;
- design-system components;
- responsive;
- accessibility;
- media/3D;
- performance;
- Storybook parity;
- synthesis.

That structure was useful as a maximal quality program, but it is not aligned to the current UI-consistency problem. It creates several audit owners for the same concrete button/card/control.

For example a single compact action can simultaneously appear in token, component, accessibility, responsive and Storybook workstreams. That multiplies tracking without multiplying product understanding.

Current strategy should organize work around the **production UI entity**, then check only the relevant aspects of that entity while it is under review.

### 4. Contrast should not be a new audit phase

**Verdict: REMOVE FROM CURRENT AUDIT SCOPE unless a changed component introduces new color risk.**

Historical evidence shows color/contrast was already deeply investigated. The library contains a dedicated color-system prototype/audit with pair checks, contrast simulations and a complete source-color map.

That historical work also contained contrast warnings for some expressive pairs, so it would be inaccurate to claim that every historical pair was universally suitable for body/UI text. The important current conclusion is different:

- there is no current tracker evidence that contrast is the UI-system blocker being solved now;
- current production has changed materially since the older audit;
- repeating a site-wide contrast audit would not advance the present consistency/reuse problem;
- when a component's colors or states change, verify that component locally.

The broad WCAG task in the new comprehensive-audit project should not drive this UI consistency pass.

### 5. Global navigation / UX architecture is not the present audit target

**Verdict: DE-PRIORITIZE.**

The current production navigation is already a mature implementation with:

- breadcrumbs/current context;
- full-screen menu;
- pointer-capability behavior;
- mobile/short-height handling;
- existing keyboard/focus behavior;
- responsive target sizing.

The Portfolio UX/IA tracker still contains implementation/rollout work, but there is no evidence that the basic site-navigation architecture must be redesigned before reusable UI work.

Navigation controls remain relevant only as **examples in the control-consistency inventory**.

### 6. Page anatomy/hierarchy is not a useful current phase

**Verdict: DE-PRIORITIZE.**

No current evidence found that page anatomy is blocking the desired UI-system cleanup.

Old hierarchy work and portfolio architecture remain supporting context. If the control inventory exposes duplicated headers/actions with the same role, those specific duplicates can be handled there. No standalone page-anatomy audit is justified now.

### 7. Global layout / grid / spacing / responsive debugging is not the present task

**Verdict: DE-PRIORITIZE; previous regression evidence is closed.**

The important prior mobile regression was explicitly tracked and completed:

- one-column narrow main restored;
- intended horizontal-scroll rails restored;
- desktop regression and page overflow were acceptance criteria.

Current production postdates that completion.

This does not prove that no layout defect can ever exist. It does mean there is no evidence-driven reason to reopen a global layout/responsive audit now.

Rule:

> Responsive/layout verification follows the component being changed. It is not its own current audit program.

### 8. Typography is genuinely unfinished and worth revisiting

**Verdict: ACTIVE PRIORITY.**

Historical evidence:

- August typography audit found a visible hierarchy but no formal semantic role system;
- many local scales and independent UI text treatments;
- UI compact text (buttons, labels, metadata, captions) was already identified as its own problem area;
- a role-oriented Display / Content / Interface proposal was built;
- a separate typography workbench/prototype exists.

But the exact historical audit is stale:

- August audit: primary family = Rubik Variable.
- Current production: `src/styles/index.css` imports `@fontsource-variable/inter/wght.css`.
- Current `tokens.css`: `--ff-primary: "Inter Variable" ...`.
- Current production already has `--fs-200…900`, `--lh-*`, and `--ls-*` families.
- `index.css` contains “Typography-only refinements”, showing that migration/refinement already happened partially.

Therefore the next typography work is **reconciliation of the current Inter-era production system**, not re-running or blindly implementing the Rubik-era proposal.

Highest-value typography scope:

- UI/control text;
- labels/status/counters;
- metadata/captions;
- button/action text;
- current heading role aliases where they still drift;
- line-height/weight/tracking consistency where it affects component consistency.

### 9. Reusable UI surfaces are the actual main audit

**Verdict: STRONGLY CONFIRMED.**

Current tracker evidence:

- Asana task “UI molecules — часть looksawful.ru Portfolio UX/IA” explicitly owns:
  buttons, badges, chips, tags, tabs, pills-as-shape, dividers, tooltips and other reusable UI patterns.
- GitHub #1106 explicitly exists because reusable primitives are scattered one-off implementations.
- GitHub #1112 explicitly owns the inventory and semantic taxonomy before shared implementation.

Current production source confirms the smell:

- global focus baseline exists;
- site navigation overrides focus locally;
- Contact Hub has its own coherent local action/field/control grammar;
- Code Copy is another independent tiny text-action grammar;
- media/page controls have their own local control sizes and state styling;
- tokens already contain a small `--control-*` family, but it is not a site-wide canonical owner.

This is exactly a **reuse/consistency problem**, not evidence that the site lacks design language.

The design objective is:

> preserve authored/editorial variation; remove accidental implementation drift.

### 10. The design system should emerge from accepted production work

**Verdict: CONFIRMED as the appropriate operating model.**

Existing #1106 is useful as an owner/index of potential shared patterns, but its “implement all eight primitives” sequence should not be treated as a mandate to build an abstract library first.

Recommended rule:

1. find repeated production role/use;
2. compare real variants;
3. decide what is taste vs drift;
4. improve the production component/pattern;
5. use Storybook for an isolated human gate if useful;
6. after acceptance, reuse the production implementation;
7. document the accepted reusable contract.

Do not create `Tag`, `Pill`, `Tooltip`, etc. merely to complete a taxonomy. #1112 already supports this, especially its “Pill may only be a shape/style token” decision.

### 11. Generic media surfaces are not the current problem

**Verdict: DE-PRIORITIZE except Gallery and 3D.**

There is already substantial production ownership around:

- media figures/groups;
- lightbox;
- media deck;
- sliders;
- page flip;
- captions;
- responsive media;
- typed media catalog.

No evidence was found that these need to be reopened as one generic “media audit” before UI controls work.

Two exceptions are materially different and should remain independent focused design problems: Gallery composition and 3D viewer.

## Focused product problem A: Gallery composition

**Verdict: SOURCE-CONFIRMED current problem.**

Current production does not implement a masonry layout.

`src/site/renderers/gallery-page.ts`:

- groups items by `seriesId`;
- renders every group as its own `.gallery-series`;
- gives every series an independent `.gallery-series__grid`.

`src/styles/gallery.css`:

- 5 equal columns by default;
- 4 below 1500px;
- 3 below 1050px;
- 2 below 720px;
- no masonry packing.

`src/data/media/gallery.ts`:

- photo `seriesId` usually comes from the first project ID;
- 3D models are explicitly split into `jestei-3d-symbols` and `awful-3d-mockups`;
- the current Awful 3D Mockups Gallery series contains a single iPhone item.

Consequences are deterministic:

- a 1-item series occupies one cell and leaves the other columns empty;
- short series produce unused grid columns;
- visual packing is dominated by series boundaries rather than overall editorial composition;
- item size is effectively the width of one equal grid column, regardless of whether the item deserves more visual weight.

This directly explains the reported “huge empty spaces”, isolated images and unclear sizing.

Existing #1105/#1108 focus mainly on multi-format curation/contracts. They are useful owners for media identity but do **not** solve the current composition problem by themselves.

Needed follow-up is a focused design-in-browser Gallery layout task, not another generic media audit.

## Focused product problem B: 3D Viewer / GLB Canvas organism

**Verdict: SOURCE-CONFIRMED current problem, with useful implementation already present.**

Current production runtime already has:

- Three.js renderer;
- GLTF + Meshopt loading/fallback;
- OrbitControls;
- manual rotate/orbit;
- zoom;
- fit-to-bounds initial camera calculation;
- poster fallback;
- `loading / ready / error` internal data states;
- lazy mounting through IntersectionObserver;
- optional auto rotation;
- iPhone presentation hooks;
- teardown/disposal.

But current Gallery presentation deliberately limits it:

- Gallery passes `data-model-autorotate="false"`, disabling the runtime autorotation capability.
- Model cards use `aspect-ratio: 1` inside the same ordinary Gallery grid.
- There is no production fullscreen action.
- There is no production toolbar/button/icon system.
- Screen-state controls are not mounted by the Gallery.
- Production runtime comments explicitly say public controls are deferred until design-system alignment.
- The production release that introduced the corrected iPhone explicitly hid public screen controls pending design alignment.
- #1243 is the active deferred issue for aligning 3D viewer controls with the site.

Storybook already contains a much larger model-viewer control prototype with:

- autorotate;
- render mode;
- camera presets;
- fit model;
- fullscreen;
- reset view;
- orbit/zoom/pan;
- projection/FOV;
- backgrounds;
- lighting/environment;
- animation;
- model/material/debug controls.

It even defines a compact `portfolio` preset:
`autorotate + render-mode + camera-presets + fit-model + fullscreen`.

Therefore the next step is **not** to implement the full prototype.

The evidence-backed problem is to design the smallest good portfolio viewer that actually presents the model well. Likely candidate capabilities to investigate first:

- larger/appropriate presentation surface;
- deliberate initial framing;
- useful loading/preload feedback;
- autorotate on/off;
- fit/reset view;
- fullscreen;
- clear icon/button controls;
- visible interaction/state indication;
- screen-state selection where the model supports it;
- orbit/zoom retained;
- sensible touch behavior;
- error/poster fallback.

Advanced lighting/debug/material controls remain prototype/reference material unless a real portfolio use case requires them.

## Current status of Storybook-related historical work

Useful:
- existing isolated previews;
- model viewer control exploration;
- visual human gates;
- production-backed examples where already maintained.

Supporting, not authority:
- coverage percentages;
- “every production surface must have a Storybook owner” ambitions;
- historical Storybook inventory snapshots;
- Storybook as route/page architecture map.

Explicit current tracker evidence already says the historical Storybook inventory is not live coverage authority.

## What is stale or should be demoted

### Comprehensive UI / UX / Design System Audit project

The current Asana project is useful as a historical inventory of possible quality concerns, but its decomposition is too broad for the now-defined objective.

Demote as current phases:
- UX/IA journey audit;
- full visual hierarchy/spacing/density audit;
- standalone tokens/foundations audit;
- standalone responsive matrix;
- standalone accessibility audit;
- standalone performance baseline;
- Storybook parity as an audit objective;
- generic media audit;
- large “system quality” synthesis.

Do not delete the evidence. Reclassify/retain it as reference or future quality work.

### `docs/research/2026-09-30-ui-surface-inventory.md`

Useful supporting inventory, but built against `dev` and therefore not production truth for the present audit.

### August design-system audit spreadsheet

Useful historical map; current production architecture and typography have changed materially.

### August typography audit

Conceptually useful; concrete font/source/value map is stale and must be reconciled with current Inter-era production.

### July remaining-refactor master plan

Historical architecture/cleanup plan. It contains useful examples of intended role consolidation but should not drive present UI work.

### Storybook inventory audit

Historical evidence/reference only. Existing tracker explicitly says it is not live coverage authority.

## Recommended current UI research/audit hierarchy

This is intentionally organized by product entities, not by QA disciplines.

### Stage 1 — Production reusable UI inventory

Inventory real current PROD call sites for:

- buttons/actions;
- button-like links;
- compact text actions;
- chips/selectors;
- badges/status labels;
- tabs/segmented controls;
- icon buttons;
- counters;
- media/navigation controls;
- small control bars;
- compact panels;
- relevant control text roles.

For each:
- semantic/user role;
- production locations;
- visual variants;
- size/padding;
- typography;
- states;
- actual duplicate implementations;
- intentional editorial exception vs accidental drift.

This is the main audit.

### Stage 2 — Control-family consolidation, one family at a time

Suggested order:

1. buttons + action links;
2. compact text/icon actions;
3. chips / badges / labels;
4. tabs / selectors / segmented controls;
5. counters / playback/navigation controls;
6. control bars / compact panels.

For each family:

`PROD observation → compare variants → design in browser → production candidate → Storybook human preview if useful → owner approval → reuse/document`.

No requirement to create every theoretically named primitive.

### Stage 3 — Typography reconciliation

Re-audit current PROD typography against the partially landed Inter-era system.

Do not restart the full old audit.

Prioritize:
- Interface typography;
- control labels;
- metadata/captions;
- status/counters;
- action text;
- current heading aliases only where they create real inconsistency.

Output should be the smallest current role set that explains actual production use.

### Stage 4 — Gallery composition redesign

Treat Gallery layout/packing as a separate design problem.

Investigate actual item/series distribution and compare a small number of composition strategies in-browser. The criterion is editorial rhythm and useful visual weighting, not simply “CSS masonry exists”.

Keep Media Catalog identity/curation ownership intact.

### Stage 5 — 3D Viewer redesign

Treat the viewer as its own organism.

Start from current production runtime and the existing Storybook prototype. Reduce the prototype to the smallest valuable portfolio controls instead of promoting all prototype settings.

The production viewer is accepted first; its reusable contract is documented afterwards.

## Vertical rules across all stages

### Storybook

Use only where isolated preview materially helps a human decision.

Do not create a story merely to satisfy coverage.

### Responsive

Check affected states while changing a component. Do not reopen a standalone site-wide responsive audit without a production regression.

### Accessibility

Maintain basic semantics/keyboard behavior of touched interactive controls. Do not create a parallel accessibility program for this UI-consistency sprint.

### Contrast

Check when colors/states change. Do not repeat a site-wide contrast audit by default.

### Design system

The design system is a record of accepted reusable production patterns.

It is **output**, not prerequisite architecture.

## Practical canonical loop

```
CURRENT PROD
   ↓
find repeated UI / real problem
   ↓
compare production variants + historical evidence
   ↓
design/fix in browser
   ↓
Storybook preview only when useful for human gate
   ↓
human approval
   ↓
reuse production implementation
   ↓
record the accepted pattern as system
```

## Sources used

### Current GitHub production source

- https://github.com/looksawful/looksawful.ru/tree/prod
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/tokens.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/index.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/base.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/site-navigation.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/contact-form-hub.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/code-block.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/styles/gallery.css
- https://github.com/looksawful/looksawful.ru/blob/prod/src/site/renderers/gallery-page.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/media/gallery.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/components/model-viewer.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/lab/stories/model-viewer-controls.stories.mjs

### Current owners/issues

- #245 responsive/accessibility baseline
- #861 system audit / Storybook-CMS-media parity
- #929 Storybook useful/states coverage
- #1105 Gallery Phase 2
- #1106 production UI primitives
- #1108 Gallery typed multi-format contract
- #1111 Gallery release gate
- #1112 primitive usage inventory/taxonomy
- #1243 deferred 3D viewer controls alignment

### Asana evidence

- looksawful.ru — Portfolio UX/IA
- Sprint 1 — Proof Readiness & First Ship — 25 Sep–1 Oct
- looksawful.ru — программа сайта и портфолио
- looksawful.ru — Comprehensive UI / UX / Design System Audit
- looksawful.ru — Private Visual Review
- AWFUL STUDIO — 3D Production & Debug Pass
- Engineering Active Frontier — looksawful ecosystem

Key current/closed items include:
- UI molecules implementation coordination;
- completed mobile one-column + horizontal rails regression;
- current Gallery curation/lightbox tasks;
- current 3D post-publish iPhone quality task;
- historical Storybook inventory explicitly marked not live coverage authority.

### Library/historical evidence

- `looksawful-design-system-audit.xlsx` — 2026-08-04 PROD snapshot.
- `looksawful-typography-audit.md` — 2026-08-09 PROD typography audit.
- `looksawful-typography-system.html` — typography workbench/prototype.
- `looksawful-design-system-prototype.html` — control/chip/badge/tab prototype.
- `looksawful-media-system-prototype.html` — media/Gallery/viewer prototype.
- `looksawful-color-system-prototype-v2.html` — historical color/contrast audit/prototype.
- `looksawful_remaining_refactor_full_plan.md` — 2026-07-02 historical refactor plan.

No additional relevant ArtifactBridge document was found in the current search.

## Research status

**COMPLETE for audit re-scoping.**

The evidence is sufficient to stop treating the broad comprehensive audit decomposition as the current execution plan and to reframe the UI effort around current production reusable surfaces, current typography, Gallery composition and the 3D viewer.

No implementation changes were made in this research branch.
