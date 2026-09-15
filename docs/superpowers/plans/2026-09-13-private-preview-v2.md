# Private Preview V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, private, exact-SHA preview system around the existing development flow without changing the roles of `dev` or `prod`.

**Architecture:** Build candidate artifacts without deployment secrets, deploy them through trusted code from `dev`, put a trusted authentication layer in front of every preview route, then add feature-aware QA, CMS-triggered snapshots, generated Lab integration and garbage collection. The legacy PR Preview remains available until V2 has proven parity on active work and one normal release cycle.

**Tech Stack:** GitHub Actions, Node.js 24, Vite 8, Playwright, Cloudflare Pages/Pages Functions, TypeScript/ESM.

**Spec:** `docs/superpowers/specs/2026-09-13-private-preview-v2-design.md`

## Global Constraints

- `dev` remains the default stable working branch.
- `prod` remains the protected production branch and production deploy source.
- Do not change production workflow semantics as part of Preview V2.
- `lab` is experimental integration only and never a release source.
- Existing Private Lab/Admin UI remains separate from the `lab` branch.
- Candidate jobs must not receive Cloudflare or preview-auth secrets.
- Privileged deployment code must come from trusted `dev`, not candidate source.
- All preview paths and static assets require authentication.
- Missing authentication configuration fails closed.
- CMS write-mode loopback and branch restrictions remain unchanged.
- No Cloudflare Access/Zero Trust, Yandex Cloud, database, KV, R2 or paid dependency is required.
- Existing active feature branches must not be rebased/retargeted solely for this migration.

---

### Task 1: Preview V2 contract tests

