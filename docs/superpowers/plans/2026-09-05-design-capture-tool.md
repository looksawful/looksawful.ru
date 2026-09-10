# Manual Design Capture Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repository-owned, local-only Playwright screenshot capture utility for design documentation, with canonical page viewports and separate component breakpoint captures.

**Architecture:** A standalone `tools/design-capture/` CLI owns safety guards, route discovery, breakpoint discovery, Playwright runtime, captures, and manifest generation. It reuses the repository's existing Playwright devDependency, writes only to ignored `_local/design-capture/`, and is referenced only by explicit manual npm scripts and documentation.

**Tech Stack:** Node.js 24 ESM, Playwright 1.61.x, Vite 8, built-in Node APIs.

**Spec:** `docs/superpowers/specs/2026-09-05-design-capture-tool-design.md`

## Global Constraints

- Never import this tool from `src/` or any client entry.
- Never invoke it from build, test, verify, deploy, or GitHub Actions flows.
- Refuse execution under `CI=true` or `GITHUB_ACTIONS=true`.
- Require interactive confirmation, or explicit `--manual` for a directly instructed non-interactive run.
- Write captures only below `_local/design-capture/`.
- Reuse existing Playwright; add no runtime/client dependency.
- Canonical page viewports are desktop 1440×1000, tablet 834×1112, mobile 390×844.
- Component breakpoint captures are separate from the canonical page pass and use before/after widths around each breakpoint.

---

### Task 1: Safety, discovery, and self-check

**Files:**
- Create: `tools/design-capture/safety.mjs`
- Create: `tools/design-capture/discover-pages.mjs`
- Create: `tools/design-capture/discover-breakpoints.mjs`
- Create: `tools/design-capture/selfcheck.mjs`

**Interfaces:**
- Produces: `assertManualCaptureAllowed(env)`, `requiresInteractiveConfirmation({manual, isTTY})`, `discoverPageRoutes({rootDir, exclusions})`, `extractMediaBreakpoints(cssText)`, `breakpointSides(px)`.

- [ ] **Step 1: Write self-check assertions first** for CI rejection, manual/TTY policy, route mapping, CSS media-query breakpoint parsing, and breakpoint ±1 output.
- [ ] **Step 2: Run** `node tools/design-capture/selfcheck.mjs` and verify it fails because implementation modules do not yet exist.
- [ ] **Step 3: Implement pure helpers** with no Playwright or Vite side effects.
- [ ] **Step 4: Re-run** `node tools/design-capture/selfcheck.mjs` and verify all checks pass.
- [ ] **Step 5: Commit** the self-check and pure helper modules.

### Task 2: Configuration and manifest model

**Files:**
- Create: `tools/design-capture/config.mjs`
- Create: `tools/design-capture/manifest.mjs`
- Extend: `tools/design-capture/selfcheck.mjs`

**Interfaces:**
- Produces: `PAGE_VIEWPORTS`, `COMPONENTS`, `OUTPUT_ROOT`, `createManifest()`, `addCapture()`, `addWarning()`, `writeManifest()`.

- [ ] **Step 1: Extend self-check** to assert exact canonical viewport dimensions, output root isolation, unique component names, and manifest record shape.
- [ ] **Step 2: Run self-check** and verify expected failures.
- [ ] **Step 3: Implement config and manifest helpers** using only built-in Node APIs.
- [ ] **Step 4: Re-run self-check** and verify pass.
- [ ] **Step 5: Commit** configuration/manifest work.

### Task 3: Dedicated local runtime

**Files:**
- Create: `tools/design-capture/runtime.mjs`
- Extend: `tools/design-capture/selfcheck.mjs`

**Interfaces:**
- Produces: `withDesignCaptureRuntime(callback, options)` and deterministic page-settle helpers used by capture modules.

- [ ] **Step 1: Add self-checks** for host restriction, invalid port rejection, and deterministic style payload generation.
- [ ] **Step 2: Run self-check** and verify failures.
- [ ] **Step 3: Implement loopback-only Vite spawn, Playwright Chromium launch, cleanup, reduced-motion context, font/image settle, and animation suppression.**
- [ ] **Step 4: Re-run self-check** and verify pure/runtime validation checks pass without taking screenshots.
- [ ] **Step 5: Commit** runtime.

### Task 4: Page capture pass

**Files:**
- Create: `tools/design-capture/capture-pages.mjs`
- Extend: `tools/design-capture/selfcheck.mjs`

**Interfaces:**
- Consumes: page routes, runtime browser/base URL, canonical viewports, manifest.
- Produces: viewport and full-page PNGs under `pages/<viewport>/` plus manifest entries.

- [ ] **Step 1: Add self-checks** for deterministic page slug/file naming.
- [ ] **Step 2: Run self-check** and verify failure.
- [ ] **Step 3: Implement page capture** with fatal navigation errors, stable filenames, and page-level manifest records.
- [ ] **Step 4: Re-run self-check** and verify pass.
- [ ] **Step 5: Commit** page capture.

### Task 5: Component breakpoint capture pass

**Files:**
- Create: `tools/design-capture/capture-components.mjs`
- Extend: `tools/design-capture/selfcheck.mjs`

**Interfaces:**
- Consumes: configured components, explicit/discovered breakpoints, runtime browser/base URL, manifest.
- Produces: element screenshots under `components/<name>/<breakpoint>/<instance>/` at breakpoint-1 and breakpoint+1 widths.

- [ ] **Step 1: Add self-checks** for breakpoint merge/dedupe/order and component output naming.
- [ ] **Step 2: Run self-check** and verify failure.
- [ ] **Step 3: Implement stylesheet-hint scanning, explicit breakpoint merging, multi-instance capture, optional state callbacks, and warning-on-missing optional components.**
- [ ] **Step 4: Re-run self-check** and verify pass.
- [ ] **Step 5: Commit** component capture.

### Task 6: CLI, package scripts, ignore rules, and documentation

**Files:**
- Create: `tools/design-capture/cli.mjs`
- Create: `tools/design-capture/README.md`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `AGENTS.md`

**Interfaces:**
- Produces manual commands `design:capture`, `design:capture:pages`, `design:capture:components`, `design:capture:selfcheck`.

- [ ] **Step 1: Extend self-check** for CLI mode parsing and guard behavior.
- [ ] **Step 2: Run self-check** and verify failure.
- [ ] **Step 3: Implement CLI orchestration** with confirmation, timestamp output dir, runtime startup, selected passes, and final output summary.
- [ ] **Step 4: Add package scripts and documentation**, plus explicit `_local/design-capture/` ignore and agent rules.
- [ ] **Step 5: Run** `node tools/design-capture/selfcheck.mjs` and inspect package/workflow references to ensure no accidental integration.
- [ ] **Step 6: Commit** CLI and docs.

### Task 7: Integration review and PR

**Files:**
- Review all files changed on `tool/design-capture`.

- [ ] **Step 1: Compare** `dev...tool/design-capture` and verify only design-capture code/docs/package/ignore/agent guidance changed.
- [ ] **Step 2: Verify** no `.github/workflows/**`, `src/**`, client dependency, build script, or normal test runner references the capture tool.
- [ ] **Step 3: Run self-check** in a real local checkout if available; if the editing environment has no runnable checkout, record this limitation explicitly.
- [ ] **Step 4: Open PR to `dev`** with manual local screenshot smoke listed as the only remaining environment-specific verification when necessary.