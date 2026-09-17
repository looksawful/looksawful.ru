# Storybook canonical UI inventory audit

Audit target: `looksawful/looksawful.ru` branch `storybook/audit-inventory`, baseline `d2fa1a10cefda1be5d7f49e3adb1bfa334fb600c`.

Machine-readable companion: `docs/storybook/ui-inventory.snapshot.json`.

## Executive result

The current Storybook installation is a valid LAB component catalogue, but the current inventory is not yet a trustworthy coverage metric for the site.

There are four Storybook modules in `src/lab/stories/`:

- `foundations.stories.js`: canonical production-derived foundation coverage for colors, typography, sizing/spacing, radii, surfaces, gradients, motion/reduced-motion, and raw CSS custom-property inspection; values are read from the loaded canonical production stylesheet graph rather than copied into Storybook.
- `before-after.stories.js`: canonical UI coverage. It directly imports the production renderer `src/templates/before-after.ts`, runtime `src/components/before-after.ts`, and real Jestei data.
- `code-block.stories.js`: canonical UI coverage. It directly imports the production renderer `src/components/content/code-block.ts` and runtime `src/components/code-block.ts`.
- `model-viewer-controls.stories.js`: LAB experiment/prototype. It must not count as production UI coverage unless a production owner is explicitly linked later.

So the evidence-backed starting point is **two canonical UI story modules + one canonical foundation module + one experimental module**, not “four production components documented”.

The production UI denominator is materially wider than `src/components/**`. It spans `src/templates/**`, `src/components/**`, `src/site/renderers/**`, page/shell/navigation ownership, and route-specific specialized renderers. Any percentage that ignores those owners is misleading.

## Method

This audit uses source ownership and explicit relationships rather than filename similarity.

Evidence classes used in the snapshot:

- `direct-import`: a story or renderer imports the canonical source directly.
- `route-manifest`: page ownership comes from `src/site/pages/manifest.ts`.
- `source-inspection`: behavior/state comes from inspected implementation.
- `directory-contract`: a thin alias/re-export belongs to a canonical owner family already represented elsewhere.
- `needs-classification`: insufficient evidence for a CI-grade conclusion.

A source file is not automatically a “component”. Runtime enhancers, validators, analytics, metadata helpers, state models and type contracts are deliberately separated from visual owners.

## Existing inventory: what is correct

`tools/lab/design-system-inventory.mjs` is already the canonical inventory mechanism and should be evolved rather than replaced.

Useful existing behavior:

- recursively scans `src/components`, `src/styles`, `src/templates`, `src/lab/stories`;
- excludes `.d.ts` from runtime-source counting;
- emits `dist/lab/system-inventory.json`;
- emits `dist/lab/system/inventory.html`;
- keeps the generated inventory linked to Storybook.

## Existing inventory: correctness gaps

The current implementation cannot support a truthful site-wide Storybook coverage number yet.

1. **`src/site/**` is absent from the denominator.**
   Real page/composition owners live under `src/site/renderers/**`, `src/site/shell/**`, and route/page modules. Home alone has `home-page.ts`, `home-slots.ts`, image deferral and media deferral ownership. Entity pages have `entity-page.ts`, `entity-shell.ts`, `section.ts` and `content-block.ts`.

2. **Coverage association is basename-only.**
   `storiesByStem` compares the story filename stem to each source basename. This can false-positive when two directories contain the same basename and false-negative when a story covers several production sources.

3. **Templates are listed but not coverage-evaluated.**
   The current JSON knows that templates exist, but it only computes `documented` for entries called components.

4. **Storybook and inventory accept different extensions.**
   Storybook accepts `*.stories.js` and `*.stories.mjs`; inventory recognizes only `.stories.ts` and `.stories.js`. A valid `.stories.mjs` can therefore disappear from coverage reporting.

5. **Multi-source canonical stories are underrepresented.**
   `before-after.stories.js` covers renderer + runtime + data; `code-block.stories.js` covers renderer + runtime. Filename stems cannot model this ownership accurately.

6. **Experimental stories are not separated from canonical evidence.**
   A self-contained LAB prototype can raise a naive story count while documenting no production owner.

7. **No explicit story policy exists.**
   Infrastructure and behavior-only modules should not be forced into isolated visual stories just to improve a percentage.

The required policies for later inventory v2 are: `isolated`, `composition`, `page`, `behavior-fixture`, `experimental`, and explicit `no-story`/exempt classification.

## Canonical owner map

The full per-owner structure is in `ui-inventory.snapshot.json`. The important families are below.

### Foundation

