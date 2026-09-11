# Debug Lab Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the useful Lab debugging/design workflow on the current `prod` architecture, with complete internal page/component catalogs, strict read/debug boundaries, isolated build tooling and browser-verified parity with the old Lab.

**Architecture:** The new Lab lives under `src/devtools/lab/` with a tool entry at `tools/lab/index.html`. It derives pages from the canonical `sitePages` manifest, validates component coverage against executable component contracts, ports old Lab behavior as small modules, and never joins the public production build or CMS mutation path. The old `lab` branch is read-only migration evidence until parity is proven.

**Tech Stack:** TypeScript 7, Vite 8, Node 24 test runner, existing repository render/component contracts, Playwright for browser verification, GitHub Actions Fast CI/PR Preview.

**Spec:** `docs/superpowers/specs/2026-09-11-private-admin-lab-design.md`

## Global Constraints

- `prod` is the active working + production/source-of-truth branch.
- `dev` is archive-only and must not be used by this plan.
- old `lab` is a frozen migration source; never merge it wholesale.
- public visibility and Lab visibility are separate.
- Lab must include hidden/non-indexable pages and explicit WIP candidates.
- Lab must not mutate CMS/media state.
- production must not contain a privileged Lab debug bridge.
- Storybook is optional and cannot be a prerequisite for Lab start/build/test.
- public `npm run build:site` must remain independent from Lab build.
- every behavioral slice uses RED → GREEN → REFACTOR and ends in a focused commit.
- do not change user-facing site copy while implementing Lab.

---

## File Structure

### Existing files already in the current PR

- `src/devtools/lab/catalog.ts` — canonical page projection.
- `test/lab-catalog-contract.test.mjs` — page catalog characterization/contract tests.
- `tools/ci/run-tests.mjs` — Fast CI test routing.

### Files to create

- `src/devtools/lab/types.ts` — shared Lab-only types.
- `src/devtools/lab/component-catalog.ts` — component/organism debug metadata derived/validated against executable contracts.
- `src/devtools/lab/state.ts` — URL/state parsing and serialization.
- `src/devtools/lab/targets.ts` — trusted target catalog and capability policy.
- `src/devtools/lab/frame-tools.ts` — same-origin outline/grid/inspection behavior.
- `src/devtools/lab/scratch.ts` — ephemeral CSS scratch state/application.
- `src/devtools/lab/provenance.ts` — environment/branch/SHA/build metadata.
- `src/devtools/lab/entry.ts` — DOM orchestration only.
- `src/devtools/lab/lab.css` — Lab shell styles.
- `tools/lab/index.html` — Lab UI shell.
- `tools/run-lab.mjs` — local launcher without write-enabled Media Desk flags.
- `vite.lab.config.ts` — isolated Lab static build.
- `test/lab-lifecycle-contract.test.mjs` — page lifecycle/WIP rules.
- `test/lab-component-catalog.test.mjs` — component coverage/identity/source rules.
- `test/lab-state.test.mjs` — state parser/serializer.
- `test/lab-target-policy.test.mjs` — target trust/capability tests.
- `test/lab-frame-tools-contract.test.mjs` — read/debug-only frame helper contract.
- `test/lab-scratch.test.mjs` — scratch persistence/reset rules.
- `test/lab-build-isolation.test.mjs` — public build/Lab build separation.
- `tools/e2e/run-lab.mjs` — focused browser smoke runner.

### Files to modify

- `src/site/pages/types.ts` — optional WIP development metadata only; no route/discovery behavior change.
- `src/devtools/lab/catalog.ts` — lifecycle derivation.
- `package.json` — `lab`, `lab:build`, `test:e2e:lab` scripts.
- `tools/ci/run-tests.mjs` — include cheap Lab contracts in Fast CI.
- PR #735 body — keep verified slices/current commands accurate.

### Migration evidence only, never copied blindly

From old `lab` branch:

- `lab/index.html`
- `src/lab/index.ts`
- `src/lab/scratch.ts`
- `src/lab/lab.css`
- `src/lab/stories/*`

---

### Task 0: Execution isolation and baseline ledger

**Files:**
- No product files changed.
- Runtime ledger: `.superpowers/sdd/2026-09-11-debug-lab-core/progress.md` (git-ignored execution artifact).

