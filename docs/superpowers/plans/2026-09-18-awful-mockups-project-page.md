# Awful Mockups Project Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a real, tested `/work/awful-mockups/` project page that showcases a curated set of neutral-screen 2D PSD mockups, reuses the existing Moves Awful canvas runtime, and exposes a truthful disabled future download action without publishing PSD files.

**Architecture:** Extend the existing typed entity-page, project catalog, media asset/entry, and useful-project pipelines. Add one small general-purpose pending/disabled resource-link state rather than a page-specific fake link. Derive web previews from the canonical PSD source set without modifying the masters, register only the selected web-ready exports, and drive both the static section and Moves Awful gallery from those entries.

**Tech Stack:** TypeScript 7, Vite 8, Node 24 test runner, existing media tooling, Sharp, existing animated-canvas-gallery runtime, Playwright smoke QA.

**Spec:** `docs/superpowers/specs/2026-09-18-awful-mockups-project-page-design.md`

## Global Constraints

- Canonical PSD source: `F:\AWFUL_ASSETS\Photoshop\Mockups\AWFUL-Mockups-2026-09-17\PSD`.
- Do not expose raw PSD files or source download URLs.
- Public previews must contain no unapproved UI, artwork, screenshots, or temporary imagery inside screens.
- Curate approximately 6–10 strong phone/laptop previews rather than publishing all 37 PSDs.
- Keep Awful Mockups separate from Awful 3D Mockups.
- Reuse the existing Moves Awful canvas runtime; do not add an animation dependency.
- Initial route remains unlisted and noindex.
- Future download action must not use `href="#"` or a fake URL.
- Temporary preview/contact-sheet files live only on `F:` or `D:` and are deleted after curation.
- Production remains untouched; work is isolated on one feature branch based on `dev`.

---

### Task 1: Add a truthful disabled resource action contract

**Files:**
- Modify: `src/types/content.ts`
- Modify: `src/components/composition/resource-links.ts`
- Test: `test/resource-links-disabled.test.mjs`

**Interfaces:**
- Consumes: existing `ResourceLinksData` rendering used by entity sections.
- Produces: `ResourceLinkData` as a discriminated active/pending union where pending links have no `href` and render non-interactively.

- [ ] **Step 1: Write the failing test**

Create `test/resource-links-disabled.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { renderResourceLinks } from "../src/components/composition/resource-links.ts";

test("pending resource actions render without navigation semantics", () => {
  const html = renderResourceLinks({
    text: "Скачивание",
    links: [{ label: "Скачать мокапы", state: "pending", statusLabel: "Скоро" }],
  });

  assert.match(html, /resource-row__action/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /Скачать мокапы/);
  assert.match(html, /Скоро/);
  assert.doesNotMatch(html, /href=/);
  assert.doesNotMatch(html, /download=/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --test test/resource-links-disabled.test.mjs
```

Expected: FAIL because `ResourceLinkData` and renderer do not support `state: "pending"`.

- [ ] **Step 3: Implement the minimal union and renderer**

Change `src/types/content.ts` so active links retain the current shape and pending actions cannot carry an href:

```ts
export interface ActiveResourceLinkData {
  label: string;
  href: string;
  state?: "active";
  rel?: string;
  target?: "_blank";
  download?: string;
}

export interface PendingResourceLinkData {
  label: string;
  state: "pending";
  statusLabel: string;
}

export type ResourceLinkData = ActiveResourceLinkData | PendingResourceLinkData;
```

Change `renderResourceLink`:

```ts
function renderResourceLink(link: ResourceLinkData): string {
  if (link.state === "pending") {
    return `<span class="resource-row__action" aria-disabled="true">${escapeHtml(link.label)} <span class="resource-row__status">${escapeHtml(link.statusLabel)}</span></span>`;
  }

  const target = link.target ? ` target="${escapeHtml(link.target)}"` : "";
  const rel = link.rel ? ` rel="${escapeHtml(link.rel)}"` : "";
  const download = link.download ? ` download="${escapeHtml(link.download)}"` : "";
  return `<a class="resource-row__action" href="${escapeHtml(link.href)}"${target}${rel}${download}>${escapeHtml(link.label)}</a>`;
}
```