Canonical design tokens are represented by `foundations.stories.js`. This is useful foundation coverage but must stay separate from component coverage.

### Templates and canonical visual renderers

The canonical template directory contains 16 runtime template files:

- animated canvas gallery
- before/after
- client logo
- Jestei theme organism
- justified gallery
- media figure
- media group
- media slider
- mockup deck
- mockup
- page flip
- project card
- project intro
- responsive image
- section intro
- subproject card

Thin files in `src/components/content/**`, `src/components/composition/**`, and `src/components/specialized/**` frequently represent aliases/facades around these canonical owners. They must be linked to the owner, not blindly counted as extra independent visual components.

Current canonical Storybook coverage in this family:

- Before After: **covered**.
- Code Block: **covered**, although its renderer owner is under `src/components/content` rather than `src/templates`.
- All other audited template/composition owners: **missing or not yet explicitly classified**.

### Interactive runtime owners

Important behavior owners without canonical Storybook fixtures include:

- `berserk-audio-player.ts`
- `embla-deck.ts`
- `experience.ts`
- `expertise.ts`
- `infinite-reel.ts`
- `media-deck.ts`
- `media-lightbox.ts` + `photoswipe-lightbox.ts`
- `page-flip.ts`
- `project-navigation.ts`
- `site-navigation.ts`

These should not all be treated the same. Some require an isolated story; others need a production renderer plus a behavior fixture.

`media-lightbox.ts` is a clear example of stateful coverage that filename counting misses. Its implementation defines lightbox source selection, exclusions, interactive-element exclusions, active media/caption resolution, and PhotoSwipe item construction. Its meaningful Storybook axes are overlay open/closed, keyboard/interaction, media type and caption state, not simply “file has a story”.

### Gallery ownership

`src/components/gallery/` contains four distinct collaborating modules:

- `gallery-controller.ts`
- `gallery-entry.ts`
- `gallery-lightbox.ts`
- `gallery-state.ts`

This is one behavior/composition family, not four isolated visual atoms. The useful coverage target is a gallery fixture that exercises selection/state/lightbox behavior with canonical page/rendering code.

### Specialized owners

The audit identifies three high-value specialized owners:

- Awful Cases game: production runtime/facade tied to `project:awful-cases`.
- Jestei track filter: large canonical specialized renderer tied to `case:jestei-pool`.
- Moves canvas demo: specialized interactive renderer tied to `project:moves-awful`.

These deserve explicit classification because they are both visually significant and interaction-heavy. None currently has canonical Storybook coverage.

### Site/page owners

`src/site/**` is a first-class part of the UI denominator.

Page archetypes identified:

- **Home**: `src/site/pages/homepage.ts` + `src/site/renderers/home/home-page.ts` + slots/deferral modules.
- **Entity**: `src/site/pages/entity-presentation.ts` + `src/site/renderers/entity-page.ts` + entity shell/section/content-block modules.
- **Gallery**: `src/site/renderers/gallery-page.ts` plus gallery runtime family.
- **CV**: route/build owner plus `src/site/renderers/cv-page.ts` and static source.
- **Not Found**: `src/site/renderers/not-found-page.ts`.
- **Page shell/navigation**: `src/site/shell/page-shell.ts` and `src/site/shell/navigation.ts`.

These should eventually be represented as page/composition stories where isolation is useful, while `/lab/` remains the source of truth for complete real-route rendering.

The two surfaces are complementary:

- `/lab/`: real route/page workbench.
- `/lab/system/`: isolated Storybook catalogue of components, states, compositions and page archetypes.

Storybook must not replace the real-route workbench.

## Route truth and hidden routes

The canonical manifest contains 12 enabled routes.

Listed/indexable routes:

- `/`
- `/gallery/`
- `/work/jestei-pool/`
- `/work/styx/`
- `/work/sensetique/`
- `/shootings/`
- `/cv/`
- `/privacy/`

Enabled but intentionally discovery-hidden routes:

- `/work/awful-cases/`
- `/work/moves-awful/`
- `/work/berry-social-content-2020/`
- `/404.html`

`listed:false` and `indexable:false` are **route discovery / SEO properties**. They are not evidence that a component is visually hidden. Inventory v2 must keep this dimension separate from CSS/DOM visibility.

## Visibility and state taxonomy

The audit found enough architectural evidence to require at least these independent dimensions:

- `always`
- breakpoint-responsive visibility
- conditional/data-driven rendering
- disclosure `open` / `closed`
- overlay `open` / `closed`
- route discovery `listed` / `indexable`
- feature/experimental visibility
- offscreen/deferred/virtualized state
- reduced-motion behavior
- disabled state