**Interfaces:**
- Consumes: this plan + the linked spec.
- Produces: isolated execution workspace, baseline SHA, baseline test evidence.

- [ ] **Step 1: Verify isolation before implementation**

Run:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
git rev-parse --show-superproject-working-tree 2>/dev/null || true
git branch --show-current
git status --short
```

Expected: implementation is on `feature/admin-debug-lab` or an isolated worktree for that branch; never `prod`/`dev` directly.

- [ ] **Step 2: Record exact baseline**

Run:

```bash
git rev-parse HEAD
git merge-base HEAD origin/prod
```

Record both SHAs in the SDD ledger.

- [ ] **Step 3: Install exact dependencies**

Run:

```bash
npm ci
```

Expected: exit 0.

- [ ] **Step 4: Verify current baseline before next RED test**

Run:

```bash
npm run typecheck
npm run test:fast
npm run build:site
```

Expected: all exit 0. If baseline is red, stop implementation and debug the baseline rather than attributing it to the next task.

---

### Task 1: Preserve the completed canonical page catalog slice

**Status:** already implemented and verified on PR #735 before this plan was written.

**Files:**
- Existing: `src/devtools/lab/catalog.ts`
- Existing test: `test/lab-catalog-contract.test.mjs`
- Existing Fast CI routing: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces: `LAB_PAGE_CATALOG` keyed by canonical `sitePages` ids/paths.
- Later tasks consume: page lifecycle and Lab navigation metadata.

- [x] **Step 1: RED test proves missing Lab catalog fails**
- [x] **Step 2: Minimal page projection implemented**
- [x] **Step 3: Hidden/non-indexable pages remain Lab-visible**
- [x] **Step 4: Unique ids/paths contract added**
- [x] **Step 5: Fast CI + Dependency Review + CodeQL + PR Preview passed**

No rewrite is authorized here unless a later task exposes a concrete defect.

---

### Task 2: Add explicit LIVE / HIDDEN / WIP page lifecycle without duplicating routes

**Files:**
- Create: `src/devtools/lab/types.ts`
- Modify: `src/site/pages/types.ts`
- Modify: `src/devtools/lab/catalog.ts`
- Create test: `test/lab-lifecycle-contract.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces:

```ts
export type LabLifecycle = "live" | "hidden" | "wip";

export interface PageDevelopmentMetadata {
  status: "wip";
}

export function deriveLabPageLifecycle(input: {
  listed: boolean;
  indexable: boolean;
  developmentStatus?: "wip";
}): LabLifecycle;
```

- `SitePageDefinition` gains optional `development?: PageDevelopmentMetadata` only. No existing route/discovery field changes.

- [ ] **Step 1: Write failing lifecycle tests**

Test exact rules:

```js
assert.equal(deriveLabPageLifecycle({ listed: true, indexable: true }), "live");
assert.equal(deriveLabPageLifecycle({ listed: false, indexable: false }), "hidden");
assert.equal(
  deriveLabPageLifecycle({ listed: false, indexable: false, developmentStatus: "wip" }),
  "wip",
);
```

Also assert every current `sitePages` entry still maps to a Lab entry and no existing public discovery flag changes.

- [ ] **Step 2: Run focused test and confirm RED for missing type/function**

Run:

```bash
node --test test/lab-lifecycle-contract.test.mjs
```

Expected: FAIL because the lifecycle helper/metadata does not exist yet.

- [ ] **Step 3: Implement minimal lifecycle type/helper**

Implement precedence exactly:

```ts
if (developmentStatus === "wip") return "wip";
if (!listed || !indexable) return "hidden";
return "live";
```

Do not add a second route list or separate WIP registry.

- [ ] **Step 4: Project lifecycle into `LAB_PAGE_CATALOG`**

Replace the current binary visibility derivation with `deriveLabPageLifecycle(...)` while keeping `labVisible: true`.

- [ ] **Step 5: Run focused + existing page tests**

```bash
node --test test/lab-lifecycle-contract.test.mjs test/lab-catalog-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/site/pages/types.ts src/devtools/lab/types.ts src/devtools/lab/catalog.ts test/lab-lifecycle-contract.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: add Lab page lifecycle contract"
```

