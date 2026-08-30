# Production Tooling Pipeline Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make local dev/test/build and GitHub CI/CD substantially cheaper without changing site output, media policy, routes, content, CSS, breakpoints, or browser regression coverage.

**Architecture:** Keep Vite 8, the existing deterministic media builders, Playwright, Sharp, and GitHub Actions. Split orchestration into cheap local `media:ensure` versus deterministic `media:sync`, run build/typecheck/media stages once, share one preview/browser runtime across smoke suites, and make production test the exact sanitized `dist` that is uploaded.

**Tech Stack:** Node.js 24 core APIs, npm scripts, Vite 8, TypeScript, Playwright, Sharp, ffmpeg/ffprobe, GitHub Actions.

**Spec:** User-provided production pipeline optimization instruction in the 2026-08-30 conversation.

## Global Constraints

- No authored/user-facing copy, labels, credits, names, links, layout, CSS, breakpoint, animation, media presentation, responsive widths/quality, video encoding parameters, route, sitemap, metadata, robots, or CV policy changes.
- Vite 8 and the manifest-driven MPA architecture stay unchanged unless a regression proves otherwise.
- Zero new runtime dependencies; prefer zero new npm dependencies.
- Existing media builders remain the production source of truth and continue source/config hashing and output validation.
- Local `media:ensure` may use cheap stat-based state; `verify` and CI must run deterministic `media:sync`.
- No destructive git operations, dependency upgrades, force pushes, rebases, or production deployment from this feature branch.
- Existing individual E2E commands remain available and keep all existing routes, viewports, assertions, PageFlip fixtures, screenshots, and error handling.

---

### Task 1: Capture pipeline contracts and split npm stages

