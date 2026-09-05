# Page & Template Architecture Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` and execute this plan sequentially with review checkpoints. The user explicitly chose single-agent inline execution; do not parallelize edits across overlapping page/template files.

**Goal:** Close the concrete page/template architecture problems confirmed in the 2026-09-05 current-code review while preserving authored copy, visual design, routes, media semantics and runtime behavior.

**Architecture:** Keep the existing canonical `SitePage -> EntityPageContent -> Section -> ContentBlock -> renderer` model. Finish the migration around it rather than redesigning it: make Homepage a first-class renderer, make `src/components/*` own real implementations, simplify Section rendering, fail closed across page/content/presentation registries, isolate build orchestration, and move authored text to existing editorial owners without changing the words.

**Tech Stack:** Vite 8, TypeScript 7 strict, vanilla TS/JS, GSAP, Three.js, Node 24 test runner, Playwright/browser smoke, GitHub Pages, Pages CMS.

**Baseline:** `dev` SHA `63a5c07a4805e8c1d3ba8fb1250deb106cf218ef` at planning time. Later execution must rebase/re-read current `dev` before touching code and must not assume this SHA is still HEAD.

**Issues:** umbrella #256; implementation #251, #252, #253, #254, #255; engineering roadmap #223.

**Spec / authority:** `docs/cms-architecture.md`, current `src/site/pages/**`, `src/content/contracts/**`, `src/content/pages/**`, current rendering code, Notion Project 01 / Architecture Control Center. Current repository code overrides stale historical migration notes.

## Global Constraints

- Do not change authored wording, letters, punctuation or meaning unless issue #255 moves the exact existing value to its correct owner.
- Do not redesign visual output.
- Do not change route paths, canonical URLs, indexability intent or page identity.
- Do not change media identity, media source paths, derivative policy or caption semantics as incidental cleanup.
- Do not change motion/interaction/runtime behavior.
- Preserve current stable DOM/runtime hooks: article IDs, required `data-*` attributes, selectors and specialized component hooks unless a focused regression contract proves an internal-only change is safe.
- Home embeds canonical Entity content with `h2`; standalone Entity pages use `h1`.
- `SitePage` owns route/build/discovery identity.
- `EntityPageContent` owns canonical Entity composition.
- `Section` / `ContentBlock` remain closed typed unions. Do not add unrestricted `{ type: "custom", renderer: string }` escape hatches.
- CMS edits authored data only. Architecture, routes and generic presentation behavior stay code-owned.
- Every compatibility deletion requires two proofs: repository reference scan and targeted regression coverage.
- Do not expand normal Fast CI with heavyweight checks. Use targeted local/manual/full verification only at checkpoints.
- Small commits. One logical invariant per commit where practical.

---

## Target end state

```text
SitePage manifest
  -> page-specific renderer
     -> Home renderer OR Entity renderer OR static/system renderer
        -> canonical composition contracts
           -> canonical components
              -> runtime/CSS
```

For Entity pages:

```text
SitePage
  -> EntityPageContent
     -> Section[]
        -> ContentBlock[]
           -> src/components/* implementation
```

For Homepage:

```text
Home SitePage
  -> explicit Home composition
     -> Home-only sections/components
     -> shared EntityPageContent for Jestei/Styx/Sensetique/Shootings
     -> PageShell
```

No active architecture should require:

```text
index.html marker slots
-> home-slots.ts replacement
-> extract old article
-> replace with canonical article
-> regex-patch navigation/metadata/snippet wrappers
```

No canonical component should be implemented as:

```text
src/components/foo.ts
  -> export * from ../../templates/foo.ts
```

The temporary compatibility direction, while needed, is the reverse:

```text
src/templates/foo.ts
  -> export * from ../components/foo.ts
```

and the shim is deleted after zero-consumer proof.

---

# Phase 0 — Re-read baseline and establish safety contracts

## Task 0.1: Rebind execution to current `dev`

**Files:** none.

**Interfaces:**
- Consumes: current protected `dev`.
- Produces: exact execution SHA recorded in issue #256 / work log.

