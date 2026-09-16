# Analytics Safe Production Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the recruiter/portfolio analytics funnel to production without merging the divergent `dev` branch wholesale into `prod`, then make private reporting consume the new semantic events.

**Architecture:** Treat public instrumentation, release promotion and private reporting as separate review lanes. Public behavior is first corrected and verified on a narrow branch from the current `dev`; production receives a fresh narrow backport from the current `prod`; private `awful-control` reporting changes only after the production event vocabulary exists. Re-read live branch SHAs before every integration step because parallel development remains active.

**Tech Stack:** Vite 8, TypeScript/JavaScript, Node test runner, Yandex Metrica, Cloudflare/GitHub Pages, GitHub Actions, private `looksawful/awful-control` control plane.

**Spec:** `docs/outreach-tracking-plan.md`, `docs/analytics.md`, `docs/analytics-dashboard-spec.md`

## Global Constraints

- Never merge all of `dev` into `prod` as part of this rollout.
- Re-read current `dev`, `prod` and `awful-control/main` SHAs before preparing or merging a candidate.
- Do not change authored site/CV copy while implementing analytics.
- Keep UTM values bounded and PII-free.
- Preserve GPC, DNT, explicit consent and internal-traffic suppression.
- No generic 25/50/75 scroll conversion goals.
- No production merge without fresh exact-head CI/preview evidence.
- Create Yandex goals only through the private owner-only control plane and never expose tokens/codes in public artifacts.

---

### Task 1: Correct CV semantic event behavior on current dev

**Files:**
- Modify: `test/static-site-analytics.test.mjs`
- Modify: `tools/lib/static-site-analytics.mjs`
- Modify when dynamic-runtime parity is needed: `test/site-analytics.test.mjs`
- Modify when dynamic-runtime parity is needed: `src/components/site-analytics.ts`

**Interfaces:**
- Consumes: current `reachGoal`/`reachSiteAnalyticsGoal` event vocabulary and `/cv/` public-static bootstrap.
- Produces: `cv_engaged`, `cv_project_open`, `cv_end`, while a CV case click also contributes to aggregate `project_open`.

- [ ] **Step 1: Add a failing CV project dual-event contract**

Add a focused test asserting that a `/cv/` click to `/work/jestei-pool/` emits both `project_open` and `cv_project_open` with the same bounded target path.

- [ ] **Step 2: Verify the new contract is RED**

Run:

```bash
node --test test/static-site-analytics.test.mjs
```

Expected: the new dual-event assertion fails because the current bootstrap chooses one goal or the other.

- [ ] **Step 3: Implement the minimum dual-event change**

Keep normal non-CV project clicks unchanged. On `/cv/`, emit aggregate `project_open` and then `cv_project_open` for the same target.

- [ ] **Step 4: Add a failing visible-time engagement contract**

Add a test that proves the 30-second `cv_engaged` path cannot accrue while `document.hidden === true`, while the >=50% scroll path remains a valid independent trigger.

- [ ] **Step 5: Verify the visible-time contract is RED**

Run the same focused test command and confirm the failure is specifically caused by the unconditional 30-second timer.

- [ ] **Step 6: Implement visible-time engagement accounting**

Accumulate only visible elapsed time using `visibilitychange` plus a small bounded timer/scheduler. Preserve once-only emission and the 50% scroll alternative. Remove listeners/timers once engaged or on teardown where an existing teardown seam exists.

- [ ] **Step 7: Verify focused analytics tests GREEN**

Run:

```bash
node --test test/static-site-analytics.test.mjs test/site-analytics.test.mjs
```

Expected: zero failures.

- [ ] **Step 8: Commit the isolated behavior change**

```bash
git add test/static-site-analytics.test.mjs tools/lib/static-site-analytics.mjs test/site-analytics.test.mjs src/components/site-analytics.ts
git commit -m "fix(analytics): harden CV semantic funnel events"
```

### Task 2: Remove the unavailable Cloudflare trace probe on the current code line

**Files:**
- Modify: `test/site-analytics.test.mjs`
- Modify: `test/static-site-analytics.test.mjs`
- Modify: `src/components/site-analytics-consent.ts`
- Modify: `tools/lib/static-site-analytics.mjs`
- Modify: `docs/analytics.md`

**Interfaces:**
- Consumes: session-scoped country cache and `parseAnalyticsCountryResponse`.
- Produces: one deployed-topology country lookup through `https://api.country.is/` without a guaranteed same-origin 404.

- [ ] **Step 1: Reproduce the existing trace-probe contract failure against current dev**