- [ ] **Step 4: Run the focused test and existing fast tests**

```powershell
node --test test/resource-links-disabled.test.mjs
npm run test:fast
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/types/content.ts src/components/composition/resource-links.ts test/resource-links-disabled.test.mjs
git commit -m "feat: support pending resource actions"
```

---

### Task 2: Register Awful Mockups as a real project page

**Files:**
- Modify: `src/data/catalog/projects/other.ts`
- Modify: `src/site/pages/manifest.ts`
- Modify: `src/site/pages/entity-presentation.ts`
- Modify: `src/content/pages/index.ts`
- Create: `src/data/content/awful-mockups.ts`
- Create: `src/content/pages/projects/awful-mockups.ts`
- Test: `test/awful-mockups-project-page.test.mjs`
- Modify: `test/site-pages.test.mjs`

**Interfaces:**
- Consumes: existing `EntityPageContent`, `ProjectIntroData`, `SectionIntroData`, and SitePage contracts.
- Produces: canonical project id `awful-mockups`, route `project:awful-mockups`, and page registry entry.

- [ ] **Step 1: Write failing route/catalog/page tests**

Create `test/awful-mockups-project-page.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { entityPageContentRegistry } from "../src/content/pages/index.ts";
import { otherProjects } from "../src/data/catalog/projects/other.ts";
import { getEntityShellPresentation } from "../src/site/pages/entity-presentation.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Awful Mockups is a canonical unlisted project route", () => {
  const project = otherProjects.find((item) => item.id === "awful-mockups");
  assert.ok(project);

  const page = sitePages.find((item) => item.id === "project:awful-mockups");
  assert.ok(page);
  assert.equal(page.path, "/work/awful-mockups/");
  assert.equal(page.type, "project");
  assert.equal(page.entityId, "awful-mockups");
  assert.equal(page.enabled, true);
  assert.deepEqual(page.discovery, { listed: false, indexable: false });

  assert.ok(entityPageContentRegistry.get("project:awful-mockups"));

  const shell = getEntityShellPresentation("project:awful-mockups");
  assert.equal(shell.articleId, "project-awful-mockups");
  assert.equal(shell.navigationProject, false);
});
```

Add to `expectedRoutes` and `expectedEntities` in `test/site-pages.test.mjs`:

```js
["project:awful-mockups", "/work/awful-mockups/"],
```

and

```js
["project:awful-mockups", { type: "project", entityId: "awful-mockups" }],
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
node --test test/awful-mockups-project-page.test.mjs test/site-pages.test.mjs
```

Expected: FAIL because the project and route do not exist.

- [ ] **Step 3: Add the minimal project/page skeleton**

Add `awful-mockups` to `otherProjects`:

```ts
{
  id: "awful-mockups",
  name: "Awful Mockups",
  date: "2026",
  status: "active",
  collectionIds: ["pet-projects"],
  summary: "Набор редактируемых PSD-мокапов телефона и ноутбука.",
  engagementTypeIds: ["self-initiated"],
  primaryRoleId: "graphic-designer",
  roleIds: ["graphic-designer"],
},
```

Create initial content data with the approved copy and pending resource action:

```ts
export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "Дизайн и ретушь",
  period: "2026",
  summary: "Редактируемые PSD-мокапы телефона и ноутбука для презентации интерфейсов, айдентики и графики.",
  lead: "Сцены собраны так, чтобы устройство, экран, поверхности, фон и постобработка оставались управляемыми отдельно.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulMockupsResources = {
  text: "Исходные PSD будут опубликованы после финальной подготовки набора.",
  links: [{ label: "Скачать мокапы", state: "pending", statusLabel: "Скоро" }],
} as const satisfies ResourceLinksData;
```

