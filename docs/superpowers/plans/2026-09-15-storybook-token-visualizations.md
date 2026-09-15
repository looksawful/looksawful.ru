# Storybook Token Visualizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat Foundations token table with live, typed visualizations backed only by canonical CSS custom properties.

**Architecture:** Keep CSSOM collection in the existing Foundations story, resolve aliases with browser computed styles, dispatch token categories to focused DOM renderers, and style the Lab-only documentation surface in a colocated stylesheet. No canonical token data is duplicated.

**Tech Stack:** Storybook, browser CSSOM, vanilla JavaScript DOM APIs, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-15-storybook-token-visualizations-design.md`

## Global Constraints

- Storybook must not own duplicate token values.
- Changes remain Lab/Storybook-only.
- Existing component stories remain unchanged.
- Motion visualization must honor `prefers-reduced-motion`.
- `dev`, `prod`, CMS publication and production deployment semantics remain unchanged.

---

### Task 1: Token visualization contract

**Files:**
- Create: `test/storybook-foundations-visualizations.test.mjs`
- Modify: `src/lab/stories/foundations.stories.js`

**Interfaces:**
- Consumes: canonical CSS custom properties exposed through loaded stylesheets.
- Produces: `resolveTokenValue`, typed renderers, Overview/category stories, and Inspector.

- [x] **Step 1: Write the failing contract test**
- [x] **Step 2: Verify the old Foundations implementation does not satisfy the new renderer/story contract**
- [x] **Step 3: Implement CSSOM-backed alias resolution and typed visual renderers**
- [ ] **Step 4: Run Node contract test and confirm PASS in CI**
- [x] **Step 5: Commit the focused implementation**

### Task 2: Lab-only presentation

**Files:**
- Create: `src/lab/stories/foundations.css`
- Modify: `src/lab/stories/foundations.stories.js`

**Interfaces:**
- Consumes: semantic DOM/classes produced by Task 1.
- Produces: responsive cards, swatches, physical scale samples, specimens, shadow surfaces and reduced-motion-safe animation.

- [x] **Step 1: Add the Lab-only visualization stylesheet**
- [x] **Step 2: Import it only from Foundations**
- [ ] **Step 3: Build Storybook and verify generated design-system artifact**
- [ ] **Step 4: Run design-system inventory and local-link validation**
- [ ] **Step 5: Review CI/deployment evidence before merge**

### Task 3: Integration verification

**Files:**
- Verify only; no production files should change.

**Interfaces:**
- Consumes: normal Lab build pipeline.
- Produces: evidence that Storybook, inventory, links and private Lab deployment remain healthy.

- [ ] **Step 1: Run full PR/Lab CI**
- [ ] **Step 2: Confirm Storybook build succeeds**
- [ ] **Step 3: Confirm design-system inventory succeeds**
- [ ] **Step 4: Confirm local-link checks succeed**
- [ ] **Step 5: Merge only after all available gates are green**