Port only the durable behavior assertion from the previously verified analytics fix: generated dynamic and static runtimes must not contain `/cdn-cgi/trace`.

- [ ] **Step 2: Run the focused tests and confirm RED**

```bash
node --test test/site-analytics.test.mjs test/static-site-analytics.test.mjs
```

Expected: failure because current runtimes still include `/cdn-cgi/trace`.

- [ ] **Step 3: Remove only the unavailable endpoint from both runtimes**

Keep timeout, session cache, country parsing, RU auto-start policy, non-RU consent behavior and fallback semantics otherwise unchanged.

- [ ] **Step 4: Re-run focused tests and confirm GREEN**

```bash
node --test test/site-analytics.test.mjs test/static-site-analytics.test.mjs
```

Expected: zero failures.

- [ ] **Step 5: Update the analytics contract to match deployed behavior**

Change only the country-resolution description in `docs/analytics.md` after code is green.

- [ ] **Step 6: Commit**

```bash
git add test/site-analytics.test.mjs test/static-site-analytics.test.mjs src/components/site-analytics-consent.ts tools/lib/static-site-analytics.mjs docs/analytics.md
git commit -m "fix(analytics): align country lookup with production topology"
```

### Task 3: Verify and integrate the dev analytics candidate

**Files:**
- No additional product files expected.

**Interfaces:**
- Consumes: Tasks 1-2 candidate branch.
- Produces: one approved exact-head dev implementation SHA suitable for narrow production backport.

- [ ] **Step 1: Re-read current dev SHA and compare branch drift**

```bash
git fetch origin dev
git merge-base --is-ancestor origin/dev HEAD || true
git diff --stat origin/dev...HEAD
```

If `dev` advanced, reconcile onto the fresh current line without force-pushing shared history.

- [ ] **Step 2: Run full relevant verification**

```bash
npm run typecheck
npm run test:fast
npm run build:site
npm run cv:prod:verify
```

Expected: every command exits 0. Record any unrelated baseline failure separately instead of rewriting analytics around it.

- [ ] **Step 3: Open a narrow PR to dev**

The PR body must list the exact head SHA, touched files, focused RED→GREEN evidence, full checks, and explicitly state that it does not authorize a production release.

- [ ] **Step 4: Require exact-head GitHub gates**

Require Fast CI, CodeQL, Dependency Review and PR Preview/remote browser QA configured for the repository. Do not infer success from older runs.

- [ ] **Step 5: Merge to dev only with fresh green evidence**

Merge using expected-head-SHA protection and record the resulting dev merge SHA.

### Task 4: Finish the fail-closed release preflight before using it

**Files:**
- Existing PR scope from `#926`; do not add analytics behavior to that PR.

**Interfaces:**
- Consumes: repository release-preflight implementation.
- Produces: trusted guard for a fresh `prod` backport candidate.

- [ ] **Step 1: Inspect exact-head failed Fast CI and PR Preview on #926**

Fetch the failed jobs/logs and identify root causes. Do not merge #926 while its current exact head is red.

- [ ] **Step 2: Fix only causes inside release-preflight scope**

If a failure is an unrelated moving-dev baseline, rebase/reconcile the PR to the fresh dev line and rerun. If it is in preflight code, use TDD for the correction.

- [ ] **Step 3: Require fresh exact-head gates**

Fast CI, CodeQL, Dependency Review, Private Lab Verify and PR Preview must all be green on the final #926 head.

- [ ] **Step 4: Merge the release guard to dev**

Record its merge SHA. This gives later release candidates a canonical fail-closed preflight.

### Task 5: Provision the three CV goals in Yandex Metrica

**Files:**
- Private control-plane issue/history only; no public repository secrets.

**Interfaces:**
- Consumes: existing `yandex-control` goal-management commands and counter `112065623`.
- Produces: active JavaScript-event goals `cv_engaged`, `cv_project_open`, `cv_end`.

- [ ] **Step 1: Read the existing goal list through the private control plane**

Confirm that the seven existing runtime goals remain active and the three CV goals are absent or match exact desired conditions.

- [ ] **Step 2: Create only missing goals using the explicit mutation confirmation path**

Create exact JavaScript-event goals for `cv_engaged`, `cv_project_open`, `cv_end`. Do not modify unrelated goals.

- [ ] **Step 3: Re-read goal configuration**

Confirm all ten runtime event IDs are present and active. Record only goal names/IDs/status, never OAuth credentials.

### Task 6: Prepare a narrow production backport from fresh prod