Register a minimal content page containing the intro and resource section, then add it to `entityPageContents`.

Add the SitePage:

```ts
{
  id: "project:awful-mockups",
  type: "project",
  entityId: "awful-mockups",
  path: "/work/awful-mockups/",
  enabled: true,
  renderer: "entity",
  build: VITE_BUILD,
  discovery: { listed: false, indexable: false },
},
```

Add shell presentation:

```ts
["project:awful-mockups", {
  articleId: "project-awful-mockups",
  theme: "neutral",
  navigationProject: false,
}],
```

- [ ] **Step 4: Run focused tests and typecheck**

```powershell
node --test test/awful-mockups-project-page.test.mjs test/site-pages.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/catalog/projects/other.ts src/site/pages/manifest.ts src/site/pages/entity-presentation.ts src/content/pages/index.ts src/data/content/awful-mockups.ts src/content/pages/projects/awful-mockups.ts test/awful-mockups-project-page.test.mjs test/site-pages.test.mjs
git commit -m "feat: register Awful Mockups project page"
```

---

### Task 3: Export and curate neutral-screen web previews

**Files:**
- Source only: `F:\AWFUL_ASSETS\Photoshop\Mockups\AWFUL-Mockups-2026-09-17\PSD\*.psd`
- Temporary: `F:\AWFUL_ASSETS\Photoshop\Mockups\AWFUL-Mockups-2026-09-17\_preview-staging\`
- Create selected assets under: `public/media/projects/awful-mockups/`

**Interfaces:**
- Consumes: canonical PSD masters.
- Produces: 6–10 selected WebP preview masters with neutral/empty screens and stable descriptive filenames.

- [ ] **Step 1: Build a non-destructive contact-sheet export**

Use a temporary Python script in the staging directory, not the repo. For each candidate PSD:
- open via `psd_tools.PSDImage.open`;
- recursively hide layers named `SCREEN CONTENT`;
- preserve `SCREEN MASK`, `SCREEN SURFACE`, `SCREEN FILL`, and physically plausible empty-screen layers;
- render a max 1200 px preview;
- write `<source-number>-neutral.png` to staging.

Exclude persona-only PSDs 13, 14, and 15 from the initial contact sheet.

- [ ] **Step 2: Verify the staging export visually**

Generate one contact sheet from the staged PNGs and inspect it. Reject any preview containing:
- visible UI/artwork in a screen;
- broken mask/composite;
- obvious duplicate composition;
- device crop that makes the mockup unusable as a portfolio image.

Select 6–10 images spanning phone and laptop, light/dark/neutral/color backgrounds, and varied framing.

- [ ] **Step 3: Export selected web masters**

Convert selected neutral previews to WebP with max long edge 2200 px and quality 88 using Sharp/ImageMagick, using stable filenames such as:

```text
awful-mockups-phone-hand-neutral.webp
awful-mockups-phone-studio-dark.webp
awful-mockups-laptop-table-neutral.webp
awful-mockups-laptop-studio-light.webp
```

Names must describe the actual selected scene after visual inspection; do not use invented device/background labels.

- [ ] **Step 4: Copy only selected WebP assets into the repo**

Place only the chosen web previews in `public/media/projects/awful-mockups/`. Do not copy PSDs, contact sheets, staging PNGs, export scripts, or rejected candidates into the repo.

- [ ] **Step 5: Clean temporary staging after the selected WebP files are verified**

Delete `_preview-staging` only after:
- all selected WebP files open correctly;
- their dimensions are recorded;
- their repo copies exist;
- no later implementation step needs the contact sheet.

No source PSD is modified or deleted.

---

### Task 4: Register Awful Mockups media and build the final page composition

**Files:**
- Create: `src/data/media/assets/awful-mockups.ts`
- Create: `src/data/media/entries/awful-mockups.ts`
- Modify: `src/data/media/assets/registered.ts`
- Modify: `src/data/media/entries/index.ts`
- Modify: `src/data/content/awful-mockups.ts`
- Modify: `src/content/pages/projects/awful-mockups.ts`
- Generated/synced as required by existing tooling: media catalog and responsive derivatives
- Test: `test/awful-mockups-media.test.mjs`

**Interfaces:**
- Consumes: selected WebP preview files from Task 3.
- Produces: typed MediaAsset IDs, MediaEntry IDs owned by `awful-mockups`, static media blocks, and one Moves gallery.

- [ ] **Step 1: Write the failing media/content test**

Create `test/awful-mockups-media.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { awfulMockupsCanvasGallery, awfulMockupsMedia } from "../src/data/content/awful-mockups.ts";
import { getMediaEntry } from "../src/data/media/index.ts";