- [ ] Fetch current `dev` and compare with this plan baseline.
- [ ] Review open PRs/issues touching `index.html`, `src/site/renderers/home/**`, `src/templates/**`, `src/components/**`, `src/site/renderers/entity/**`, `src/site/pages/**`.
- [ ] If unrelated active work changes those files, integrate/rebase before implementation rather than overwriting it.
- [ ] Record the exact starting SHA in #256.

## Task 0.2: Characterize current page output before refactor

**Files:**
- Modify: `test/site-composition.test.mjs`
- Potential focused tests: existing navigation/metadata/project-page test files only when current coverage is missing.

**Interfaces:**
- Consumes: current renderers.
- Produces: stable characterization tests used by #251–#254.

- [ ] Add a focused contract for every current Home canonical Entity article: order, article ID, `data-theme`, navigation attribute and H2.
- [ ] Add standalone contracts for Jestei, Styx, Sensetique, Shootings, Awful Cases, Moves Awful and Berry: H1, correct article ID and absence of unrelated Entity articles.
- [ ] Add current navigation/metadata contracts needed to safely remove Homepage regex reconstruction.
- [ ] Add a contract identifying currently required Home build markers before migration so the next RED test can prove their retirement intentionally.
- [ ] Run `node --test test/site-composition.test.mjs` and confirm the characterization suite is GREEN before architecture edits.
- [ ] Run `npm run typecheck`.
- [ ] Commit characterization-only changes.

**Stop condition:** if characterization reveals output differences between the supposed canonical Entity renderer and actual production-intended Home output that are not already explained by heading context, investigate before refactoring.

---

# Phase 1 — Fail-closed page architecture coverage (#254, first slice)

## Task 1.1: Add presentation-registry coverage tests

**Files:**
- Modify: `src/site/pages/content-validation.ts`
- Modify: `src/site/pages/entity-presentation.ts`
- Test: `test/site-composition.test.mjs` or a focused new `test/site-page-architecture.test.mjs`

**Interfaces:**
- Consumes: `sitePages`, `EntityPageContentRegistry`, Entity shell presentation mapping.
- Produces: `validateEntityPageArchitecture(...)` or equivalent single validation boundary.

Expected interface shape:

```ts
interface EntityPageArchitectureValidationInput {
  pages: readonly SitePageDefinition[];
  content: EntityPageContentRegistry;
  presentations: ReadonlyMap<EntityPageId, EntityShellPresentation>;
}

function validateEntityPageArchitecture(
  input: EntityPageArchitectureValidationInput,
): void;
```

Exact collection representation may differ, but the authority must be iterable/testable rather than hidden behind runtime-only lookup.

- [ ] Write RED test: enabled Entity page missing PageContent throws.
- [ ] Write RED test: enabled Entity page missing presentation throws.
- [ ] Write RED test: orphan PageContent not declared in manifest throws.
- [ ] Write RED test: orphan presentation not declared in manifest throws.
- [ ] Keep duplicate PageContent rejection and domain entity validation.
- [ ] Implement minimum validator to make tests GREEN.
- [ ] Wire validation into module initialization/build path so failures occur before page rendering.
- [ ] Run targeted architecture tests and `npm run typecheck`.
- [ ] Commit.

## Task 1.2: Remove redundant Home support list only if executable validation replaces it

**Files:**
- Modify: `src/site/pages/homepage.ts`
- Test: architecture/Home tests.

Current smell:

```ts
const implementedFullRenderers = new Set<string>([
  "case:jestei-pool",
  "case:styx",
  "case:sensetique",
  "collection:music-photography",
]);
```

- [ ] Write RED/characterization test proving every `homepageEntries` Entity resolves through manifest + PageContent + presentation.
- [ ] Replace duplicate support-list validation with canonical registry validation if no unique behavior remains.
- [ ] Do not implement unused `compact/card/none` modes. If only `full` is real, simplify the type only when the change does not widen #251 scope or alter behavior.
- [ ] Run targeted tests, `npm run typecheck`.
- [ ] Commit separately from Homepage rendering migration.

---

# Phase 2 — Canonical Homepage (#251)

## Design decision

Homepage becomes a first-class renderer but not a second Entity-content authority. Home-only surfaces may have Home-specific composition data, while Jestei/Styx/Sensetique/Shootings must continue to resolve from `entityPageContentRegistry`.