**Files:**
- Only files present in the approved analytics dev diff plus explicitly justified release-only files accepted by preflight.

**Interfaces:**
- Consumes: approved dev analytics SHA and current prod SHA.
- Produces: release branch whose diff is limited to approved analytics behavior.

- [ ] **Step 1: Re-read current prod immediately before branch creation**

```bash
git fetch origin prod dev
git rev-parse origin/prod
git rev-parse origin/dev
```

Record both SHAs.

- [ ] **Step 2: Create the release branch from current prod**

```bash
git switch --detach origin/prod
git switch -c release/analytics-cv-funnel-20260916
```

- [ ] **Step 3: Port only the approved analytics file delta**

Use reviewed commits/diffs. Do not merge `dev` wholesale and do not import Lab/Storybook/Media Desk/Awful Cases/Contact Hub changes.

- [ ] **Step 4: Run the repository release preflight**

```bash
node tools/release/preflight.mjs \
  --repo . \
  --prod-base <current-prod-sha> \
  --candidate <candidate-sha> \
  --approved-base <approved-dev-base-sha> \
  --approved-head <approved-dev-head-sha>
```

Expected: `RELEASE_PREFLIGHT_OK`. Any missing approved file, hitchhiker file, Lab-only file or unreconciled overlap blocks release.

- [ ] **Step 5: Run production verification**

```bash
npm run typecheck
npm run test:fast
npm run build:site
npm run cv:prod:verify
```

Expected: all exit 0.

- [ ] **Step 6: Open prod PR and require exact-head preview/browser gates**

Re-read `prod` once more before merge. If it advanced, reconcile on the new base and rerun preflight and verification.

- [ ] **Step 7: Merge only the narrow prod candidate**

Record production merge/deploy SHA.

- [ ] **Step 8: Probe live production independently**

Verify `/cv/`, at least one normal `/work/...` page, consent behavior, internal-traffic suppression and the new events with one bounded `_ym_debug=2` QA session.

### Task 7: Upgrade private reporting after production event deployment

**Files in `looksawful/awful-control`:**
- Modify: `tools/outreach-performance.mjs`
- Modify: `tools/analytics-brief.mjs`
- Modify: `.github/workflows/analytics-weekly.yml`
- Modify/add focused tests for outreach and analytics brief behavior.
- Reuse: `tools/metrika-tech-breakdown.mjs`

**Interfaces:**
- Consumes: ten active runtime goals and production UTM vocabulary.
- Produces: private `job_search` and `portfolio` funnels plus device/OS/browser segmentation.

- [ ] **Step 1: Add failing tests for the expanded event vocabulary**

Require `cv_engaged`, `cv_project_open`, `cv_end` only when the production-goal contract is active and preserve the seven existing goals.

- [ ] **Step 2: Add failing tests for both campaign families**

Prove the reporter can produce separate `job_search` and `portfolio` sections without mixing their denominators.

- [ ] **Step 3: Implement the minimal campaign/funnel expansion**

Keep raw counts beside rates. Preserve bounded attribution tokens and PII redaction.

- [ ] **Step 4: Add `metrika-tech-breakdown` to the weekly brief**

Use the existing `buildMetrikaTechBreakdown` implementation rather than creating another device report.

- [ ] **Step 5: Add the tech-breakdown files to workflow path triggers**

Ensure changes to the tool/test cause the private weekly workflow to run.

- [ ] **Step 6: Run private control-plane verification**

```bash
npm run check
```

Expected: zero test failures.

- [ ] **Step 7: Merge via a focused awful-control PR**

Do not combine Yandex Cloud Workload Identity issue #201 with this analytics-reporting PR.

### Task 8: Establish the clean measurement epoch

**Files:**
- Private analytics issue/comment/report; public docs only if a durable non-sensitive release note is useful.

**Interfaces:**
- Consumes: deployed prod SHA, working weekly report and canonical UTM links.
- Produces: a stable post-release cohort boundary for later analysis.

- [ ] **Step 1: Record measurement epoch**

Record release date/time, prod SHA, counter ID, configured goal vocabulary and attribution generator version. Keep historical pre-release traffic separate.

- [ ] **Step 2: Run a seven-day health check**

Check that controlled sources appear, CV events are nonzero when expected, internal QA is absent, and no device/browser segment exhibits obvious instrumentation loss.

- [ ] **Step 3: Run the 30-day acquisition/funnel review**

Compare raw visits/users, CV engagement, project opens, CV completion/download and contacts by source/medium/campaign/landing/device. Do not infer recruiter identity or user personas from aggregate analytics.
