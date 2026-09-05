# Page Content Architecture Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the approved `PageContent -> Section -> ContentBlock` migration so every enabled Case / Project / Collection uses canonical PageContent, Homepage consumes the same canonical composition, and marker/extraction compatibility paths can be removed without changing authored copy, media meaning, routes, DOM semantics, or visible design.

**Architecture:** Keep `EntityPageContent` as the sole composition authority. Migrate the three remaining Case pages (Jestei, Styx, Sensetique), then make Homepage render canonical Entity content in `homepageEntries` order instead of owning internal case composition. Remove standalone extraction and marker-based compatibility only after coverage/parity tests prove all enabled Entity pages are canonical.

**Tech Stack:** Vite 8, TypeScript 7, Node 24, vanilla TypeScript/JavaScript, GSAP, Three.js, Node test runner, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-page-content-section-content-block-architecture-design.md`

## Global Constraints

- Do not change authored copy, media meaning, route identity, caption/lightbox behavior, slider/reel/canvas behavior, navigation semantics, accessibility behavior, or visible design.
- Do not add raw physical media paths to PageContent. Visual blocks continue to consume existing registry-backed `MediaEntryId` data.
- Do not invent Project records or duplicate Project metadata. `projectId` values must come from `src/data/catalog/projects/**`.
- Preserve all existing finite renderer variants.
- Keep `dev` and `prod` untouched until the PR is fully verified.
- Do not add a new permanent GitHub Actions workflow. Use existing Fast CI / CodeQL / Quality gates.
- `PageContent` must become the only internal composition authority for Case / Project / Collection pages.

---

### Task 1: Lock full enabled-Entity PageContent coverage with a failing contract

**Files:**
- Modify: `test/site-composition.test.mjs`
- Modify: `src/site/pages/content-validation.ts` only if the existing API cannot express the final invariant.

**Interfaces:**
- Consumes: `sitePages`, `entityPageContentRegistry`, `validatePageContentManifest()`.
- Produces: a contract proving every enabled `case`, `project`, and `collection` page is present in the canonical registry.

- [ ] **Step 1: Add the coverage test**

Add imports for `entityPageContentRegistry` and `validatePageContentManifest`, then add:

```js
test("every enabled entity page has canonical PageContent", () => {
  assert.doesNotThrow(() => validatePageContentManifest(
    sitePages,
    entityPageContentRegistry,
    { requireEnabledEntityCoverage: true },
  ));
});
```

- [ ] **Step 2: Verify the contract is RED before the remaining Case pages are registered**

Run:

```bash
node --test test/site-composition.test.mjs
```

Expected failure mentions one of:

```text
case:jestei-pool
case:styx
case:sensetique
```

- [ ] **Step 3: Keep this test as the final architectural coverage gate**

Do not weaken it after the three Case migrations.

---

### Task 2: Migrate Jestei Pool to canonical PageContent

**Files:**
- Create: `src/content/pages/cases/jestei-pool.ts`
- Modify: `src/content/pages/index.ts`
- Test: `test/site-composition.test.mjs`

**Interfaces:**
- Consumes: existing Jestei data from `src/data/content/jestei-pool.ts`, `src/data/content/jestei-theme-organism.ts`, canonical Project IDs from `src/data/catalog/projects/jestei-pool.ts`, and existing ContentBlock renderers.
- Produces: `jesteiPoolPageContent: EntityPageContent` registered as `case:jestei-pool`.

- [ ] **Step 1: Add a focused Jestei canonical-render test**

Keep the existing standalone assertions for `id="project-jestei"`, H1, isolation from other case DOM, and unresolved marker absence. Add an assertion that `entityPageContentRegistry.has("case:jestei-pool") === true` after registration.

- [ ] **Step 2: Create `jesteiPoolPageContent` using existing data objects without rewriting their content**

Use these ownership boundaries:

```text
intro -> jesteiIntro
featured media -> ContentSection
home/interface chapter -> ProjectSection(projectId: "jestei-core-interface")
brand chapter -> ProjectSection(projectId: "jestei-brand-system")
editorial/redpolitika -> ProjectSection(projectId: "jestei-editorial-policy")
event -> ProjectSection(projectId: "jestei-event")
landings -> ProjectSection(projectId: "jestei-landings")
subscription before/after -> ProjectSection(projectId: "jestei-subscription")
promo/social sequence -> ProjectSection(projectId: "jestei-promo-communication")
```

Keep `jesteiThemeOrganismMockup` as the existing `jestei-theme` ContentBlock rather than genericizing its runtime.

- [ ] **Step 3: Register Jestei in `entityPageContents`**

Import and append `jesteiPoolPageContent` in `src/content/pages/index.ts`.

- [ ] **Step 4: Verify Jestei in isolation**

Run:

```bash
node --test test/site-composition.test.mjs
npm run typecheck
```

Expected: Jestei standalone assertions pass; the global coverage test remains RED only for Styx/Sensetique.

---

### Task 3: Migrate Styx to canonical PageContent

**Files:**
- Create: `src/content/pages/cases/styx.ts`
- Modify: `src/content/pages/index.ts`
- Test: `test/site-composition.test.mjs`

**Interfaces:**
- Consumes: `src/data/content/styx.ts` and canonical IDs from `src/data/catalog/projects/styx.ts`.
- Produces: `styxPageContent: EntityPageContent` registered as `case:styx`.

- [ ] **Step 1: Preserve the current rendered order exactly**

Map existing data in the same order as `home-slots.ts`:

```text
styxBrandIntro
styxLogoBanner
styxProductionMockupDeck
styxProductionIntro
styxProductionMediaGroup
styxScanographyIntro
styxScanographyGroup
styxPrintLinksGroup
styxScanographyCampaignGroup
styxCatalogMockup
styxShootingsIntro
styxLookbookIntro
styxBrandLookbookReel
styxLookbookMasonryGroup
styxGiftCertificateSlider
styxScanographyStrip
styxLookbook2025Reel
styxSocialInstructionMockupDeck
```

- [ ] **Step 2: Use canonical Project ownership only where the current chapter maps unambiguously**

Use at minimum:

```text
brand/logo -> styx-brand-system
catalog -> styx-panoramic-catalog-2021
social instructions -> styx-social-instructions
lookbook 2025 -> styx-lookbook-2025
scanographic campaign -> styx-scanographic-campaign-2022
```

Keep broader mixed production/scanography/shootings chapters as `ContentSection` or `ProjectGroupSection` rather than assigning a fabricated single Project ID.

- [ ] **Step 3: Register Styx and run targeted checks**

Run:

```bash
node --test test/site-composition.test.mjs
npm run typecheck
```

Expected: Jestei and Styx are canonical; global coverage remains RED only for Sensetique.

---

### Task 4: Migrate Sensetique to canonical PageContent

**Files:**
- Create: `src/content/pages/cases/sensetique.ts`
- Modify: `src/content/pages/index.ts`
- Test: `test/site-composition.test.mjs`

**Interfaces:**
- Consumes: `src/data/content/sensetique.ts` and canonical IDs from `src/data/catalog/projects/sensetique.ts`.
- Produces: `sensetiquePageContent: EntityPageContent` registered as `case:sensetique`.

- [ ] **Step 1: Preserve `home-slots.ts` block order exactly**

Do not reorder Studio, Production, Olovo, Harsh Light, Raputo, Young Pioneer, Chapurin, Digital Fear, editorial, reel, slider, strip, page-flip, and gallery content.

- [ ] **Step 2: Use exact canonical Project IDs for named project material**

Examples that must use canonical IDs where represented:

```text
HARSH LIGHT -> sensetique-harsh-light-2018
Young Pioneer -> sensetique-young-pioneer-kaltblut
Krasota Dress -> sensetique-krasota-dress-lookbook
Olovo campaign -> sensetique-olovo-campaign
Olovo lookbook 2016 -> sensetique-olovo-lookbook-2016
Olovo lookbook 2018 -> sensetique-olovo-lookbook-2018
Inna Honour -> sensetique-inna-honour-lookbook
BURO 24/7 -> sensetique-buro-24-7-special
Olovo architecture -> sensetique-olovo-brandbook-architecture
Olovo booklet -> sensetique-olovo-booklet-design
Digital Fear -> sensetique-digital-fear-of-love
Chapurin -> sensetique-chapurin-editorial-2018
Wood.Metal.PANIC! -> sensetique-wood-metal-panic
Daniil Korotechenkov -> sensetique-editorial-daniil-korotechenkov
Tatiana Nikishina -> sensetique-editorial-tatiana-nikishina
Katya Knyazeva -> sensetique-editorial-katya-knyazeva
Yuri Ivanov -> sensetique-editorial-yuri-ivanov
Ivan Krushinski -> sensetique-editorial-ivan-krushinski
```

Keep Studio/general production chapters as `ContentSection` where no single canonical Project owns the chapter.

- [ ] **Step 3: Register Sensetique and make full coverage GREEN**

Run:

```bash
node --test test/site-composition.test.mjs
npm run typecheck
```

Expected: `validatePageContentManifest(... requireEnabledEntityCoverage: true)` passes for all seven enabled Entity pages.

---

### Task 5: Remove standalone Entity dependency on Homepage extraction

**Files:**
- Modify: `src/site/renderers/entity-page.ts`
- Modify: `src/site/build/site-pages-plugin.ts`
- Modify: `test/site-composition.test.mjs`
- Delete after proof: `src/site/renderers/registry.ts`
- Delete after proof: `src/site/renderers/cases/jestei-pool.ts`
- Delete after proof: `src/site/renderers/cases/styx.ts`
- Delete after proof: `src/site/renderers/cases/sensetique.ts`
- Delete other now-unreferenced extraction-only renderer files only if repository search proves zero consumers.

**Interfaces:**
- Consumes: complete `entityPageContentRegistry` and `renderEntityShell()`.
- Produces: `renderStandaloneEntityPage(page)` with no `homepageTemplate` argument and no fallback to `renderEntityArticle()`.

- [ ] **Step 1: Change the standalone renderer contract**

Target:

```ts
export function renderStandaloneEntityPage(page: EntityPageDefinition): string {
  const content = getEntityPageContent(entityPageContentRegistry, page.id);
  const presentation = getEntityShellPresentation(page.id);
  const article = renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 1,
  });
  // existing page shell/copy behavior remains unchanged
}
```

- [ ] **Step 2: Remove homepage-template I/O from entity builds**

In `site-pages-plugin.ts`, entity rendering must call:

```ts
return renderStandaloneEntityPage(page);
```

Do not read `index.html` solely to build an Entity page.

- [ ] **Step 3: Update composition tests to call the new signature**

Replace `renderStandaloneEntityPage(indexHtml, page(...))` with `renderStandaloneEntityPage(page(...))`.

- [ ] **Step 4: Delete extraction registry/case wrappers only after imports are gone**

Search for:

```text
renderEntityArticle
renderJesteiPoolArticle
renderStyxArticle
renderSensetiqueArticle
renderLargeEntityArticle
```

Delete only files with zero remaining consumers.

- [ ] **Step 5: Verify**

Run:

```bash
node --test test/site-composition.test.mjs
npm run typecheck
npm run build:site
```

Expected: all standalone pages still render their own article/H1/metadata and no standalone path reads Homepage HTML.

---

### Task 6: Switch Homepage case composition to canonical PageContent

**Files:**
- Modify: `src/site/renderers/home/home-page.ts`
- Modify: `src/site/renderers/home/home-slots.ts`
- Modify: `src/site/pages/homepage.ts` only if a small helper is needed to map `HomepageEntry` to `EntityPageId`.
- Modify: `test/site-composition.test.mjs`

**Interfaces:**
- Consumes: `homepageEntries`, `entityPageContentRegistry`, `renderEntityShell()` / canonical Section+Block renderers.
- Produces: Homepage that uses canonical Entity PageContent in `homepageEntries` order, with Home embedding using H2 intros and existing article IDs/themes.

- [ ] **Step 1: Add a semantic Home ordering test**

Assert rendered Home contains, in order:

```text
project-jestei
project-styx
project-sensetique
project-shootings
```

and each appears exactly once.

- [ ] **Step 2: Render full Homepage entities from `homepageEntries`**

For every `mode: "full"` entry, resolve the corresponding PageContent and `EntityShellPresentation`, render the same canonical content with `introHeadingLevel: 2`, and preserve existing article IDs/themes/navigation flags.

- [ ] **Step 3: Shrink `home-slots.ts` to Home-only responsibilities**

Keep only actual Home-owned slots such as project cards, client logos, portfolio teaser strips, and any other content that is not internal Entity composition. Remove JESTEI_*, STYX_*, SENSETIQUE_*, and SHOOTINGS_* internal composition entries once canonical Home rendering replaces them.

- [ ] **Step 4: Verify Homepage and standalone composition independently**

Run:

```bash
node --test test/site-composition.test.mjs
npm run typecheck
npm run build:site
```

Expected: Home order and visible semantics match baseline; standalone Entity rendering remains independent.

---

### Task 7: Retire marker/extraction compatibility and prove architectural invariants

**Files:**
- Modify: `index.html` only to remove architecture-owned Entity markers/empty extraction scaffolding after canonical Home insertion owns those locations; do not change authored text or visible content.
- Modify/Delete: `src/site/renderers/home/home-slots.ts` if it becomes unnecessary.
- Delete: `src/content/pages/legacy-frame.ts` only after all PageContent data stops requiring it.
- Modify/Delete: legacy `src/templates/**` compatibility re-exports only when repository search proves canonical imports have replaced all consumers.
- Modify: relevant contract tests.

**Interfaces:**
- Produces final invariants required by the approved spec.

- [ ] **Step 1: Add/strengthen contract assertions**

Tests must prove:

```text
every enabled Entity page has PageContent
standalone Entity renderer does not consume Homepage HTML
no internal Entity composition depends on HTML markers
no `custom` Section renderer exists
all PageContent project IDs resolve
all ContentBlock dispatch remains exhaustive
```

- [ ] **Step 2: Remove legacy helpers only when zero-consumer searches are clean**

Do not delete compatibility code just because its filename contains `legacy`.

- [ ] **Step 3: Run fast verification**

```bash
npm run typecheck
npm run test:fast
npm run test:media:contract
npm run build:site
```

Expected: all pass.

---

### Task 8: Final parity, browser gates, and PR lifecycle cleanup

**Files:**
- Modify: PR description and implementation docs only after code verification.
- Remove temporary migration-only tests only if `docs/testing-policy.md` classifies them as implementation-detail tests and a stronger permanent contract now covers the invariant.

**Interfaces:**
- Produces a merge-ready #128 with no known architecture migration debt in its approved scope.

- [ ] **Step 1: Run existing Fast CI and CodeQL on the final PR head**

Expected: both `success`.

- [ ] **Step 2: Run the existing affected/smoke browser tier for page/rendering changes**

Required viewports include the repository policy targets for mobile and desktop. Verify Home plus Jestei, Styx, Sensetique, Shootings, Awful Cases, Moves Awful, and Berry routes.

- [ ] **Step 3: Check semantic parity**

Verify article IDs, section order, project ownership, H1/H2 hierarchy, media/lightbox/caption hooks, no unresolved build markers, and no duplicated Entity DOM.

- [ ] **Step 4: Update PR #128 description**

State that all enabled Entity pages are canonical, Homepage no longer owns a second Entity composition authority, standalone extraction is removed, and final verification results are green.

- [ ] **Step 5: Mark PR ready only after all final-head checks are green**

Do not merge a stale SHA whose verification predates the final cleanup commit.