**Files:**
- Create: `test/tooling-pipeline.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `media:sync`, `media:ensure`, `build:vite`, `build:site`, `test:e2e:all`, `test:e2e:production` script contracts used by later tasks.
- `verify` must contain one `media:sync`, one `typecheck`, one `test:core`, one `build:site`, and one `test:e2e:all` path without calling self-preparing `test` or `build`.

- [ ] Write failing package contract tests proving current `dev` does not use `media:ensure`, current `verify` does not use `media:sync`/`test:e2e:all`, and typecheck is duplicated through `build:core`.
- [ ] Run the new test through PR CI and confirm failures are exactly the missing target contracts.
- [ ] Change scripts so standalone `test`/`build` remain fresh-environment safe while `verify` does deterministic media sync once and typechecks once.
- [ ] Re-run the contract test and full `test:core`.

### Task 2: Add fast local media state

**Files:**
- Create: `tools/media-dev-state.mjs`
- Create: `test/media-tools/media-dev-state.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore` comment only
- Optionally modify: `AGENTS.md` only to clarify full verify performs deterministic media sync.

**Interfaces:**
- `evaluateMediaDevState(options)` returns `{ fresh: boolean, reasons: string[], state?: object }` without running Sharp/ffmpeg.
- `writeMediaDevState(options)` writes `.cache/media/dev-state.json` atomically after successful sync.
- CLI supports `--ensure` and `--write`; stale `--ensure` spawns cross-platform `npm run media:sync` via `npm.cmd` on Windows and `npm` elsewhere.

- [ ] Write tmp-directory tests for missing/corrupt state, missing manifest/inventory/output, size/mtime changes, registry/config changes, fresh state, and failed-sync no-write behavior.
- [ ] Verify RED before implementation.
- [ ] Implement cheap fingerprint from normalized source path + size + mtimeMs, registry signature (`id/type/src/sourceSrc`), builder/policy/package-lock stats/content hashes for small config files, responsive manifest output existence/bytes, and video inventory generated-output existence/bytes.
- [ ] Wire `dev`, `test`, and `build` to `media:ensure`; wire `verify` to `media:sync`.
- [ ] Verify targeted media-state tests and full core tests.

### Task 3: Share one E2E preview/browser runtime

**Files:**
- Create: `tools/e2e/runtime.mjs`
- Create: `tools/e2e/run-all.mjs`
- Refactor: `tools/smoke-site.mjs`
- Refactor: `tools/smoke-site-navigation.mjs`
- Refactor: `tools/smoke-mpa.mjs`
- Refactor: `tools/smoke-project-pages.mjs`
- Refactor: `tools/smoke-cv.mjs`
- Modify: `package.json`
- Extend: `test/tooling-pipeline.test.mjs`

**Interfaces:**
- `withE2ERuntime(callback, options)` owns one strict-port Vite preview and one Chromium process with cleanup in `finally` and signal handling.
- Each smoke file exports `runSmoke*({ browser, baseUrl, ... })` and on direct execution creates its own shared runtime for backwards-compatible debugging.
- `runAllSmokeSuites({ browser, baseUrl, cvMode = "authored" })` invokes all five suites sequentially.

- [ ] Add static/tooling RED tests that imported suites do not spawn runtime at module load and that `test:e2e:all` exists.
- [ ] Implement shared runtime with `127.0.0.1:4173`, `--strictPort`, captured server output, wait loop, browser/server cleanup, and option/env overrides.
- [ ] Parameterize all same-origin and navigation checks with passed `baseUrl`; preserve PageFlip interception and every existing viewport/assertion.
- [ ] Add direct-execution wrappers using `withE2ERuntime`.
- [ ] Add sequential `run-all.mjs` and verify individual commands plus combined command.

### Task 4: Production CV mode and shared caption QA

**Files:**
- Refactor: `tools/smoke-cv.mjs`
- Refactor: `tools/capture-caption-qa.mjs`
- Create: `tools/e2e/run-production.mjs`
- Modify: `package.json`
- Add/extend tests under `test/` for CV authored/production mode.

**Interfaces:**
- `runSmokeCv({ browser, baseUrl, mode = "authored" })`; authored expects the current structured hidden count, production requires zero hidden experience cards, invalid mode throws.
- `captureCaptionQa({ browser, baseUrl, outputDir = "artifacts/caption-qa" })` preserves screenshot filenames/composition/freeze behavior and standalone execution.
- `run-production.mjs` shares one runtime for all smoke suites with `cvMode: "production"` plus caption QA.

- [ ] Write RED tests for authored/production/invalid CV modes and package production runner contract.
- [ ] Implement mode validation without changing authored CV source.
- [ ] Export caption capture and remove import-time runtime creation while preserving direct execution.
- [ ] Implement production runner and verify authored and sanitized production flows.

### Task 5: Deduplicate and reorder GitHub Actions

**Files:**
- Modify: `.github/workflows/verify-pr.yml`
- Modify: `.github/workflows/verify-dev.yml`
- Modify: `.github/workflows/lighthouse.yml`
- Modify: `.github/workflows/external-links.yml`
- Modify: `.github/workflows/verify-cv-branch.yml`
- Modify: `.github/workflows/verify-shootings-data-integration.yml`
- Delete or retain/trim after proof: `.github/workflows/verify-site-architecture.yml`
- Extend: `test/tooling-pipeline.test.mjs`

**Interfaces:**
- PR/dev workflows run cheap failures first, always restore generated derivative cache as a hint, always run deterministic `media:sync`, install browser after successful build, and invoke shared E2E once.
- Cache contains only `public/media/generated/responsive` and `public/media/generated/video`; tracked manifest/inventory/catalog are repository truth and never cached.
- Lighthouse retains manual/schedule triggers but no `push dev`.
- External links build HTML/content without media transcoding.

- [ ] Add RED text-contract tests for workflow invariants: no duplicate analytics test, late Chromium install, media builder always runs after cache restore, no Lighthouse dev trigger, no ffmpeg in external links, specialized branches retain their special guards/screenshots.
- [ ] Verify branch protection/rulesets before architecture-workflow removal; current baseline shows no required checks/rulesets, but re-read immediately before deletion.
- [ ] Rewrite workflows without changing workflow names/concurrency/permissions/status semantics.
- [ ] Keep shootings isolation as an intentional early fast guard even though `test:core` also covers it.
- [ ] Run real PR Actions and inspect timings/cache logs.

### Task 6: Test the final production artifact before deploy

**Files:**
- Modify: `.github/workflows/pages.yml`
- Extend: `test/tooling-pipeline.test.mjs`

**Interfaces:**
- Production order: status pending → checkout/setup/install/typecheck → cache restore → ffmpeg availability → `media:sync` → `test:core` → `build:site` → CV sanitation → Chromium → `test:e2e:production` → caption artifact → stamp/nojekyll → Pages artifact → deploy → bounded remote verification → report status.
- Remote deploy polling uses delays `(0 5 5 10 10 15 15 20 20 30 30 45 60)` and retains SHA/assets/CV contracts.

- [ ] Write RED workflow-contract tests proving production smoke currently runs before sanitation and polling is the current 60×10s loop.
- [ ] Reorder only tooling/deployment steps; preserve analytics env, permissions, Pages artifact, custom `github-pages/production` status, and remote semantics.
- [ ] Run production-simulation commands on feature branch without deploying production.

### Task 7: Documentation, measurements, and final verification

**Files:**
- Create: `docs/tooling-pipeline.md`
- Update: this plan/checklist with measured results if useful.

**Interfaces:**
- Documentation explains `npm run dev`, `npm run media:sync`, `npm run build`, `npm run verify`, and the difference between ensure/sync.

- [ ] Record before/after GitHub PR timings, media cache size/restore behavior, and locally measurable command timings where environment access permits; mark unavailable local benchmarks explicitly rather than inventing them.
- [ ] Verify cache hit still runs deterministic builders and reports unchanged outputs rather than regeneration.
- [ ] Run final full PR `Verify changes`, CodeQL, targeted workflow contract tests, and inspect complete diff for forbidden frontend/content/generated changes.
- [ ] Confirm no dependency/version changes and no unexpected generated tracked diffs.
- [ ] Request final code review; resolve actual findings through RED→GREEN when needed.
- [ ] Do not merge to `prod`; integration target is `dev` only after explicit final verification.