test("Awful Mockups page media is project-owned and feeds the Moves gallery", () => {
  assert.ok(awfulMockupsMedia.length >= 6);
  assert.ok(awfulMockupsMedia.length <= 10);
  assert.equal(awfulMockupsCanvasGallery.profile, "moves");
  assert.equal(awfulMockupsCanvasGallery.variant, "showcase-diagonal");

  const staticIds = awfulMockupsMedia.map((item) => item.entryId);
  const animatedIds = awfulMockupsCanvasGallery.items.map((item) => item.entryId);

  assert.deepEqual(animatedIds, staticIds);

  for (const entryId of staticIds) {
    const entry = getMediaEntry(entryId);
    assert.ok(entry.projectIds?.includes("awful-mockups"));
    assert.ok(entry.alt);
  }
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test test/awful-mockups-media.test.mjs
```

Expected: FAIL because media IDs/exports are not registered.

- [ ] **Step 3: Register selected assets and entries**

Follow the existing registered image pattern. Each asset contains actual `src`, `width`, and `height`. Each entry:
- uses a stable id ending in `-use-01`;
- has `projectIds: ["awful-mockups"]`;
- has concise alt text describing the physical device/scene;
- does not describe any screen UI.

Add the asset and entry arrays to their central registries.

- [ ] **Step 4: Drive both static and animated blocks from the same curated entries**

In `src/data/content/awful-mockups.ts`:

```ts
export const awfulMockupsMedia = [
  { entryId: "..." },
  { entryId: "..." },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];

export const awfulMockupsCanvasGallery = {
  profile: "moves",
  variant: "showcase-diagonal",
  id: "awful-mockups-gallery",
  className: "animated-canvas-gallery",
  items: awfulMockupsMedia.map(({ entryId }) => ({ entryId, title: "" })),
} as const satisfies AnimatedCanvasGalleryData<MediaEntryId>;
```

Compose the page using:
- a curated static section with existing media blocks/layout;
- a second section containing `{ type: "animated-canvas-gallery", data: awfulMockupsCanvasGallery }`;
- the pending download resources section.

Do not use `moves-canvas-demo`.

- [ ] **Step 5: Run media sync/checks and focused tests**

```powershell
npm run media:catalog:sync
npm run media:build
node --test test/awful-mockups-media.test.mjs test/awful-mockups-project-page.test.mjs
npm run test:media:contract
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add public/media/projects/awful-mockups src/data/media src/data/content/awful-mockups.ts src/content/pages/projects/awful-mockups.ts test/awful-mockups-media.test.mjs
git commit -m "feat: add Awful Mockups showcase media"
```

---

### Task 5: Activate the useful-project card only after page readiness

**Files:**
- Modify: `src/data/content/useful-projects.ts`
- Modify: `src/content/useful-projects.json`
- Modify: `src/content/editorial/useful-project-cards.json`
- Test: `test/awful-mockups-useful-card.test.mjs`

**Interfaces:**
- Consumes: live page route from Task 2.
- Produces: homepage/useful-project card pointing to the real route with state `live`.

- [ ] **Step 1: Write the failing card test**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  USEFUL_PROJECT_DEFINITIONS,
  usefulProjectsContent,
} from "../src/data/content/useful-projects.ts";

test("Awful Mockups useful card is live and targets the canonical project route", () => {
  const definition = USEFUL_PROJECT_DEFINITIONS.find((item) => item.id === "awful-mockups");
  assert.ok(definition);
  assert.equal(definition.href, "/work/awful-mockups/");

  const card = usefulProjectsContent.cards.find((item) => item.id === "awful-mockups");
  assert.ok(card);
  assert.equal(card.visible, true);
  assert.equal(card.state, "live");
  assert.notEqual(card.badge, "В разработке");
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test test/awful-mockups-useful-card.test.mjs
```

Expected: FAIL because href is missing and state is `coming-soon`.

- [ ] **Step 3: Activate the card**

Set:

```ts
{ id: "awful-mockups", href: "/work/awful-mockups/", coverEntryId: "useful-awful-mockups-cover-use-01" },
```

Change the JSON state to `"live"`. Remove or clear the development badge while preserving the approved description.

If the existing useful-project cover visibly contains unapproved screen content, replace only that cover asset with one selected neutral-screen preview and keep its existing stable asset/entry IDs.

- [ ] **Step 4: Run focused and fast tests**

```powershell
node --test test/awful-mockups-useful-card.test.mjs
npm run test:fast
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/content/useful-projects.ts src/content/useful-projects.json src/content/editorial/useful-project-cards.json public/media/projects/useful
git commit -m "feat: activate Awful Mockups project card"
```

---

### Task 6: Full verification, rendered QA, cleanup, and documentation

**Files:**
- No temporary scripts or screenshots committed.
- Update the spec/plan only if implementation materially differs from the approved contract.
- Optional final GitBook technical note only after code is verified.

**Interfaces:**
- Consumes: completed feature branch.
- Produces: verified branch with no staging debris and a documented implementation state.

- [ ] **Step 1: Run repository verification**

```powershell
npm run typecheck
npm run test:fast
npm run test:media:contract
npm run build
npm run test:e2e:projects
```

All commands must pass before calling the page ready.

- [ ] **Step 2: Run local rendered QA**

Start the dev server on the repository's normal Vite host and validate:

```text
/work/awful-mockups/ -> project intro -> static curated previews -> Moves showcase -> disabled download action
```

Check desktop and one mobile viewport. Verify:
- route/title/meaningful DOM;
- no framework overlay;
- no relevant console errors/warnings;
- all selected media load;
- no screen contains unapproved UI/artwork;
- no clipping/overlap;
- gallery respects reduced motion;
- disabled CTA has no navigation;
- the visual set is not dominated by green.

Use regular Playwright if the Browser plugin is unavailable, and record that fallback.

- [ ] **Step 3: Clean all temporary files**

Delete:
- `F:\AWFUL_ASSETS\Photoshop\Mockups\AWFUL-Mockups-2026-09-17\_preview-staging\`;
- temporary Playwright scripts/screenshots outside the repo after inspection;
- any failed export scratch files.

Keep:
- canonical PSD masters;
- selected web-ready repo assets;
- committed tests/code/spec/plan.

- [ ] **Step 4: Confirm Git hygiene**

```powershell
git status --short
git log --oneline --decorate -6
```

Expected: clean worktree, only intentional feature commits.

- [ ] **Step 5: Final documentation**

Record implementation status and final asset location in the repository docs. If GitBook is synchronized as project documentation, add a concise note pointing to:
- `/work/awful-mockups/`;
- canonical PSD source directory;
- web preview directory;
- future download-link configuration point.

Do not copy unfinished scratch notes or temporary export paths into GitBook.
