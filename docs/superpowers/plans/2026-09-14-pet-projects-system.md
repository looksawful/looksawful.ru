# Pet Projects System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-like, scalable Pet Projects homepage component with typed live/coming-soon states and manual `NEW` badges, add canonical Berserk Timer and AWFUL STUDIO pages, and expose the exact production renderer in preview/Lab without touching `prod`.

**Architecture:** Extend the existing `SubprojectCardData`/renderer family instead of creating a second card system. Pet-specific authored data gets a discriminated union for semantic interaction states; the homepage uses the same renderer and canonical media catalog as production. Responsive behavior lives in `src/styles/subproject-cards.css`; new project pages use the existing EntityPage/content/manifest/presentation pipeline.

**Tech Stack:** TypeScript, semantic HTML, CSS Grid/Flex/scroll snap/container queries, Vite 8, existing media catalog/runtime, Node test contracts, Playwright/Chromium, Cloudflare PR Preview.

**Spec:** `docs/superpowers/specs/2026-09-14-pet-projects-system-design.md`

## Global Constraints

- The heading is exactly `Полезное`.
- Current card copy is exactly the approved four descriptions from the spec; no roles or years in cards.
- `prod` is not modified or merged without explicit user approval.
- Future roadmap projects do not receive public routes, domain records, sitemap entries, or production cards in this change.
- `NEW` is authored manually; `COMING SOON` is an interaction state, not a disabled link.
- Coming-soon cards render as non-interactive semantic markup and have no `href`.
- CSS owns responsive layout; no JavaScript breakpoint or card-width calculations.
- The narrow layout is a horizontal snap reel; intermediate is 2 columns; wide is 4 columns; extra cards create rows.
- Use existing site tokens, media catalog, renderers, EntityPage shell, and Vite route architecture.
- Storybook/Lab may consume the production renderer but must not duplicate its implementation.
- New CSS behavior must preserve reduced-motion and a usable fallback when scroll-state enhancement is unsupported.

---

### Task 1: Lock Pet Project card semantics with permanent contracts

**Files:**
- Create: `test/pet-project-cards.test.mjs`
- Modify: `tools/ci/test-manifest.mjs` only if the repository's explicit Fast/Affected manifest requires registration of the new permanent test
- Modify later in this task: `src/data/subproject-cards.ts`
- Modify later in this task: `src/templates/subproject-card.ts`

**Interfaces:**
- Produces: `PetProjectCardData`, a discriminated union with `state: "live" | "coming-soon"` and `badge?: "new"`.
- Produces: `renderPetProjectCards(cards: readonly PetProjectCardData[]): string`.
- Guarantees: live cards render anchors; coming-soon cards render articles, have no link, and render `COMING SOON`; `NEW` renders only when authored.

- [ ] **Step 1: Write the failing semantic rendering test**

Create `test/pet-project-cards.test.mjs` with source-level/runtime assertions that import the compiled TypeScript through the repository's established test mechanism or, if direct TS import is unavailable, assert the generated HTML through the public renderer entry. Cover these exact behaviors:

```js
assert.match(liveHtml, /<a\b[^>]*href="\/work\/awful-cases\/"/);
assert.match(newHtml, />NEW<\/span>/);
assert.doesNotMatch(liveHtml, /COMING SOON/);
assert.match(comingSoonHtml, /<article\b/);
assert.match(comingSoonHtml, />COMING SOON<\/span>/);
assert.doesNotMatch(comingSoonHtml, /<a\b/);
assert.doesNotMatch(comingSoonHtml, /href=/);
```

Also assert the exported current Pet Project list contains exactly the four current IDs and the exact approved descriptions.

- [ ] **Step 2: Run the focused test and verify RED**

Run the repository-supported direct Node command for the new test, or `npm run test:fast` after adding it to the explicit manifest if required. Expected failure: missing `PetProjectCardData`/badge/coming-soon semantics and missing AWFUL STUDIO current card.

- [ ] **Step 3: Add the typed Pet Project data contract**

In `src/data/subproject-cards.ts`, preserve generic shooting/subproject cards and introduce a pet-specific union equivalent to:

```ts
type PetProjectCardBase = Omit<SubprojectCardData, "href"> & {
  badge?: "new";
};

export type PetProjectCardData =
  | (PetProjectCardBase & { state: "live"; href: string })
  | (PetProjectCardBase & { state: "coming-soon"; href?: never });
```