Do **not** create a generic universal `PageContent` that forces Hero, contact/footer, project cards and every future page into one oversized union merely to eliminate `index.html`. Use explicit Home composition where the semantics are genuinely Home-specific.

## Task 2.1: Separate PageShell document ownership from legacy Home HTML

**Files:**
- Modify: `src/site/renderers/home/home-page.ts`
- Reuse/modify: `src/site/shell/page-shell.ts`
- Reuse: `src/site/shell/metadata.ts`
- Reuse: `src/site/shell/navigation.ts`
- Test: `test/site-composition.test.mjs`

**Interfaces:**
- Consumes: Home `SitePage`, Home search presentation, structured data, rendered Home main content.
- Produces: complete Home document without replacing legacy nav/head fragments.

- [ ] Write RED test: Home renders correctly from a minimal source document that does not contain legacy hidden navigation.
- [ ] Add explicit shell capability needed for Home structured data. Prefer a controlled shell option/hook over post-render regex mutation.
- [ ] Render navigation directly from `renderSiteNavigation(page)`.
- [ ] Render metadata directly via existing metadata API.
- [ ] Render structured data explicitly during shell construction.
- [ ] Preserve current favicon/styles/runtime entrypoints.
- [ ] Remove `legacyHomepageNavigation` replacement only after test is GREEN.
- [ ] Remove structured-data regex patch only after explicit shell path is GREEN.
- [ ] Run targeted tests and `npm run typecheck`.
- [ ] Commit.

## Task 2.2: Model and render Home-only composition explicitly

**Files:**
- Modify/create under: `src/site/renderers/home/**`
- Modify: `src/site/pages/homepage.ts` only for page composition metadata if appropriate.
- Existing data sources: `src/data/clients.ts`, `src/data/projects.ts`, existing current Home-only content modules.
- Test: Home composition tests.

Home-only surfaces currently represented by slots include project cards, client logos, portfolio strips and older Home-only projects/content fragments.

- [ ] Inventory every active marker from `createHomepageSlots()` and classify:
  1. global Home surface;
  2. canonical Entity content already replaced by PageContent;
  3. Home-only project/content surface;
  4. dead/inert marker.
- [ ] Add this inventory to #251 before deletion.
- [ ] Create focused render functions/composition modules for category 1 and 3. Avoid one new 400-line `home-content.ts` dumping ground.
- [ ] Reuse canonical component imports (`src/components/*`) for rendering.
- [ ] Preserve current output order exactly.
- [ ] Preserve existing project-card routing through canonical `sitePages` relations.
- [ ] Add tests for project-card and logo counts/order only where behavior is currently contractual.
- [ ] Run targeted tests and `npm run typecheck`.
- [ ] Commit.

## Task 2.3: Render canonical Entity articles directly in Home composition

**Files:**
- Modify: Home renderer/composition modules.
- Reuse: `entityPageContentRegistry`, `getEntityShellPresentation`, `renderEntityShell`.

**Interfaces:**

```ts
function renderCanonicalHomepageEntity(entry: HomepageEntry): string
```

remains conceptually valid, but it must be called as part of Home composition rather than used to replace an article extracted from legacy HTML.

- [ ] Write RED test: Home renders the four Entity articles with no corresponding article placeholders in source HTML.
- [ ] Compose Jestei/Styx/Sensetique/Shootings directly in `homepageEntries` order.
- [ ] Preserve `introHeadingLevel: 2`.
- [ ] Preserve specialized Jestei track-filter renderer injection.
- [ ] Preserve article presentation IDs/themes/navigation flags.
- [ ] Confirm no `extractElementById()` is needed by Home rendering.
- [ ] Run Home + standalone Entity tests.
- [ ] Commit.

## Task 2.4: Retire marker-driven Home composition

**Files:**
- Delete: `src/site/renderers/home/home-slots.ts` when zero active consumers remain.
- Modify: `index.html` to remove build markers/generated-content placeholders that no longer serve a runtime purpose.
- Modify tests that intentionally asserted marker replacement.

