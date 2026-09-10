# Private Lab + PR Preview Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cloudflare Lab and all PR previews private through Access while adding a Storybook-based, source-of-truth design-system browser inside Lab.

**Architecture:** Keep one Direct Upload Cloudflare Pages project and one canonical product codebase. Cloudflare Access owns authentication; Storybook is a static Lab-only viewer over canonical components/styles; generated inventory exposes documentation coverage without creating a second component registry.

**Tech Stack:** Vite 8, TypeScript 7, Cloudflare Pages Direct Upload/Wrangler, Cloudflare Access, Storybook 10.6.0, `@storybook/html-vite` 10.6.0, `@storybook/addon-a11y` 10.6.0, `storybook-design-token` 5.0.0, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-10-private-lab-preview-design-system-design.md`

## Global Constraints

- Production `prod` and `www.looksawful.ru` must not be changed by Lab infrastructure.
- No custom application auth database, password storage, or login UI.
- No duplicate production component implementations for Storybook.
- Atomic Design is documentation metadata, not a production directory migration.
- Storybook and inventory are Lab-only build outputs.
- PR previews stay product-only and receive Cloudflare Access protection without Storybook build cost.
- CI machine auth comes only from `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` GitHub Actions secrets.
- Never print or upload a service-token secret.
- Existing production analytics remain disabled in preview builds.
- Existing noindex behavior remains mandatory.

---

### Task 1: Record privacy and design-system contracts

**Files:**
- Create: `docs/superpowers/specs/2026-09-10-private-lab-preview-design-system-design.md`
- Create: `docs/superpowers/plans/2026-09-10-private-lab-preview-design-system.md`
- Modify: `docs/LAB.md`
- Modify: `.agents/skills/looksawful-design-lab/SKILL.md`

**Interfaces:**
- Consumes: existing Lab branch/deploy topology.
- Produces: explicit security and Storybook ownership rules used by later tasks.

- [ ] **Step 1: Add the approved design spec and this implementation plan.**
- [ ] **Step 2: Update Lab documentation with `/lab/system/`, Access human auth, CI service auth, and the no-duplicate-source rule.**
- [ ] **Step 3: Update the Lab agent skill so future agents treat Storybook as a viewer and never promote Lab-only infrastructure to `dev`.**
- [ ] **Step 4: Run the existing Lab contract in CI after the first implementation commit.**

### Task 2: Add a deterministic design-system inventory

**Files:**
- Create: `tools/lab/design-system-inventory.mjs`
- Create: `test/lab-design-system-inventory.test.mjs`
- Modify: `test/lab-workspace-contract.test.mjs`

**Interfaces:**
- Consumes: filesystem paths `src/components`, `src/styles`, `src/templates`, and Storybook story files.
- Produces: `dist/lab/system-inventory.json` and `dist/lab/system/inventory.html` during Lab build.

- [ ] **Step 1: Write a temporary RED test for deterministic inventory classification.**

The test must create an isolated fixture tree with one component, one stylesheet, one template and one story and assert that the generator returns sorted normalized records and marks the matching component documented.

- [ ] **Step 2: Implement `collectDesignSystemInventory(root)` and `writeDesignSystemInventory({ root, outDir })`.**

The generator must:

```js
export async function collectDesignSystemInventory(root) {
  // return {
  //   generatedAt: null,
  //   components: [{ path, kind: "component", storyPaths, documented }],
  //   styles: [{ path, kind: "style" }],
  //   templates: [{ path, kind: "template" }],
  //   stories: [{ path, kind: "story" }]
  // }
}
```

`generatedAt` is deliberately `null` so unchanged source produces unchanged generated data.

- [ ] **Step 3: Generate a small static `inventory.html` that reads the adjacent JSON and renders counts plus documented/undocumented component rows using `textContent`, not `innerHTML`.**
- [ ] **Step 4: Run the focused test in CI and verify deterministic output.**
- [ ] **Step 5: Classify the test. Keep only the deterministic inventory contract; delete any development-only fixture experiments.**

### Task 3: Add Storybook as a Lab-only viewer

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `src/lab/stories/foundations.stories.ts`
- Create: `src/lab/stories/code-block.stories.ts`
- Create: `src/lab/stories/before-after.stories.ts`
- Create: `tools/lab/build-storybook.mjs`
- Modify: `package.json`
- Modify: `lab/index.html`
- Modify: `src/lab/index.ts`
- Modify: `src/lab/lab.css`
- Modify: `test/lab-workspace-contract.test.mjs`

**Interfaces:**
- Consumes: canonical site CSS/components directly; pinned ephemeral Storybook tool versions.
- Produces: static Storybook at `dist/lab/system/` and links from `/lab/`.

- [ ] **Step 1: Extend the Lab contract test so it fails until Storybook config, pinned versions, and `/lab/system/` wiring exist.**
- [ ] **Step 2: Add Storybook 10.6.0 HTML/Vite configuration and only the a11y + design-token addons.**
- [ ] **Step 3: Keep dependencies Lab-only without editing the production dependency graph.**

`tools/lab/build-storybook.mjs` must install exact temporary dev tooling using:

```bash
npm install --no-save --package-lock=false --ignore-scripts \
  storybook@10.6.0 \
  @storybook/html-vite@10.6.0 \
  @storybook/addon-a11y@10.6.0 \
  storybook-design-token@5.0.0
