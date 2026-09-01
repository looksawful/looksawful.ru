# WAVE 1 Safe Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Pages CMS publication fail closed so only explicit CMS-owned content/media/generated changes can prepare a `dev -> prod` publication PR, while the authorization workflow and classifier execute from trusted `prod`.

**Architecture:** Keep `tools/ci/change-scope.mjs` unchanged for regression selection. Add a separate deterministic `tools/cms-publication-scope.mjs` for publication authorization; dispatch `pages-cms-publish.yml` from `prod`, validate CMS source `dev`, validate workflow execution `prod`, validate linear branch topology, classify `prod...dev`, and only then reuse/create the publication PR.

**Tech Stack:** Node.js ESM, `node:test`, GitHub Actions YAML, Pages CMS YAML, existing TypeScript/content/media contracts.

**Spec:** User-approved WAVE 1 implementation instruction in the 2026-09-01 conversation; canonical repository architecture remains documented in `AGENTS.md`, `.pages.yml`, `docs/cms-content-map.md`, `docs/site-operations.md`, and current tests.

## Global Constraints

- Do not change public UI, CSS, layout, DOM, animations, authored copy, media ordering, routes, renderers, Three.js, GSAP, Canvas/WebGL runtime.
- Do not touch PR #71 or `hotfix/jestei-landings-trim-23s`.
- Do not rewrite the existing CMS generator, Case contracts, Media Catalog, or `tools/ci/change-scope.mjs` semantics.
- `.pages.yml`, `.github/**`, `tools/**`, tests, docs, package files and unknown paths are never CMS-publishable.
- Unknown publication scope fails closed.
- Unpublished `dev` must not be able to expand its own publication permissions.

---

### Task 1: Publication classifier contract

**Files:**
- Create: `test/cms-publication-scope.test.mjs`
- Create: `tools/cms-publication-scope.mjs`

**Interfaces:**
- Produces: `classifyCmsPublicationPath(path)` and `classifyCmsPublicationFiles(files)`.
- Classifications: `CMS_CONTENT`, `CMS_MEDIA`, `CMS_GENERATED`, `ENGINEERING`, `UNKNOWN`.

- [ ] Write failing tests for allowed CMS content, uploads, project covers, exact generated outputs, known engineering surfaces, unknown paths, mixed diffs, path normalization, duplicate/empty inputs.
- [ ] Run the focused test and verify RED because the classifier module does not exist.
- [ ] Implement the minimal explicit path policy and deterministic result/diagnostics.
- [ ] Run focused tests and verify GREEN.

### Task 2: Trusted publication workflow and topology gate

**Files:**
- Modify: `.pages.yml`
- Modify: `.github/workflows/pages-cms-publish.yml`
- Modify or extend: existing workflow/CMS regression test(s), preferably `test/ci-pipeline.test.mjs` and/or an existing CMS test.

**Interfaces:**
- Pages CMS content source remains `dev`.
- Publication workflow executes from `prod`.
- Workflow checks `prod == dev` -> successful no-op; otherwise requires `prod` to be an ancestor of `dev`; then classifies `prod...dev` before any PR lookup/creation.

- [ ] Add failing wiring tests asserting `ref: prod`, source `dev`, workflow ref `prod`, topology check, classifier invocation before PR operations, and engineering self-files blocked by classifier.
- [ ] Verify RED against current `ref: current` workflow.
- [ ] Change `.pages.yml` publication action to trusted `ref: prod`.
- [ ] Update workflow to checkout trusted `prod`, fetch `dev`, validate topology, collect changed files, execute trusted classifier, write actionable Step Summary, then reuse/create PR only after authorization passes.
- [ ] Verify workflow wiring tests GREEN.

### Task 3: Preserve existing CMS/Case/Media contracts

**Files:**
- No production rewrites expected.
- Tests only if an uncovered regression is found.

- [ ] Run `npm run cms:check` and generator determinism checks available in the current suite.
- [ ] Run existing strict Case tests including Jestei ownership leakage coverage.
- [ ] Run existing Media Catalog contract tests including unknown fields/taxonomy rejection.
- [ ] Do not alter existing architecture unless a real failing contract requires it.

### Task 4: Current architecture documentation

**Files:**
- Create: `docs/cms-architecture.md`
- Modify: `docs/cms-roadmap.md`
- Modify: `docs/cms-content-map.md`
- Modify: `docs/site-operations.md`

- [ ] Document DOMAIN / EDITORIAL / PRESENTATION / ARCHITECTURE / GENERATED ownership and current source-of-truth table.
- [ ] Document trusted publication policy and branch topology rules.
- [ ] Mark `cms-roadmap.md` historical rather than a competing current architecture.
- [ ] Correct only stale claims in `cms-content-map.md`, preserving useful inventory.
- [ ] Update operations docs for Pages CMS on `dev` + trusted workflow from `prod` + fail-closed classifier.

### Task 5: Verification and rollout readiness

- [ ] Run `git diff --check` equivalent through PR diff review.
- [ ] Run/confirm `npm run typecheck`.
- [ ] Run/confirm `npm run cms:check`.
- [ ] Run/confirm `npm run test:fast`.
- [ ] Run/confirm `npm run test:media:contract`.
- [ ] Run/confirm `npm run build:site`.
- [ ] Run the current architecture-wide verification workflow through GitHub Actions on the WAVE 1 PR.
- [ ] Confirm public copy/layout/routes/animations/media are unchanged by file scope and diff review.
- [ ] Re-read branch/ruleset protection. If mutation is unavailable, report `PENDING EXTERNAL CONFIGURATION` and the exact required GitHub settings.
- [ ] Do not merge WAVE 1 to `dev` or `prod` unless the user explicitly requests integration; the new publication trust boundary only becomes active once the same policy reaches trusted `prod` through the normal engineering release path.