- [ ] Write RED test stating final Home generation does not depend on `<!-- [A-Z][A-Z0-9_]+ -->` markers.
- [ ] Repository-search every marker name from the Task 2.2 inventory.
- [ ] Delete migrated markers only after no renderer requires them.
- [ ] Delete `home-slots.ts` only after all Home-only content has an explicit canonical owner.
- [ ] Remove `replaceRequiredSlots` from Home path. Do not delete generic helper if another legitimate consumer remains.
- [ ] Remove Homepage article replacement/extraction code.
- [ ] Replace snippet exclusion regex with explicit rendering ownership if those wrappers still belong to Home output. Preserve exact noindex/data-nosnippet behavior.
- [ ] Run `node --test test/site-composition.test.mjs`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:fast`.
- [ ] Run `npm run build:site`.
- [ ] Run relevant Home/navigation/project browser smoke.
- [ ] Commit.

**Phase 2 acceptance gate:** issue #251 criteria all satisfied before continuing. Do not mix template ownership changes into the Homepage PR/commit unless an import move is strictly required.

---

# Phase 3 — Canonical component implementation ownership (#252 / ARC-33 / ARC-40)

## Design decision

This phase is deliberately mechanical. It is **not** the time to redesign component props, rename CSS APIs or merge components because they look similar. First fix ownership direction; later API normalization can be evidence-driven.

## Task 3.1: Build a template/component ownership inventory

**Files:** none initially; issue #252 comment/result record.

- [ ] List every file under `src/templates/`.
- [ ] For each file, record:
  - implementation or shim;
  - canonical intended module under `src/components/content`, `composition` or `specialized`;
  - direct consumers;
  - output-contract test coverage;
  - retirement condition.
- [ ] Identify any template with no canonical component path and classify it before moving.
- [ ] Stop if a file is actually page composition rather than a reusable component; do not force it into a generic component folder.

## Task 3.2: Move content component implementations

**Files:** likely pairs such as:
- `src/templates/media-figure.ts` -> `src/components/content/media-figure.ts`
- `src/templates/media-group.ts` -> `src/components/content/media-group.ts`
- `src/templates/media-slider.ts` -> `src/components/content/media-slider.ts`
- `src/templates/mockup.ts` -> `src/components/content/mockup.ts`
- `src/templates/mockup-deck.ts` -> `src/components/content/mockup-deck.ts`
- `src/templates/justified-gallery.ts` -> `src/components/content/justified-gallery.ts`
- `src/templates/before-after.ts` -> `src/components/content/before-after.ts`
- `src/templates/page-flip.ts` -> `src/components/content/page-flip.ts`

- [ ] For one renderer family at a time, add/confirm exact rendered-output contract.
- [ ] Copy implementation to canonical component module with only relative import changes.
- [ ] Replace old template implementation with temporary one-line re-export **from canonical component**.
- [ ] Migrate direct consumers to canonical path.
- [ ] Run targeted tests + typecheck.
- [ ] Commit logical batches small enough to revert independently.

## Task 3.3: Move composition/specialized implementation ownership

Potential areas:
- project/entity intro
- section intro
- responsive image
- client logo / project card if still actively template-owned
- animated canvas gallery / Jestei theme if current canonical wrapper is inverted

- [ ] Apply the same implementation-first, compatibility-second pattern.
- [ ] Keep specialized runtime boundaries specialized. Do not promote Awful Cases game, Jestei filter, Moves canvas or other project-local behavior to generic content APIs just to reduce file count.
- [ ] Run relevant behavioral smoke for specialized components when implementation files move.

## Task 3.4: Retire template compatibility paths

- [ ] Search the entire repository for every `src/templates/` import.
- [ ] Remove a compatibility file only when the search is zero and no tool/test/documented runtime loader depends on the path.
- [ ] Keep a shim only if a real consumer still exists; record that consumer and retirement condition in #252 / Notion ARC-33/40.
- [ ] Do not claim `src/templates` removed if even one active shim remains.
- [ ] Run `npm run typecheck`, `npm run test:fast`, `npm run build:site` and relevant browser smoke.
- [ ] Commit.

---

# Phase 4 — Remove migration-only Section frame adapter (#252 / ARC-40)

## Task 4.1: Remove legacy section-frame ownership from Shootings source data

**Files:**
- Modify: `src/data/content/shootings.ts` or exact owning source modules discovered by search.
- Modify: `src/content/pages/collections/shootings.ts`
- Delete: `src/content/pages/legacy-frame.ts` after final consumer removal.
- Tests: Shootings composition contracts.

Current adapter:

```ts
withoutLegacySectionFrame(data)
```

exists only because old media data still carries `project__section wrapper` classes that canonical `Section` now owns.

- [ ] Write characterization test for current Shootings final HTML around every adapter-backed group/figure.
- [ ] Locate the exact source objects whose `className` includes legacy frame classes.
- [ ] Remove only `project__section` / `wrapper` ownership from the source object while preserving legitimate component-local classes.
- [ ] Render the same object directly without `withoutLegacySectionFrame`.
- [ ] Verify final HTML parity.
- [ ] Remove helper calls.
- [ ] Search `withoutLegacySectionFrame` and `legacy-frame.ts` references.
- [ ] Delete `legacy-frame.ts` at zero consumers.
- [ ] Run targeted Shootings tests, typecheck, fast tests and build.
- [ ] Commit.

---

# Phase 5 — Section renderer cleanup and CSS preset ownership (#253)

## Task 5.1: Characterize every Section presentation mode in active use

**Files:**
- Test: focused section-renderer test or existing composition test.

Modes currently include:
- `stack`
- `split-always`
- `media-stack`
- `mockup-grid-reel`
- `infinite-media-reel`

Also characterize:
- separators: `before-blocks`, `between-blocks`
- note placement
- head order
- outer divider
- global vs section-owned reveal
- project-group item rendering
- specialized sections

- [ ] Add test fixtures covering each active semantic mode.
- [ ] Assert important classes/data attributes and ordering, not whitespace trivia.
- [ ] Run GREEN before extraction.
- [ ] Commit tests if they are substantial.

## Task 5.2: Extract one shared Section body assembly path

**Files:**
- Modify: `src/site/renderers/entity/section.ts`
- Create focused helper modules only where responsibilities are independently understandable, likely:
  - `section-head.ts`
  - `section-layout.ts`
  - `section-body.ts`
  - `project-presentation.ts` only if it contains genuinely separate wrapper semantics

**Interfaces:**

A useful internal shape is conceptually:

```ts
interface SectionBodyParts {
  intro: string;
  head: string;
  heading: string;
  blocks: string;
  trailingNote: string;
  resources: string;
}