```

Then execute the local Storybook binary with `build --output-dir dist/lab/system --quiet`. This avoids a lockfile/dependency change on a Lab-only viewer while keeping CI versions deterministic. If Storybook packages later become production development infrastructure, dependency promotion is a separate explicit decision.

- [ ] **Step 4: Import canonical site styles from Storybook preview configuration. Do not duplicate token values.**
- [ ] **Step 5: Add initial stories only for unambiguous canonical owners: Foundations, Code Block, Before/After.**
- [ ] **Step 6: Add `system` and `inventory` navigation controls to the existing Lab shell without creating a new router.**
- [ ] **Step 7: Build Storybook and inventory after `npm run build:site`, before Cloudflare media packaging.**
- [ ] **Step 8: Verify `/lab/system/index.html` and `/lab/system/inventory.html` exist in the generated artifact.**

### Task 4: Prepare Cloudflare Access bootstrap and CI service authentication

**Files:**
- Create: `tools/preview/cloudflare-access-status.mjs`
- Create: `test/preview-access-contract.test.mjs`
- Modify: `.github/workflows/lab-preview.yml`
- Modify: `.github/workflows/pr-preview.yml` on the dedicated preview-security branch that targets `dev`

**Interfaces:**
- Consumes: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, optional `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` from GitHub Actions secrets.
- Produces: privacy-status report; authenticated curl and Playwright access after Cloudflare account setup.

- [ ] **Step 1: Write a permanent workflow-contract test that asserts no service secret literal exists and that both Access headers source values only from GitHub Actions secrets.**
- [ ] **Step 2: Add an Access status probe using Cloudflare API endpoints. The probe reports capability/status only; it must not create a service token because its secret could be exposed to workflow logs.**
- [ ] **Step 3: Change remote HTTP checks to use a helper that adds service-token headers when both secrets are present.**
- [ ] **Step 4: Change Playwright remote QA to create a browser context with the same two extra HTTP headers.**
- [ ] **Step 5: Add an anonymous-denial verification after deployment. It succeeds only when anonymous content is not served; redirects to the Cloudflare Access login flow and HTTP 401/403 are accepted.**
- [ ] **Step 6: Do not weaken existing exact-SHA/noindex/media checks; run those with service credentials.**
- [ ] **Step 7: Create a clean branch from `dev` containing only the PR-preview security workflow/helper/test changes and open a reviewable PR to `dev`. Do not copy Lab Storybook infrastructure into `dev`.**

### Task 5: Integrate Storybook and inventory into Lab deploy

**Files:**
- Modify: `.github/workflows/lab-preview.yml`
- Modify: `docs/LAB.md`

**Interfaces:**
- Consumes: Storybook builder and inventory generator from Tasks 2–3.
- Produces: one Cloudflare Lab artifact containing product preview, workbench, Storybook and inventory.

- [ ] **Step 1: Add `Build Lab design system` after `Build Lab without production analytics`.**
- [ ] **Step 2: Run the inventory generator after Storybook so it can classify actual story files and write inventory inside Storybook output.**
- [ ] **Step 3: Extend the deployment preflight to assert both generated pages exist.**
- [ ] **Step 4: Preserve the current 20,000-file and 25-MiB Cloudflare Pages limits.**
- [ ] **Step 5: Preserve exact SHA stamping and `X-Robots-Tag: noindex`.**

### Task 6: Verify and report account-level blockers

**Files:**
- No product files.
- Update only docs if actual Cloudflare state differs from the spec.

**Interfaces:**
- Consumes: current Cloudflare dashboard/API evidence and GitHub Actions runs.
- Produces: exact owner checklist for remaining account-level actions.

- [ ] **Step 1: Verify the final Lab head with TypeScript, fast tests, Lab contract, Storybook build, inventory, Cloudflare deploy and security checks.**
- [ ] **Step 2: Verify the preview-security PR exact SHA through existing CI.**
- [ ] **Step 3: Inspect Cloudflare Access capability. If the current API token lacks `Access: Apps and Policies Write` or `Access: Service Tokens Write`, do not attempt destructive retries.**
- [ ] **Step 4: Report the smallest remaining manual Cloudflare/GitHub-secret actions as numbered click paths with exact field names.**
- [ ] **Step 5: Final test classification report must include `NEW PERMANENT TESTS`, `TEMPORARY TESTS REMOVED`, and `MOVED TO AFFECTED/FULL` counts.**
