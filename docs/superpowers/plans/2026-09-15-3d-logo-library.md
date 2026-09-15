# 3D Logo Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable SVG-to-GLB logo pipeline matching the polished Jestei Pool Storybook viewer, then expose Jestei variants and every verified project/client vector logo in Storybook.

**Architecture:** Keep source SVGs canonical. A manifest maps source SVGs to output GLBs and material presets; Blender 5.2 LTS performs deterministic extrusion/bevel/material/export. A shared Storybook viewer consumes a catalog instead of one hard-coded Jestei model. Raster-backed SVG wrappers are never silently treated as vector geometry.

**Tech Stack:** Blender 5.2 LTS, glTF 2.0/GLB, Three.js 0.185.x, Storybook HTML/Vite, Node test runner.

**Spec:** User request in project chat, 2026-09-15.

## Global Constraints

- Preserve the current polished Jestei dark-chrome lighting/camera behavior as the neutral material reference.
- Jestei colorways: pear #B7E44A, orange #FF5A1F, blue #2357FF, biloba #C7A6FF.
- Colored Jestei uses plastic-like PBR, not chrome/metal.
- Neutral black/white/gray logos use the Jestei metallic treatment.
- Primary presentation surface is Storybook Model Viewer / media surface.
- Only claim SVG-based generation where the SVG contains actual vector geometry; raster-backed wrappers must be flagged/derived explicitly.

---

### Task 1: Canonical 3D logo catalog
**Files:** Create `src/lab/data/logo-3d-catalog.mjs`; Test `test/logo-3d-catalog.test.mjs`.
**Produces:** stable logo ids, family grouping, source/output URLs, material ids.
- [ ] Write failing catalog contract test.
- [ ] Run test and confirm missing-module failure.
- [ ] Implement minimal catalog.
- [ ] Run test green.
- [ ] Commit.

### Task 2: Deterministic Blender SVG-to-GLB generator
**Files:** Create `tools/logo-3d/generate-logo-3d.py`, `tools/logo-3d/logo-3d-manifest.json`; Test `test/logo-3d-generator-contract.test.mjs`.
**Produces:** repeatable GLBs normalized to consistent bounds/depth/materials.
- [ ] Write failing generator/manifest contract test.
- [ ] Implement import, cleanup, normalization, extrusion/bevel, PBR material, GLB export.
- [ ] Generate verified vector-backed targets.
- [ ] Inspect every GLB with glTF Transform.
- [ ] Commit.

### Task 3: Shared Storybook 3D logo viewer
**Files:** Replace/extend `src/lab/stories/model-viewer-jestei-logo.stories.js`; Test `test/logo-3d-storybook-contract.test.mjs`.
**Produces:** gallery/selectable stories using the same HDRI, camera fitting, wireframe, fit, fullscreen, disposal behavior.
- [ ] Write failing viewer contract test.
- [ ] Extract hard-coded Jestei model into catalog-driven viewer.
- [ ] Add Jestei color/material variants and verified client/project logos.
- [ ] Build Storybook.
- [ ] Commit.

### Task 4: Raster-wrapper recovery and provenance
**Files:** Update manifest/catalog and generated source derivatives only where vector recovery is reliable.
**Produces:** explicit status for Styx, Line, Progress Tradition, Mad Cow, MN and any other raster-backed `.svg` wrapper.
- [ ] Audit each wrapper.
- [ ] Prefer historical/original vector if present.
- [ ] Otherwise derive vector only when high-confidence monochrome tracing is possible and label provenance.
- [ ] Never silently substitute raster geometry.
- [ ] Commit.

### Task 5: Verification and delivery
**Files:** generated assets, tests, Storybook output as applicable.
- [ ] Run focused tests.
- [ ] Run `npm run lab:system` or equivalent Storybook build.
- [ ] Run `npm run typecheck` and relevant fast tests.
- [ ] Inspect generated GLBs and repository diff/growth.
- [ ] Push feature branch and open PR only after verification.