---

### Task 3: Build the internal component/organism catalog with executable coverage checks

**Files:**
- Create: `src/devtools/lab/component-catalog.ts`
- Create test: `test/lab-component-catalog.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Consumes: `CONTENT_BLOCK_TYPES` from `src/content/contracts/content-block.ts`.
- Produces:

```ts
export type LabComponentClass = "generic" | "specialized" | "runtime";
export type LabPreviewKind = "content-block" | "page-context" | "runtime-state";

export interface LabComponentCatalogEntry {
  id: string;
  label: string;
  class: LabComponentClass;
  lifecycle: LabLifecycle;
  source: string;
  previewKind: LabPreviewKind;
  labVisible: true;
}

export const LAB_COMPONENT_CATALOG: readonly LabComponentCatalogEntry[];
```

Required content-block ids are the exact current `CONTENT_BLOCK_TYPES` values:

```text
code-block
media-figure
media-group
media-slider
mockup
mockup-deck
justified-gallery
before-after
page-flip
animated-canvas-gallery
jestei-theme
awful-cases-game
```

Required standalone/internal entries at this implementation baseline:

```text
hero
site-navigation
project-navigator
entity-intro
home-expertise
home-experience
contact-footer
media-lightbox
berserk-audio-player
jestei-track-filter
moves-canvas-demo
```

`berserk-audio-player` is mandatory even when its public consumer is hidden.

- [ ] **Step 1: Write RED coverage/uniqueness tests**

Tests assert:

```js
for (const blockType of CONTENT_BLOCK_TYPES) {
  assert.ok(LAB_COMPONENT_CATALOG.some((entry) => entry.id === blockType));
}
assert.equal(new Set(ids).size, ids.length);
assert.ok(LAB_COMPONENT_CATALOG.find((entry) => entry.id === "berserk-audio-player"));
assert.ok(LAB_COMPONENT_CATALOG.every((entry) => entry.labVisible === true));
```

Also validate `source` is repository-relative and does not contain `..`, URL schemes or backslashes.

- [ ] **Step 2: Run focused test and confirm RED**

```bash
node --test test/lab-component-catalog.test.mjs
```

Expected: FAIL because catalog module does not exist.

- [ ] **Step 3: Implement minimal catalog**

Use `CONTENT_BLOCK_TYPES.map(...)` for typed block membership rather than copying that list. Add standalone/internal entries as explicit debug metadata with exact source owners.

Minimum source mapping:

```text
berserk-audio-player -> src/components/berserk-audio-player.ts
jestei-track-filter  -> src/components/specialized/jestei-track-filter-canonical.ts
moves-canvas-demo    -> src/components/specialized/moves-canvas-demo.ts
home-expertise       -> src/components/expertise.ts
home-experience      -> src/components/experience.ts
media-lightbox       -> src/components/media-lightbox.ts
```

For content blocks, source ownership points to the canonical renderer/component family, not old Storybook stories.

- [ ] **Step 4: Add lifecycle/classification metadata**

Classify typed generic/shared blocks as `generic`, project-local blocks/runtime as `specialized`, non-visual engines only if surfaced for debug state as `runtime`. Mark hidden/WIP only when current repository evidence requires it; do not mark something WIP merely because it is specialized.

- [ ] **Step 5: Run tests/typecheck**

```bash
node --test test/lab-component-catalog.test.mjs
npm run typecheck
npm run test:fast
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/devtools/lab/component-catalog.ts test/lab-component-catalog.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: add Lab component catalog"
```

---

### Task 4: Extract deterministic Lab state parsing/serialization

**Files:**
- Create: `src/devtools/lab/state.ts`
- Create test: `test/lab-state.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**

```ts
export type ViewportPreset = "fit" | "desktop" | "tablet" | "mobile";
export type StageBackground = "checker" | "light" | "dark";

export interface LabState {
  route: string;
  preset: ViewportPreset;
  width: number;
  height: number;
  background: StageBackground;
  outline: boolean;
  grid: boolean;
  inspect: boolean;
  targetId: string;
}

export const LAB_VIEWPORT_PRESETS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
} as const;

export function parseLabState(search: string): LabState;
export function serializeLabState(state: LabState): string;
export function sanitizeLabRoute(value: string): string;
```