Populate `petProjectCards` with only the four current projects, exact approved descriptions, canonical `/work/.../` hrefs, and no role/year strings. Add AWFUL STUDIO using its canonical media entry created in Task 4; until Task 4 lands, use the exact entry ID planned there so TypeScript/test failures accurately expose the dependency.

- [ ] **Step 4: Implement semantic rendering without forking the component family**

Update `src/templates/subproject-card.ts` so generic cards keep existing behavior while `renderPetProjectCards` understands `PetProjectCardData`. Render badge chrome as:

```html
<span class="subproject-card__badge">NEW</span>
```

for authored new cards and:

```html
<span class="subproject-card__badge">COMING SOON</span>
```

for `state: "coming-soon"`. A coming-soon card must be an `<article>`, never an `<a>` with CSS-disabled pointer behavior.

- [ ] **Step 5: Run focused test and typecheck**

Run: `npm run typecheck` and the focused card contract. Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add typed Pet Project card states`.

---

### Task 2: Replace homepage Pet Projects layout with production CSS reel/grid behavior

**Files:**
- Modify: `src/site/renderers/home/home-slots.ts`
- Modify: `src/styles/subproject-cards.css`
- Test: `test/pet-project-cards.test.mjs`

**Interfaces:**
- Consumes: `petProjectCards: readonly PetProjectCardData[]` and `renderPetProjectCards` from Task 1.
- Produces: homepage section with heading `Полезное`, no embedded `<style>` block, responsive behavior owned by CSS.

- [ ] **Step 1: Extend the failing contract**

Add assertions that the Pet Projects homepage renderer uses `Полезное`, does not emit the previous inline `petProjectsPreviewStyles`, and emits the dedicated `pet-projects`/`pet-projects__grid` structure.

- [ ] **Step 2: Run focused contract and verify RED**

Expected failure: current `home-slots.ts` still contains `Pet projects` and inline preview CSS.

- [ ] **Step 3: Simplify homepage composition**

Remove the card-specific inline CSS constant/string from `home-slots.ts`. Remove ad-hoc href remapping because canonical `/work/.../` hrefs now live in typed Pet Project data. Render the exact heading `Полезное`.

- [ ] **Step 4: Implement component-local mobile-first CSS**

In `src/styles/subproject-cards.css`, leave generic `.subproject-cards` behavior intact and change only the `.pet-projects` branch:

```css
.pet-projects {
  container: pet-projects / inline-size;
}

.pet-projects__grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min(84cqi, 22rem);
  gap: var(--size-3);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline mandatory;
  scroll-padding-inline: var(--page-padding-inline);
}

.pet-projects .subproject-card {
  scroll-snap-align: center;
  scroll-snap-stop: always;
}
```

Use the repository's actual existing spacing/radius/font token names when implementing. Add component queries for 2-column and 4-column grids at content-driven widths; do not use device labels. At grid widths reset overflow/snap and use `minmax(0, 1fr)`.

Add progressive snapped-card emphasis with the supported native scroll-state container syntax if accepted by the project's Chromium floor; otherwise preserve equal scale as fallback. Neighbor cards may use approximately `.92` scale/quiet opacity only in the enhanced narrow mode. `prefers-reduced-motion` removes transitions/scaling animation.

- [ ] **Step 5: Style badges from existing tokens**

Badge must be compact, readable over media, use current typography/radius/color tokens, and not alter card dimensions unpredictably. Position it in the card/media chrome without JS.

- [ ] **Step 6: Run focused test, typecheck, and build CSS through site build**

Run: `npm run typecheck`, focused test, then `npm run build:site` once Task 4 media entries exist. Before Task 4, run typecheck/focused contract only.

- [ ] **Step 7: Commit**

Commit message: `feat: add responsive Pet Projects reel`.

---

### Task 3: Add canonical Berserk Timer page through the existing EntityPage architecture

**Files:**
- Create: `src/content/pages/projects/berserk-timer.ts`
- Create: `work/berserk-timer/index.html`
- Modify: `src/content/pages/index.ts`
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/pages/entity-presentation.ts`
- Modify: `test/site-pages.test.mjs`

**Interfaces:**
- Produces route ID: `project:berserk-timer`.
- Produces path: `/work/berserk-timer/`.
- Uses existing domain Project ID `berserk-timer`.
- Uses public project identity `looksawful/berserk-timer`; do not link the private `berserk-timer-app` repository.

- [ ] **Step 1: Add failing permanent route/page contracts**