**Files:**
- Create: `test/preview-v2-workflow.test.mjs`
- Create: `test/preview-security-contract.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Consumes: existing workflow/test conventions.
- Produces: failing tests that define candidate/deploy isolation, trusted route ownership, fail-closed auth and unchanged production boundary.

- [ ] Write a failing workflow-contract test requiring candidate build to have no Cloudflare/auth secrets and requiring deployment to be separately trusted.
- [ ] Write a failing security-contract test requiring rejection of candidate `_worker.js`, `_routes.json` and `functions/` and requiring auth coverage of `/*`.
- [ ] Add both tests to the fast test inventory.
- [ ] Open/update the draft PR and verify the new tests fail for missing V2 implementation, not syntax errors.
- [ ] Commit as `test: define private preview v2 contracts`.

### Task 2: Candidate metadata and artifact guard

**Files:**
- Create: `tools/preview/preview-metadata.mjs`
- Create: `tools/preview/validate-candidate-artifact.mjs`
- Create: `test/preview-metadata.test.mjs`
- Create: `test/preview-artifact-guard.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Produces: `parsePreviewMetadata(value)`, `validatePreviewArtifact({ distDir })`.

- [ ] Add failing tests for accepted/rejected preview kinds, exact 40-character SHA, safe preview keys and optional numeric PR.
- [ ] Add failing tests for forbidden `_worker.js`, `_routes.json`, `functions/`, symbolic links and special files.
- [ ] Implement the minimal metadata parser/validator.
- [ ] Implement artifact validation without executing candidate files.
- [ ] Run fast tests and keep existing PR preview tests green.
- [ ] Commit as `feat: add preview v2 artifact validation`.

### Task 3: Manual-only V2 candidate workflow

**Files:**
- Create: `.github/workflows/preview-v2-build.yml`
- Modify: `test/preview-v2-workflow.test.mjs`

**Interfaces:**
- Inputs: `target_sha`, `preview_kind`, `preview_key`, optional `pr_number`.
- Output artifact: `preview-v2-<key>-<sha>` with `dist/preview-metadata.json`.

- [ ] Extend failing workflow tests for `workflow_dispatch`, exact SHA checkout, Node 24, media cache, typecheck, fast tests, `build:site`, preview media packaging and artifact upload.
- [ ] Implement build workflow with `contents: read` only.
- [ ] Ensure no deployment/auth secrets are referenced in the build job.
- [ ] Verify current legacy `.github/workflows/pr-preview.yml` is unchanged.
- [ ] Commit as `ci: add unprivileged preview v2 build`.

### Task 4: Trusted preview runtime core

**Files:**
- Create: `tools/preview/runtime/auth.ts`
- Create: `tools/preview/runtime/functions/_middleware.ts`
- Create: `tools/preview/runtime/functions/__preview/login.ts`
- Create: `tools/preview/runtime/functions/__preview/logout.ts`
- Create: `tools/preview/runtime/functions/__preview/ci-session.ts`
- Create: `test/preview-auth-runtime.test.mjs`
- Modify: `tools/ci/run-tests.mjs`

**Interfaces:**
- Session cookie: `__Host-preview_session`.
- Runtime env: `PREVIEW_PASSWORD_HASH`, `PREVIEW_SESSION_SECRET`, `PREVIEW_CI_TOKEN_HASH`.

- [ ] Write failing unit tests for fail-closed missing configuration, invalid password, expired/tampered session, origin mismatch, CI bearer mismatch and trusted security headers.
- [ ] Implement constant-time comparisons and HMAC-SHA256 signed sessions with Web Crypto.
- [ ] Implement login/logout/CI-session endpoints and middleware.
- [ ] Ensure password/token plaintext is never serialized to logs, cookies or HTML.
- [ ] Commit as `feat: add trusted private preview authentication`.

### Task 5: Trusted runtime assembly

**Files:**
- Create: `tools/preview/assemble-trusted-runtime.mjs`
- Create: `test/preview-runtime-assembly.test.mjs`

**Interfaces:**
- Consumes validated candidate `dist` plus trusted `tools/preview/runtime`.
- Produces deployable directory with trusted `_routes.json` covering `/*`.

- [ ] Write failing tests proving candidate runtime files are rejected and trusted `_routes.json` is generated.
- [ ] Implement assembly without importing/executing candidate JS.
- [ ] Ensure generated security runtime comes only from trusted repository checkout.
- [ ] Commit as `feat: assemble trusted preview runtime`.

### Task 6: Oversized media remains private

**Files:**
- Modify: `tools/preview/prepare-cloudflare-pages.mjs`
- Create: `tools/preview/runtime/media-proxy.ts`
- Modify: `tools/preview/runtime/functions/_middleware.ts`
- Modify: `test/pr-preview-media-packaging.test.mjs`
- Create: `test/preview-media-proxy.test.mjs`

**Interfaces:**
- Manifest records exact-SHA upstream source but no browser redirect.
- Proxy supports GET, HEAD and Range semantics after auth.

- [ ] Change tests first so tracked oversized media expects a manifest/proxy record instead of a 302 redirect.
- [ ] Watch the existing implementation fail the new expectation.
- [ ] Implement private upstream manifest handling.
- [ ] Implement authenticated server-side media proxy preserving content/range headers.
- [ ] Keep generated video surrogate behavior unchanged.
- [ ] Commit as `fix: keep oversized preview media private`.

### Task 7: Privileged manual-only deployment workflow

**Files:**
- Create: `.github/workflows/preview-v2-deploy.yml`
- Modify: `test/preview-v2-workflow.test.mjs`

**Interfaces:**
- Trigger: successful trusted `workflow_run` from V2 build.
- Environment: `preview-deploy`.
- Existing secrets reused: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
- New runtime secrets are read from Cloudflare runtime bindings, not candidate code.

- [ ] Add failing tests requiring trusted checkout, artifact validation, trusted runtime assembly and absence of candidate `npm`/Node execution after credentials are available.
- [ ] Implement trusted workflow-run deployment path.
- [ ] Verify exact preview identity only after CI obtains an authenticated session.
- [ ] Keep V2 manual-only until secrets are provisioned and runtime checks pass.
- [ ] Commit as `ci: add trusted private preview v2 deployment`.

### Task 8: Authenticated remote QA and screenshots

**Files:**
- Create: `tools/e2e/preview/authenticate.mjs`
- Create: `tools/e2e/preview/run-preview.mjs`
- Create: `tools/e2e/preview/profiles/baseline.mjs`
- Create: `tools/e2e/preview/profiles/venus.mjs`
- Create: `tools/e2e/preview/profiles/gallery.mjs`
- Modify: `.github/workflows/preview-v2-deploy.yml`

**Interfaces:**
- CI exchanges `PREVIEW_CI_TOKEN` for a short-lived HttpOnly preview session.
- Baseline always runs; feature profiles are additive.

- [ ] Add failing tests for profile selection and required Venus route/interactions.
- [ ] Implement CI authentication helper.
- [ ] Wrap current `runProductionE2E` as baseline rather than rewriting its existing checks.
- [ ] Implement Venus desktop/mobile visibility, decoded image and Contact Hub activation checks.
- [ ] Implement Gallery desktop/mobile render/lightbox checks from verified current route/selectors.
- [ ] Save desktop/mobile screenshots as workflow artifacts.
- [ ] Commit as `test: add authenticated feature-aware preview qa`.

### Task 9: Shadow migration on current active work

**Files:**
- Documentation/status only unless a defect is discovered.

- [ ] Run manual V2 previews for current Venus, Gallery, AWFUL STUDIO/Pet Projects and one ordinary PR using their existing exact SHAs.
- [ ] Compare V2 output against legacy preview without rebasing or retargeting those branches.
- [ ] Record any parity defects as separate issues or fixes in this branch.
- [ ] Do not disable legacy preview.

### Task 10: Lab audit and generated Lab composer

**Files:**
- Create: `tools/preview/compose-lab.mjs`
- Create: `test/preview-lab-compose.test.mjs`
- Create: `.github/workflows/lab-compose.yml`
- Modify: `docs/preview.md`

**Interfaces:**
- Source: current `dev` plus same-repository open PRs explicitly selected for Lab.
- Failure: conflicts leave current remote `lab` unchanged.

- [ ] Audit current `lab` unique commits/files before enabling generated behavior.
- [ ] Preserve unique unfinished work in proper feature branches.
- [ ] Write failing deterministic-order/conflict tests.
- [ ] Implement composer.
- [ ] Keep `lab -> dev` and `lab -> prod` out of workflow permissions and docs.
- [ ] Commit as `ci: make lab a generated integration preview` only after audit is complete.

### Task 11: CMS Preview broker

**Files:**
- Create: `tools/content-desk-preview-server.mjs`
- Create: `src/devtools/media-desk/preview-controller.ts`
- Create: `test/content-desk-preview-policy.test.mjs`
- Modify: `tools/run-content-desk.mjs`
- Modify relevant Media Desk UI files only where needed for `PREVIEW` status/control.

**Interfaces:**
- Broker binds to `127.0.0.1` only.
- Stable base defaults to `origin/dev`.
- Temporary refs use `cms-preview/<random-id>`.

- [ ] Write failing tests preserving all current Content Desk write gates.
- [ ] Add tests proving broker refuses non-loopback exposure and only stages CMS-authorized paths.
- [ ] Implement temporary worktree/snapshot creation using local Git credentials only.
- [ ] Keep Cloudflare credentials out of browser and broker.
- [ ] Add PREVIEW lifecycle status in Media Desk without changing authored site copy.
- [ ] Commit as `feat: add private cms preview snapshots`.

### Task 12: Preview lifecycle and garbage collection

**Files:**
- Create: `tools/preview/cloudflare-deployments.mjs`
- Create: `tools/preview/cleanup.mjs`
- Create: `test/preview-cleanup.test.mjs`
- Create: `.github/workflows/preview-gc.yml`

**Interfaces:**
- Policy: feature current+previous; Lab current+previous; release current; CMS current with 48h TTL.

- [ ] Write failing retention/orphan/expiry tests.
- [ ] Implement dry-run cleanup first.
- [ ] Verify dry-run against real current Cloudflare deployment inventory.
- [ ] Add trusted expired tombstone deployment before purging old candidate deployments.
- [ ] Enable deletion only after dry-run output is reviewed.
- [ ] Commit as `feat: add private preview garbage collection`.

### Task 13: Cutover and legacy retirement

**Files:**
- Modify: V2 workflow triggers.
- Modify: `docs/preview.md`, `docs/pr-preview.md`.
- Retire legacy automatic workflow only in the final separate commit.

- [ ] Require successful V2 validation on active feature work, CMS preview, cleanup and a release candidate.
- [ ] Make V2 automatic for PRs to `dev`/`prod`, Lab updates and CMS preview refs while keeping legacy workflow as manual fallback.
- [ ] Complete one normal `dev -> prod` release cycle with production workflow unchanged.
- [ ] After the successful cycle, retire legacy automatic preview in a separate rollback-friendly commit.
- [ ] Final verification: typecheck, fast tests, preview contract tests, remote QA, cleanup dry-run, unchanged production deployment behavior.