Dimension bounds remain exactly old-Lab-compatible: width `240..3840`, height `320..2400`.

- [ ] **Step 1: Write failing parser tests**

Cover defaults, preset dimensions, clamping, invalid numbers, invalid preset/background, boolean flags, route normalization and round-trip serialization.

Security assertion:

```js
assert.equal(sanitizeLabRoute("https://evil.example/x"), "/");
assert.equal(sanitizeLabRoute("javascript:alert(1)"), "/");
```

- [ ] **Step 2: Verify RED**

```bash
node --test test/lab-state.test.mjs
```

- [ ] **Step 3: Implement minimal pure functions**

No DOM access and no `localStorage` in this module.

- [ ] **Step 4: Verify focused + Fast CI**

```bash
node --test test/lab-state.test.mjs
npm run test:fast
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/devtools/lab/state.ts test/lab-state.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: add deterministic Lab state"
```

---

### Task 5: Define trusted target catalog and capability policy

**Files:**
- Create: `src/devtools/lab/targets.ts`
- Create test: `test/lab-target-policy.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**

```ts
export type LabTargetKind = "local" | "preview" | "production";

export interface LabTarget {
  id: string;
  label: string;
  kind: LabTargetKind;
  origin: string;
}

export interface LabTargetCapabilities {
  visual: true;
  inspectDom: boolean;
  injectScratchCss: boolean;
  privilegedBridge: false;
}

export function createLabTargets(input: {
  currentOrigin: string;
  previewOrigin?: string;
}): readonly LabTarget[];

export function getLabTargetCapabilities(target: LabTarget, shellOrigin: string): LabTargetCapabilities;
```

Rules:

- local/current same-origin target: `inspectDom=true`, `injectScratchCss=true`;
- cross-origin preview: visual only until a separately reviewed bridge exists;
- production `https://www.looksawful.ru`: visual only unless shell itself is same-origin local dev;
- `privilegedBridge` is hard-coded false in this plan;
- user-entered arbitrary origins are not accepted as targets.

- [ ] **Step 1: Write RED policy tests**

Assert production/cross-origin preview never gain inspect/scratch merely because the Admin user is authenticated.

- [ ] **Step 2: Verify RED**

```bash
node --test test/lab-target-policy.test.mjs
```

- [ ] **Step 3: Implement target factory/policy**

Normalize origins with `new URL(...).origin`; reject non-HTTP(S) and invalid URLs.

- [ ] **Step 4: Verify**

```bash
node --test test/lab-target-policy.test.mjs
npm run typecheck
npm run test:fast
```

- [ ] **Step 5: Commit**

```bash
git add src/devtools/lab/targets.ts test/lab-target-policy.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: add Lab target capability policy"
```

---

### Task 6: Port same-origin outline/grid/inspector as read-only frame tools

**Files:**
- Create: `src/devtools/lab/frame-tools.ts`
- Create test: `test/lab-frame-tools-contract.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**

```ts
export interface FrameDebugState {
  outline: boolean;
  grid: boolean;
  inspect: boolean;
}

export interface InspectedElementSummary {
  selector: string;
  size: string;
  display: string;
  position: string;
  font: string;
  color: string;
  background: string;
}