Update `test/site-pages.test.mjs` fixed ID/entity route expectations to require `project:berserk-timer`, `/work/berserk-timer/`, enabled entity renderer, `listed:false`, `indexable:false`, page content, presentation, and domain project identity.

- [ ] **Step 2: Run `node --test test/site-pages.test.mjs` and verify RED**

Expected failure: route/content/presentation absent.

- [ ] **Step 3: Create `EntityPageContent` for Berserk Timer**

Use the existing project-page shape from `awful-cases.ts`/`moves-awful.ts`. Intro description must be `Консольный помодоро-таймер для Windows.`. Use only facts supported by the public CLI project/domain evidence. Use existing Berserk media catalog entries; no private-app links.

- [ ] **Step 4: Register content, presentation, manifest route, and Vite HTML input**

Add the page to `src/content/pages/index.ts`, neutral presentation to `entity-presentation.ts`, canonical entity route to `manifest.ts`, and a minimal `work/berserk-timer/index.html` mirroring the existing work-page shell.

- [ ] **Step 5: Run page contract and typecheck**

Run: `node --test test/site-pages.test.mjs` and `npm run typecheck`. Expected: PASS for Berserk additions.

- [ ] **Step 6: Commit**

Commit message: `feat: add canonical Berserk Timer page`.

---

### Task 4: Register AWFUL STUDIO as a canonical Project with real media

**Files:**
- Modify: `src/data/catalog/projects/other.ts`
- Create or modify: `src/data/media/assets/awful-studio.ts`
- Create or modify: `src/data/media/entries/awful-studio.ts`
- Modify the repository's asset/entry registration indexes used by media sync
- Do not hand-edit: `public/media/generated/**`, `src/data/media/catalog-records.generated.ts`, `src/data/media/responsive-generated.ts`
- Test: `test/domain-catalog-identity.test.mjs`

**Interfaces:**
- Produces domain Project ID `awful-studio`.
- Produces canonical media entry IDs used by card/page content, including a landscape cover/hero.

- [ ] **Step 1: Add failing domain identity contract**

Update `test/domain-catalog-identity.test.mjs` expected project IDs to include `awful-studio` without relaxing fixed identity assertions.

- [ ] **Step 2: Run the focused domain test and verify RED**

Expected failure: `awful-studio` is absent.

- [ ] **Step 3: Add the domain project record**

Add `awful-studio` to `src/data/catalog/projects/other.ts` with type `software`, status `active`, collection `pet-projects`, role `Разработчик`, start year 2026, and a concise Blender-native virtual product studio summary based on current repo evidence.

- [ ] **Step 4: Add real AWFUL STUDIO media through source registries**

Use the prepared real presentation/Blender materials already available in project work, stored under `/media/projects/awful-studio/`. Register source assets and entries through the same files/patterns as other projects. Required groups are:

- cover/hero;
- mockup/product deck: problem, workflow, interface, presets;
- technical/system slider: interface-map, scene-anatomy, product-quality, motion-camera, lighting, environment;
- compact final group: how-to, reliability, fixes, status.

Do not hotlink `raw.githubusercontent.com` in the final candidate.

- [ ] **Step 5: Run media sync and domain/type checks**

Run: `npm run media:sync`, focused domain test, `npm run typecheck`. Expected: generated outputs update only through the sync tool and all referenced entry IDs resolve.

- [ ] **Step 6: Commit**

Commit message: `feat: register AWFUL STUDIO project media`.

---

### Task 5: Add canonical AWFUL STUDIO EntityPage

**Files:**
- Create: `src/content/pages/projects/awful-studio.ts`
- Create: `work/awful-studio/index.html`
- Modify: `src/content/pages/index.ts`
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/pages/entity-presentation.ts`
- Modify: `test/site-pages.test.mjs`

**Interfaces:**
- Consumes: Project ID and media entry IDs from Task 4.
- Produces route ID `project:awful-studio`, path `/work/awful-studio/`.

- [ ] **Step 1: Add failing permanent route/page contracts**

Require AWFUL STUDIO route/content/presentation/domain identity in `test/site-pages.test.mjs` with `listed:false`, `indexable:false`.

- [ ] **Step 2: Run page contract and verify RED**

Expected failure: canonical page pieces absent.

- [ ] **Step 3: Author the page with existing block types**

Create `EntityPageContent` with exact card/intro description `Расширение Blender для сборки виртуальной предметной студии.` and current supported facts. Use the block hierarchy:

1. intro;
2. strong hero/banner;
3. mockup deck using the four product/workflow slides;
4. media slider using the six technical/system slides;
5. compact media group using how-to/reliability/fixes/status;
6. CTA to the public `looksawful/awful-studio` repository/releases where appropriate.

Reuse existing block types; no new generic page-builder primitive.

- [ ] **Step 4: Register route, presentation, content and HTML input**

Mirror existing project routes and neutral presentations.

- [ ] **Step 5: Run page contract, typecheck, media build**

Run: `node --test test/site-pages.test.mjs`, `npm run typecheck`, `npm run build:site`. Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add canonical AWFUL STUDIO page`.