Interaction state should be independent from visibility:

- default
- hover
- focus-visible
- active/pressed
- selected
- disabled
- open/closed

Async/data state should also be independent where a component actually has those contracts:

- loading
- ready
- empty
- error/unavailable
- partial

Do not manufacture states for components that do not have them. The state matrix should be evidence-backed per owner.

## Responsive and motion evidence

The entity section renderer already demonstrates why this needs explicit modeling. It owns multiple presentation layouts:

- `stack`
- `split-always`
- `media-stack`
- `mockup-grid-reel`
- `infinite-media-reel`

It also distinguishes globally managed reveal motion from `section-owned` motion. Responsive layout and motion ownership therefore cannot be inferred from a generic viewport screenshot alone.

Home rendering also separates deferred image/media behavior into dedicated owners. That belongs to async/offscreen coverage, not merely “mobile vs desktop”.

## Sources deliberately outside the visual denominator

The snapshot records non-visual or not-yet-isolated sources separately rather than pretending they are undocumented components.

High-confidence infrastructure examples:

- `src/components/media-runtime-health.ts`
- `src/components/motion-preference.ts`
- `src/components/site-analytics.ts`
- `src/site/rendering/html.ts`
- `src/site/shell/metadata.ts`
- page validation/type modules

`site-analytics-consent.ts` is intentionally left outside the design-system denominator until its visual consent UI ownership is separated from analytics behavior. Counting it as a simple component today would blur an important boundary and could accidentally encourage production analytics behavior inside LAB.

## Coverage assessment

Current state:

| Coverage area | Assessment |
| --- | --- |
| Foundation tokens | covered baseline |
| Canonical isolated UI | very early, 2 proven modules |
| Runtime interaction | mostly missing |
| Templates/compositions | mostly missing |
| Page archetypes | missing |
| Responsive states | not systematically modeled |
| Hidden/conditional states | not systematically modeled |
| Overlay/disclosure states | not systematically modeled |
| Async/deferred states | not systematically modeled |
| Motion/reduced-motion | partial, ad hoc |
| Accessibility metadata | present on some existing stories, not broad coverage |

This is not a failure state. It is the correct pre-migration baseline. The mistake would be turning the current basename counter into a CI gate and then optimizing the number.

## Handoff requirements for the other Storybook tracks

### State model track

Use the owner IDs and state axes in the snapshot. Formalize a machine-readable `parameters.looksawful` schema. Prefer `layer` for Storybook hierarchy and keep source implementation type separate as `sourceKind`/`kind`.

### Harness track

Validate production-like generic context without pulling the full production multi-page Vite pipeline into Storybook. Audit the global import of `model-viewer-controls-prototype.css` because experimental CSS should not silently contaminate canonical stories.

### Pilot stories track

Select 3–5 owners across different architectural classes. Avoid five easy static cards. A good pilot set should collectively prove static rendering, runtime enhancement, responsive behavior, and an overlay/disclosure/conditional state.

### Inventory/CI track

Evolve `tools/lab/design-system-inventory.mjs`. Do not create a parallel inventory system.

Required structural fixes:

1. scan UI-producing `src/site/**` ownership;
2. recognize the same story extensions as Storybook;
3. support explicit multi-source story metadata;
4. distinguish canonical/experimental/infra/no-story;
5. model template and page/composition coverage;
6. use explicit story source declarations as strongest evidence;
7. use import relationships as secondary evidence;
8. keep basename matching only as weak fallback;
9. fail CI only on structural invalidity first, not on historical missing coverage.

Recommended first structural CI errors:

- invalid metadata schema;
- duplicate stable owner IDs;
- declared source path does not exist;
- unknown enum/policy;
- broken route-manifest extraction.

Historical missing coverage should remain report-only until the denominator is trustworthy and the backfill is substantially complete.

## Verification record

Verified directly against branch source:

- component directory and nested composition/content/gallery/specialized/runtime ownership;
- full template directory ownership;
- `src/site` navigation/pages/renderers/rendering/shell structure;
- canonical page manifest and all 12 enabled route definitions;
- all four current story modules;
- direct imports for Before After and Code Block stories;
- current `tools/lab/design-system-inventory.mjs` matching logic and scan roots;
- entity section presentation/motion behavior;
- media lightbox source/exclusion/caption behavior.

No production UI, Storybook config, build infrastructure, runtime code or existing stories were modified by this audit.

The audit artifact itself is intentionally separate from generated `dist/lab/system-inventory.json`; it records the corrected denominator and evidence model that Track E should implement in the existing generator.