export function canAccessFrameDocument(frame: HTMLIFrameElement, shellOrigin: string): boolean;
export function applyFrameDebugStyles(doc: Document, state: FrameDebugState): void;
export function createElementSelector(element: Element): string;
export function summarizeElement(element: HTMLElement): InspectedElementSummary;
```

Contract: this module reads DOM/computed styles and injects only Lab-owned debug `<style>` elements. It contains no fetch/XHR/CMS/publication code.

- [ ] **Step 1: Write contract tests before browser behavior**

Static contract test rejects forbidden strings/imports in this module:

```text
/__media-desk/
fetch(
XMLHttpRequest
writeFile
publish
delete
```

Also test selector construction using a minimal DOM/browser fixture where supported by current test infrastructure; if pure Node cannot provide DOM, keep selector behavioral verification in Task 10 Playwright and keep this task's Node test focused on source/security contract.

- [ ] **Step 2: Verify RED**

```bash
node --test test/lab-frame-tools-contract.test.mjs
```

- [ ] **Step 3: Port minimal old behavior**

Use old `src/lab/index.ts` only as behavioral reference. Preserve style ids in a Lab-specific namespace; do not depend on old branch imports.

- [ ] **Step 4: Verify typecheck/contracts**

```bash
node --test test/lab-frame-tools-contract.test.mjs
npm run typecheck
npm run test:fast
```

- [ ] **Step 5: Commit**

```bash
git add src/devtools/lab/frame-tools.ts test/lab-frame-tools-contract.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: port read-only Lab frame tools"
```

---

### Task 7: Port ephemeral CSS scratchpad with explicit reset semantics

**Files:**
- Create: `src/devtools/lab/scratch.ts`
- Create test: `test/lab-scratch.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**

```ts
export const LAB_SCRATCH_STORAGE_KEY = "looksawful:lab:scratch-css:v2";
export const LAB_SCRATCH_STYLE_ID = "looksawful-lab-scratch-style";

export function readScratchCss(storage: Pick<Storage, "getItem">): string;
export function writeScratchCss(storage: Pick<Storage, "setItem" | "removeItem">, value: string): void;
export function applyScratchCss(doc: Document, value: string): void;
export function resetScratchCss(doc: Document, storage: Pick<Storage, "removeItem">): void;
```

Scratch CSS is ephemeral tooling state only. Reset removes stored value and removes/empties the Lab-owned style. It never writes source files.

- [ ] **Step 1: RED tests for storage/reset behavior**

Test empty value removes storage; non-empty value stores exact text; reset cannot affect non-Lab `<style>` nodes.

- [ ] **Step 2: Verify RED**

```bash
node --test test/lab-scratch.test.mjs
```

- [ ] **Step 3: Implement minimal functions**

Do not migrate old `v1` localStorage content automatically. A clean v2 namespace prevents stale overrides from silently affecting the rebuilt Lab.

- [ ] **Step 4: Verify**

```bash
node --test test/lab-scratch.test.mjs
npm run typecheck
npm run test:fast
```

- [ ] **Step 5: Commit**

```bash
git add src/devtools/lab/scratch.ts test/lab-scratch.test.mjs tools/ci/run-tests.mjs
git commit -m "feat: add isolated Lab CSS scratchpad"
```

---

### Task 8: Build provenance contract before building the UI shell

**Files:**
- Create: `src/devtools/lab/provenance.ts`
- Extend: `test/lab-state.test.mjs` or create `test/lab-provenance.test.mjs`
- Modify: `tools/ci/run-tests.mjs` if a new test file is created.

**Interfaces:**

```ts
export interface LabProvenance {
  environment: "local" | "preview" | "admin";
  branch: string;
  commit: string;
  buildTime: string;
}

export function readLabProvenance(env: Record<string, string | undefined>): LabProvenance;
```

Environment variable names used by launcher/CI:

```text
VITE_LAB_ENV
VITE_LAB_BRANCH
VITE_LAB_COMMIT
VITE_LAB_BUILD_TIME
```

Fallbacks are visible, never silently blank:

```text
environment=local
branch=unknown
commit=unknown
buildTime=unknown
```

- [ ] **Step 1: RED tests for exact values/fallbacks**
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement pure provenance reader**
- [ ] **Step 4: Run test/typecheck**
- [ ] **Step 5: Commit `feat: add Lab provenance contract`**

---

### Task 9: Build the new Lab shell from the modular contracts

**Files:**
- Create: `tools/lab/index.html`
- Create: `src/devtools/lab/entry.ts`
- Create: `src/devtools/lab/lab.css`
- Create: `tools/run-lab.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: page catalog, component catalog, state, targets, frame tools, scratch, provenance.
- Produces: local `/tools/lab/` UI and `npm run lab` launcher.

Required `package.json` scripts:

```json
{
  "lab": "node tools/run-lab.mjs",
  "lab:build": "vite build --config vite.lab.config.ts",
  "test:e2e:lab": "node tools/e2e/run-lab.mjs"
}
```

`tools/run-lab.mjs` must spawn Vite opening `/tools/lab/` and must **not** set `CONTENT_DESK_WRITE=1` or `VITE_CONTENT_DESK_WRITE=1`.

- [ ] **Step 1: Create HTML shell with stable data hooks**

Required regions/hooks:

```text
data-lab-shell
data-page-catalog
data-component-catalog
data-target-select
data-route-input
data-preview-frame
data-stage
data-width
data-height
data-debug-outline
data-debug-grid
data-debug-inspect
data-scratch-css
data-provenance
```

Set `<meta name="robots" content="noindex,nofollow,noarchive">`.

- [ ] **Step 2: Port CSS shell deliberately**

Port useful layout/visual behavior from old `src/lab/lab.css`, but import it from `src/devtools/lab/lab.css`; no old branch path survives.

- [ ] **Step 3: Implement `entry.ts` as orchestration only**

Responsibilities:

```text
render page/component catalogs
bind controls
update LabState
select trusted target
set iframe URL = target origin + sanitized route
apply frame tools only when capabilities permit
apply scratch only when capabilities permit
render provenance/status
```

Do not place lifecycle derivation, origin trust rules, selector generation or storage implementation in `entry.ts`.

- [ ] **Step 4: Preserve keyboard shortcuts**

Exact baseline:

```text
1 = desktop
2 = tablet
3 = mobile
f = fit
r = reload
i = toggle inspect when capability allows
```

Ignore shortcuts while focus is in input/textarea/select or contenteditable.

- [ ] **Step 5: Verify local launch manually once**

Run:

```bash
npm run lab -- --host 127.0.0.1
```

Expected: `/tools/lab/` loads; no Media Desk write endpoint is enabled merely by starting Lab.

- [ ] **Step 6: Run typecheck/Fast CI**

```bash
npm run typecheck
npm run test:fast
```

- [ ] **Step 7: Commit**

```bash
git add tools/lab/index.html src/devtools/lab/entry.ts src/devtools/lab/lab.css tools/run-lab.mjs package.json
git commit -m "feat: rebuild Lab shell on prod architecture"
```

---

### Task 10: Isolate Lab build from production build

**Files:**
- Create: `vite.lab.config.ts`
- Create: `test/lab-build-isolation.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces: `npm run lab:build` → `dist/lab-admin/` (or exact outDir set by config).
- Public `npm run build:site` input set remains unchanged.

Required `vite.lab.config.ts` behavior:

```ts
build: {
  outDir: "dist/lab-admin",
  emptyOutDir: true,
  rollupOptions: {
    input: resolve(root, "tools/lab/index.html"),
  },
}
```

Do not call `createSiteInputs(root)` in this config.

- [ ] **Step 1: RED isolation test**

Assert source/build config contract:

- public `vite.config.ts` does not add `tools/lab/index.html` as production input;
- Lab config input is exactly `tools/lab/index.html`;
- Lab outDir differs from public `dist` root used for deployment;
- Lab config does not install/run Storybook.

- [ ] **Step 2: Verify RED before config exists**

```bash
node --test test/lab-build-isolation.test.mjs
```

- [ ] **Step 3: Add minimal Vite Lab config**
- [ ] **Step 4: Build both products**

```bash
npm run build:site
npm run lab:build
```

Expected: both succeed independently.

- [ ] **Step 5: Run contract tests/typecheck**

```bash
node --test test/lab-build-isolation.test.mjs
npm run typecheck
npm run test:fast
```

- [ ] **Step 6: Commit**

```bash
git add vite.lab.config.ts test/lab-build-isolation.test.mjs tools/ci/run-tests.mjs package.json
git commit -m "build: isolate Lab from production site"
```

---

### Task 11: Browser/E2E parity tests for the useful old Lab behaviors

**Files:**
- Create: `tools/e2e/run-lab.mjs`
- Modify: `package.json`
- Optional evidence output only under existing ignored test-artifact location; do not commit screenshots unless repository policy explicitly requires them.

**Interfaces:**
- Consumes: local Vite Lab server.
- Produces: one focused Playwright smoke gate.

- [ ] **Step 1: Start Lab server from the E2E runner on an available loopback port**

Reuse existing repository E2E process/port conventions instead of inventing a global daemon.

- [ ] **Step 2: Verify catalog behavior**

Browser assertions:

```text
page catalog includes /work/awful-cases/ and other hidden/non-indexable canonical pages
component catalog includes berserk-audio-player
hidden items are visibly labelled hidden
```

- [ ] **Step 3: Verify viewport behavior**

Assert buttons `1`, `2`, `3` result in `1440×1000`, `834×1112`, `390×844`; custom dimensions clamp to contract limits; `f` returns to fit mode.

- [ ] **Step 4: Verify route/open/reload/copy-safe behavior**

Navigate to `/work/jestei-pool/`, ensure iframe reaches candidate route, reload works, and route input cannot navigate to `javascript:` or an arbitrary external origin.

- [ ] **Step 5: Verify debug tools on same-origin local target**

Toggle outline/grid; enable inspect; click a stable element; assert inspector summary becomes non-empty; copy-selector button becomes enabled.

- [ ] **Step 6: Verify scratch CSS apply/reset**

Apply a benign visible override to a stable selector, assert computed style changes, click reset, assert original computed style returns and v2 storage entry is removed.

- [ ] **Step 7: Verify cross-origin/production capability downgrade**

Switch to production target; assert inspect/scratch controls are disabled or explicitly unavailable and no script attempts privileged DOM access.

- [ ] **Step 8: Verify provenance and browser health**

Assert environment/branch/commit fields are visible. Fail the test on uncaught page errors and unexpected console errors.

- [ ] **Step 9: Run at three Lab shell viewport sizes**

```text
1440×1000
834×1112
390×844
```

The Lab shell itself must remain operable; the preview viewport controls are separate from browser viewport size.

- [ ] **Step 10: Run command**

```bash
npm run test:e2e:lab
```

Expected: PASS, no uncaught errors.

- [ ] **Step 11: Commit**

```bash
git add tools/e2e/run-lab.mjs package.json
git commit -m "test: cover Lab browser workflows"
```

---

### Task 12: Old-Lab parity matrix and dead-path guard

**Files:**
- Create: `docs/lab.md`
- Create or extend test: `test/lab-build-isolation.test.mjs`

**Interfaces:**
- Produces: one operational document that states what was preserved, intentionally changed and deferred to Admin auth.

`docs/lab.md` must contain an explicit parity table with these rows:

```text
route switcher
reload
open target
copy view link
fit viewport
desktop/tablet/mobile presets
custom dimensions
checker/light/dark canvas
outline
page grid
inspect element
computed style summary
copy selector
keyboard shortcuts
CSS scratch apply
CSS scratch copy
CSS scratch reset
page catalog
component/organism catalog
build provenance
Storybook optionality
CMS mutation boundary
```

Each row gets one of exactly:

```text
PRESERVED
REPLACED
DEFERRED-TO-AUTH-PLAN
```

No `TODO`/`TBD` cells.

- [ ] **Step 1: Write parity document from verified implementation evidence**
- [ ] **Step 2: Add dead-path assertions**

Ensure new Lab runtime/build does not import:

```text
src/lab/
tools/lab/build-storybook.mjs
Cloudflare Access / Zero Trust helpers
CONTENT_DESK_WRITE
```

- [ ] **Step 3: Run tests**

```bash
node --test test/lab-build-isolation.test.mjs
npm run test:fast
```

- [ ] **Step 4: Commit**

```bash
git add docs/lab.md test/lab-build-isolation.test.mjs
git commit -m "docs: document rebuilt Lab operations"
```

---

### Task 13: Full verification and review gate

**Files:**
- No new feature behavior.
- Update PR #735 description/checklist only after evidence is available.

**Interfaces:**
- Produces: review-ready Lab core branch; does not merge it.

- [ ] **Step 1: Run complete relevant verification**

```bash
npm run typecheck
npm run test:fast
npm run build:site
npm run lab:build
npm run test:e2e:lab
```

Expected: all exit 0.

- [ ] **Step 2: Run repository checks already required by Fast CI**

Do not substitute local confidence for GitHub Actions. Push exact head and wait for:

```text
Fast CI
Dependency Review
CodeQL
PR Preview
```

All must be green on the same head SHA.

- [ ] **Step 3: Review diff for scope**

Run:

```bash
git diff origin/prod...HEAD --stat
git diff origin/prod...HEAD -- src/devtools/lab tools/lab vite.lab.config.ts package.json test docs/lab.md
```

Reject unrelated site copy/CMS/media changes.

- [ ] **Step 4: Verify old Lab remains untouched**

No force update/delete of `lab` branch and no deletion of its deployment artifacts in this plan.

- [ ] **Step 5: Update PR #735 body with exact evidence**

Record:

```text
head SHA
commands run
CI runs
preserved features
known deferred item: remote Admin authentication
```

- [ ] **Step 6: Run final code review**

Use Superpowers requesting-code-review on the entire `origin/prod...HEAD` diff. Fix load-bearing findings, rerun affected verification, then perform one scoped re-review.

- [ ] **Step 7: Stop before merge**

Merging PR #735 is a shared-branch side effect and requires an explicit release/merge decision after review.

---

## Post-Lab Work Packages

These are intentionally separate implementation plans because they are independent subsystems with different security/failure modes.

### Package B — Private Admin GitHub OAuth/session

Spec authority: `docs/superpowers/specs/2026-09-11-private-admin-lab-design.md`.

Sequence after Lab core is green:

1. Cloudflare Worker/static-assets Admin shell;
2. `/auth/github/login` with signed OAuth state;
3. `/auth/github/callback` server-side code exchange;
4. verify GitHub owner identity;
5. signed expiring `HttpOnly; Secure; SameSite=Strict` session;
6. `/auth/logout`;
7. auth middleware protecting `/lab` and later `/media`;
8. security-header and tamper/expiry tests;
9. deployment preflight using existing Cloudflare credentials;
10. bind `admin.looksawful.ru` only after auth gate passes.

Secrets already expected from repository configuration:

```text
ADMIN_GITHUB_CLIENT_ID
ADMIN_GITHUB_CLIENT_SECRET
ADMIN_SESSION_SECRET
```

No additional secret is invented until implementation proves one is necessary.

### Package C — Media Desk → CMS consolidation

Starts only after a fresh contract audit of current `prod` Media Desk/CMS behavior.

First mandatory slices:

```text
opening Desk causes zero writes/sync side effects
read-only catalog/search/filter/details through canonical service
revision-aware metadata mutation
usages-before-delete
upload/replace through service
safe delete
bulk semantics
server-side Admin authorization
```

The current write-enabled `npm run desk` behavior is not copied into remote Admin unchanged.

### Package D — PR Preview/Admin deployment normalization

Keep candidate PR Preview ephemeral and SHA-scoped. Remove only obsolete persistent Lab deployment infrastructure after the new authenticated Admin Lab proves functional parity. `dev` remains visible as archive but absent from active workflow.

---

## Plan Self-Review

### Spec coverage

- hidden/internal pages: Task 1/2/11
- WIP pages: Task 2
- organisms including Berserk: Task 3/11
- old Lab controls: Tasks 4/6/7/9/11
- provenance: Task 8/11
- target security: Tasks 5/6/11
- no CMS mutation: Tasks 6/9/12
- Storybook non-critical: Tasks 10/12
- production build isolation: Task 10/13
- old Lab retained until parity: Task 12/13
- browser verification: Task 11
- final CI/review: Task 13

### Placeholder scan

The plan contains no `TBD`, implementation `TODO`, or unspecified error-handling steps. Deferred Admin auth and Media Desk work are explicitly separate work packages rather than missing steps inside this Lab plan.

### Interface consistency

- `LabLifecycle` is defined once in `types.ts` and consumed by page/component catalogs.
- `LabState` owns UI serializable state; `entry.ts` orchestrates it without reimplementing parsing.
- `LabTargetCapabilities` is the single authority for inspect/scratch availability.
- `frame-tools.ts` and `scratch.ts` operate only when capability policy permits.
- `vite.lab.config.ts` is separate from public site inputs.

## Execution Method

Preferred: **Superpowers subagent-driven-development** with one fresh implementer per task, task-level spec/quality review, and a final whole-branch review. Tasks 2–8 are small enough to review independently; Tasks 9–11 are integration/browser tasks and should use stronger models/reviewers.

Do not execute multiple tasks that touch the same file concurrently. In particular, tasks modifying `tools/ci/run-tests.mjs`, `package.json` or the Lab catalog must remain sequential even if worker agents are available.