---

### Task 6: Add production-source Lab/Storybook fixtures for states and scale

**Files:**
- Modify/create only within the repository's current Lab/Storybook pilot structure after confirming the branch/file layout
- Reuse: `src/templates/subproject-card.ts`
- Reuse: `src/data/subproject-cards.ts`
- Reuse: `src/styles/index.css` / canonical stylesheet entry
- Test: existing Lab/Storybook contract tests on the chosen pilot infrastructure

**Interfaces:**
- Consumes: production `renderPetProjectCards` and `PetProjectCardData`.
- Produces preview fixtures, not a second implementation.

- [ ] **Step 1: Inspect current Storybook pilot files and choose the smallest integration point**

Use the existing Storybook pilot shell/stories branch content as reference, but port only necessary config/story files onto `preview/pet-projects-system` when they do not conflict with current `prod`.

- [ ] **Step 2: Add a fixture module next to the preview/story**

Fixtures must include:

```ts
currentFourCards
liveNewCard
comingSoonCard
largeSyntheticSet
```

Synthetic future cards are explicitly preview-only and must not be imported by production homepage data.

- [ ] **Step 3: Render the real production component in Lab/Storybook**

Stories/previews must call `renderPetProjectCards` and load canonical site styles. Include viewports around 390, 834 and 1440 widths. Do not duplicate card HTML or copy CSS into the story.

- [ ] **Step 4: Run Lab/Storybook build and contracts**

Run the existing `build:lab` and Storybook build/test commands exposed by the pilot infrastructure. Expected: static preview builds with no separate card implementation.

- [ ] **Step 5: Commit**

Commit message: `feat: preview Pet Projects production component`.

---

### Task 7: End-to-end verification and exact-SHA PR Preview

**Files:**
- No product source changes expected unless verification finds a defect.
- Create/update draft PR: `preview/pet-projects-system` -> `prod`.

**Interfaces:**
- Produces stable PR Preview URL plus immutable/exact deployment URL for the approved branch SHA.

- [ ] **Step 1: Run focused permanent tests**

Run the Pet Project card contract, `test/site-pages.test.mjs`, and domain catalog identity contract. Expected: PASS.

- [ ] **Step 2: Run typecheck and Fast suite**

Run: `npm run typecheck` and `npm run test:fast`. Expected: PASS.

- [ ] **Step 3: Run production build and relevant E2E**

Run: `npm run build:site`, `npm run test:project-pages`, and affected MPA/Chromium smoke according to the repository manifest. Expected: PASS.

- [ ] **Step 4: Verify responsive behavior at representative widths**

Check the real homepage candidate at approximately 390, 834 and 1440 CSS px:

- 390: horizontal snap reel, neighbor peeks, no page-level horizontal overflow, coming-soon semantic fixture non-clickable;
- 834: 2-column grid;
- 1440: 4-column grid and additional synthetic cards form additional rows in Lab/Storybook;
- reduced motion: no scale transition requirement;
- keyboard: live cards focusable, coming-soon card absent from tab order.

- [ ] **Step 5: Create/update draft PR to `prod` and wait for exact-SHA PR Preview**

The PR body must state that this is preview-only and production remains untouched. Record the head SHA, stable `pr-<n>` Cloudflare URL, and immutable deployment URL returned by CI.

- [ ] **Step 6: Verify remote URLs before reporting them**

Open the exact URLs and confirm homepage plus `/work/berserk-timer/` and `/work/awful-studio/` return/render correctly. Do not report a custom domain that was not actually verified.

- [ ] **Step 7: Final test classification report**

Report exactly:

```text
NEW PERMANENT TESTS: <count and paths>
TEMPORARY TESTS REMOVED: <count and paths>
MOVED TO AFFECTED/FULL: <count and paths>
```

- [ ] **Step 8: Stop before production merge**

Do not merge to `prod`. Present the real preview for visual approval first.