function renderSectionBody(parts: SectionBodyParts, presentation?: SectionPresentation): string;
```

Do not force this exact type if a smaller established pattern fits better.

- [ ] Extract head/note/credits rendering without behavior changes.
- [ ] Extract layout block rendering once.
- [ ] Make both ordinary `content/project` sections and `ProjectPresentation` use the same layout/body primitives.
- [ ] Keep semantic wrapper difference (`section` vs grouped project `div`) explicit.
- [ ] Run targeted tests after each extraction.
- [ ] Commit before CSS ownership changes.

## Task 5.3: Move generic visual recipe values to CSS-owned presets

Current generic renderer examples include fixed values such as:
- columns `4`
- item sizes around `18rem`
- infinite reel duration `32s`
- split min/gap values

- [ ] Inventory which inline values are truly reusable preset constants vs per-content component data.
- [ ] For reusable presets, output a stable semantic class/data attribute from TypeScript instead of inline recipe values.
- [ ] Implement the same current values in the appropriate CSS owner.
- [ ] Do not move genuinely content-specific values out of typed component data.
- [ ] Verify computed layout at current desktop/mobile baselines.
- [ ] Verify motion duration/behavior where a duration moves to CSS.
- [ ] Run targeted tests, typecheck, fast tests, build and relevant browser smoke.
- [ ] Commit.

---

# Phase 6 — Finish build orchestration boundary (#254, second slice)

## Task 6.1: Move 404 implementation out of central Vite plugin

**Files:**
- Modify: `src/site/build/site-pages-plugin.ts`
- Create: `src/site/renderers/not-found-page.ts` (or established equivalent)
- Test: route/page shell test.

- [ ] Characterize exact current 404 output and noindex behavior.
- [ ] Move existing literal 404 content unchanged to its explicit system-page renderer owner.
- [ ] Keep plugin dispatch as `page.renderer -> renderer` orchestration.
- [ ] Run targeted tests/typecheck.
- [ ] Commit.

## Task 6.2: Hide CV implementation behind a focused boundary

**Files:**
- Modify: `src/site/build/site-pages-plugin.ts`
- Modify/create: focused CV/static renderer or build module.
- Preserve: `public-static` build kind and existing production finalization unless evidence supports a separate later migration.

- [ ] Characterize dev CV transform and production finalization output.
- [ ] Move `readCvContent` / transform loading knowledge out of central site page dispatcher.
- [ ] Keep central plugin aware only that renderer `cv` delegates to a CV boundary.
- [ ] Do not unify CV with Entity/Home PageShell in this issue.
- [ ] Run `npm run test:cv` if appropriate, `npm run typecheck`, `npm run build:site`, and CV smoke.
- [ ] Commit.

---

# Phase 7 — Authored copy ownership cleanup (#255)

## Design decision

This phase is deliberately last so architecture refactors cannot accidentally disguise text movement as implementation churn.

`PageContent` may contain **references to authored data**, but literal editor-managed copy should live in an existing editorial/content source when such an owner exists.

Architecture/system strings that are truly system UI may remain code-owned under an explicit system-page/component owner.

## Task 7.1: Audit user-facing literals in architecture composition

**Files:**
- Read/search: `src/content/pages/**/*.ts`, central page renderers/build modules.
- Result: issue #255 audit list.

Known examples at planning time:
- Sensetique PageContent heading literal `Оборудование`.
- Shootings PageContent credit literal `Фотограф Иван Крушинский`.

- [ ] Search quoted Cyrillic/user-facing strings in PageContent modules.
- [ ] Classify each: editorial / system UI / architecture token.
- [ ] Do not move structural IDs, class names, route labels used as identity, or presentation enum values into CMS.
- [ ] Post audit to #255 before changes.

## Task 7.2: Move editorial literals to existing content owners without changing text

**Files:**
- Modify existing `src/content/**` JSON/editorial sources and typed adapters.
- Modify PageContent modules to reference typed values.
- `.pages.yml` / generator only if an already-supported editorial field needs consistent exposure.

- [ ] For each approved editorial literal, add exact existing string to the nearest canonical content source.
- [ ] Parse through the existing strict adapter boundary.
- [ ] Reference the typed value from PageContent.
- [ ] Add output parity assertion before/after.
- [ ] Do **not** correct spelling, punctuation, capitalization or style.
- [ ] Run content parser tests, page composition tests, typecheck, fast tests and build.
- [ ] Commit.

---

# Phase 8 — Full closeout verification and documentation reconciliation (#256 / ARC-41 / ARC-51)

## Task 8.1: Repository/reference cleanup proof

- [ ] Search for old Homepage build markers.
- [ ] Search for `home-slots` imports/references.
- [ ] Search for Homepage Entity article extraction/replacement helpers.
- [ ] Search for legacy navigation/metadata regex reconstruction.
- [ ] Search for `withoutLegacySectionFrame` / `legacy-frame`.
- [ ] Search canonical component modules for imports/re-exports from `src/templates`.
- [ ] Search remaining `src/templates` consumers and document any intentionally retained shim.
- [ ] Search PageContent modules for audited authored literals.

## Task 8.2: Verification ladder

Run the cheapest relevant checks first and stop on failure:

```bash
npm run typecheck
npm run test:fast
npm run cms:check
npm run build:site
```

Then focused broader checks appropriate to changed architecture:

```bash
npm run test:e2e:smoke
npm run test:e2e:navigation
npm run test:e2e:projects
npm run test:e2e:cv
```

Run `npm run verify:full` only at final closeout if media state/cost is acceptable and the exact candidate needs the full project gate. Do not add it to normal Fast CI.

- [ ] Record exact candidate SHA.
- [ ] Record commands actually run and results.
- [ ] Record checks intentionally not run and why.
- [ ] Verify no unintended working-tree/generated changes remain.

## Task 8.3: Close issues and reconcile planning sources

- [ ] Update #251–#255 with Result Records and exact commit/PR evidence.
- [ ] Check every checkbox in #256 only after its issue acceptance is proven.
- [ ] Update Notion Matrix Steps 43–46 and existing ARC-33/40/41/51 with exact final state.
- [ ] Update Project 01 current status and Control Center current baseline.
- [ ] Update #223 so active/deferred architecture state matches reality.
- [ ] Remove or rewrite stale comments claiming Jestei PageContent is unregistered if still present after code changes.
- [ ] Do not erase historical records; mark them historical/superseded where necessary.

---

# Expected file-ownership result

## `src/site/pages/`
Owns:
- route/page identity;
- enabled/listed/indexable state;
- renderer/build kind;
- canonical page/presentation coverage validation;
- Home inclusion/order metadata where needed.

Does not own:
- arbitrary authored page copy;
- renderer implementation;
- CSS recipe values.

## `src/content/pages/`
Owns:
- canonical Entity composition references;
- `intro` + `Section[]` structure;
- typed project relations.

Does not own:
- raw routes;
- generic DOM wrappers/classes as authored content;
- editor-managed literal copy when an editorial source exists;
- generic component implementations.

## `src/components/`
Owns:
- actual reusable renderer/component implementations;
- composition/content/specialized boundaries.

Does not delegate canonical implementation ownership back to `src/templates/`.

## `src/templates/`
Target:
- removed;
- or, temporarily, compatibility-only re-exports with explicit live consumers and retirement conditions.

## `src/site/renderers/entity/`
Owns:
- Entity shell;
- Section/ContentBlock rendering orchestration;
- semantic layout dispatch.

Does not own:
- reusable design constants that belong in CSS;
- duplicate Section and ProjectPresentation assembly algorithms.

## `src/site/build/`
Owns:
- Vite/build orchestration;
- mapping requests/entries/pages to dedicated render/build handlers.

Does not own:
- literal page content;
- page-specific renderer implementation details that can live behind a focused boundary.

---

# Risk management

## Highest-risk change: Homepage

Reason: it currently uses legacy HTML as an implicit structural API and touches many site surfaces.

Mitigation:
- characterization first;
- migrate Home-only surfaces incrementally;
- compose canonical Entity pages directly;
- remove markers last;
- browser smoke before merge.

## Medium/high-risk change: Section renderer

Reason: broad shared rendering path and responsive/motion behavior.

Mitigation:
- per-layout characterization;
- separate code extraction from CSS ownership move;
- preserve semantic contracts;
- responsive smoke.

## Low/medium-risk change: template ownership inversion

Reason: mostly import/file moves but large fan-out.

Mitigation:
- one family at a time;
- temporary reverse re-export;
- zero-consumer search before deletion.

## Medium-risk change: authored copy ownership

Reason: user explicitly prohibits incidental text changes and CMS ownership can drift.

Mitigation:
- execute last;
- exact string parity assertions;
- reuse existing strict editorial adapters;
- no copy editing.

---

# Final acceptance

Architecture closeout is complete only when all are true:

- [ ] #251–#255 are closed with evidence.
- [ ] Homepage is not marker/slot/article-replacement/regex reconstructed.
- [ ] Home and standalone Entities share the same canonical EntityPageContent authority.
- [ ] `src/components/*` contains real canonical implementations.
- [ ] `src/templates/*` is removed or explicitly compatibility-only with justified live consumers.
- [ ] `legacy-frame.ts` is removed.
- [ ] Section/ProjectPresentation body assembly is not duplicated.
- [ ] reusable layout recipe constants are CSS-owned where appropriate.
- [ ] enabled Entity coverage fails closed across SitePage, PageContent and Presentation.
- [ ] central site-pages build plugin is orchestration-only.
- [ ] audited authored copy is owned by editorial/content sources without wording changes.
- [ ] typecheck, Fast tests, build and relevant browser checks are green on an exact final SHA.
- [ ] Notion Project Matrix, Project 01, Control Center and GitHub #223/#256 agree with the exact repository state.
