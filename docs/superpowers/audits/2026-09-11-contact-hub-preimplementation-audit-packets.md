# Contact Hub + Venus Pre-Implementation Audit Packets

Status: **READY FOR INDEPENDENT AUDIT PASSES**

Canonical inputs:
- `docs/superpowers/specs/2026-09-11-contact-hub-pet-product-contract.md`
- `docs/superpowers/plans/2026-09-11-contact-hub-frontend-implementation.md`
- `docs/superpowers/plans/2026-09-11-contact-hub-backend-implementation.md`
- `docs/testing-policy.md`
- `AGENTS.md`
- current `dev`
- draft PR #724 and issues #709/#710/#711/#712/#714/#715/#746/#170
- Notion Projects 114 and 116

## Shared audit rules

Each audit is read-only during investigation. Do not implement production frontend/backend code. Do not weaken a test to fit an implementation. Do not rewrite authored site copy. Treat PR #724 visual shell as a prototype fixture, not design authority.

Every audit output must contain:

1. `VERDICT: GO | GO WITH FIXES | NO-GO`
2. `BLOCKERS` ordered critical -> low
3. `FINDINGS` with evidence/file/issue references
4. `REQUIREMENT IDS AFFECTED`
5. `TESTS AFFECTED / TESTS MISSING`
6. `EXACT PRE-IMPLEMENTATION FIXES`
7. `QUESTIONS REQUIRING OWNER DECISION` only when evidence cannot resolve them

A finding is useful only if it names an observable failure/risk and the smallest corrective action.

---

## Audit 1 — Architecture / state / trust boundaries

### Goal
Prove that the planned frontend and later backend have one clear owner per state/data boundary, preserve useful PR #724 foundation work without inheriting its obsolete shell, and avoid hidden coupling between Pet, Contact Hub, AI and contact delivery.

### Inspect
- canonical spec and both plans;
- PR #724 changed files and current divergence from `dev`;
- `src/main.ts` current composition points;
- PR #724 `feature-flag.ts`, `state.ts`, `intent-router.ts`, `knowledge.ts`, `sprite-manifest.ts`, `character-context.ts`, `view-model.ts`, component/CSS;
- #709/#714/#715/#746 ownership;
- existing private Yandex/control-plane boundaries.

### Must answer
- Is `ContactHub` the only owner of open/close/collapse/mode/focus lifecycle?
- Is `portfolio-pet` launcher-only after reconciliation?
- Can form operate with AI module absent, failed or feature-off?
- Are form draft/PII and AI context structurally unable to leak into one another without explicit handoff?
- Is local/prepared answer routing before the generative transport boundary?
- Can PR #724 foundation be cherry-picked/reimplemented cleanly onto current `dev` despite divergence?
- Is frontend submission idempotency clearly distinguished from server delivery idempotency?
- Does backend plan create a public trust boundary separate from `awful-control` and AI service?
- Are attachment binary, contact payload and model prompts kept on appropriate transports?
- Are any proposed files/components doing more than one clear job?

### High-risk requirement IDs
P-001..012, H-001..015, PRV-004..005, SEC-001..010, AI-001..015, S-013..015.

---

## Audit 2 — TDD / test architecture / lifecycle

### Goal
Prove that tests specify outcomes rather than implementation, that the main RED suites are executable and fail for the intended missing behavior, and that future granular tests can follow strict one-behavior RED -> GREEN cycles without bloating permanent CI.

### Inspect
- all four pre-implementation test files on `contact-hub-contracts`;
- `docs/testing-policy.md`;
- `tools/ci/run-tests.mjs` and current manifests;
- `tools/e2e/runtime.mjs` and `run-responsive-ui.mjs`;
- existing PR #724 pet tests and their fit with current spec;
- frontend plan Tasks 1-15.

### Must answer
- Does each main assertion map to an observable requirement ID?
- Do tests avoid pinning incidental CSS selectors/classes for widget behavior?
- Where selectors reference existing site classes only for geometry-isolation measurement, are they stable enough?
- Do browser tests rely on accessible roles/names that are product contracts rather than private DOM structure?
- Can every planned implementation task start with one focused RED?
- Are any tests too broad/flaky to be permanent?
- Which existing PR #724 tests are KEEP/MOVE/DELETE candidates?
- Are browser/responsive tests correctly AFFECTED/FULL rather than `test:fast`?
- Are real Mobile Safari/browser-chrome and real-provider evidence correctly left as focused manual/staging gates?
- Are there missing critical tests for one-click direct form, drag/click discrimination, collapse state preservation, AI zero-provider prepared answers, privacy, duplicate send, failure draft retention?

### High-risk requirement IDs
All requirement families; especially DR, MV, F, S, AI, PRV, AN.

---

## Audit 3 — CSS / responsive / overlay geometry / accessibility motion

### Goal
Prove that the planned UI can remain a true overlay, use current looksawful design tokens, keep Venus large, keep form fully reachable, and avoid mobile sheet instability caused by browser chrome, safe areas or virtual keyboard.

### Inspect
- current `src/styles/tokens.css`, `colors.css`, `base.css`, `components.css`, `motion.css`, navigation/lightbox CSS;
- PR #724 `portfolio-pet.css` only as evidence of what must be replaced;
- current responsive UI checker;
- prototype v7 only as visual evidence, never production source;
- planned `portfolio-pet.css` / `contact-hub.css` responsibilities.

### Must answer
- Which existing site tokens should the widget consume directly?
- Which z-index/modal interactions need an explicit layer contract?
- Can `position: fixed`, `dvh`, safe-area env vars and internal overflow satisfy baseline mobile geometry without JS viewport ownership?
- Exactly which residual browser-chrome behavior, if any, requires `visualViewport` JS?
- How should drag coordinates be represented so CSS transforms do not change document flow?
- How do we guarantee Venus remains grab-able after drag and resize?
- How should collapsed launcher avoid safe areas and critical site controls?
- Which properties must respect reduced motion?
- Are 44px effective touch targets compatible with minimal visual controls?
- Can 200% zoom and 320x568 remain functionally reachable without requiring aesthetically perfect composition?

### High-risk requirement IDs
W-001..010, PET-003..022, H-009..015, M-001..018, V-001..010, AX-001..012, MV-001..006, PERF-001..007.

---

## Audit 4 — GitHub issues / PR topology / repository ownership

### Goal
Remove stale or contradictory ownership before implementation and produce one canonical branch/issue topology.

### Inspect
- issues #709, #710, #711, #712, #713, #714, #715, #746, #170;
- draft PR #724, its changed files/tests and divergence from current `dev`;
- current open PRs that touch `src/main.ts`, test manifests, analytics, CSS policy or responsive tools;
- `dev`/`prod` branch policy and preview workflows.

### Must answer
- Which issue owns Pet launcher/gestures?
- Which owns AI view/prepared answers?
- Which owns shared shell/form?
- Which owns public AI gateway?
- Which owns writer/handoff?
- Which owns contact backend?
- Is a new backend issue/repo required for direct contact delivery?
- Should PR #724 be rebased/reconciled, split, superseded or partially cherry-picked before frontend work?
- Which stale issue statements still say bottom-right, separate pet panel, mobile fullscreen-only or name-required?
- Are there conflicting open PRs touching the same CI/test-manifest protected surfaces?
- Is `contact-hub-contracts` the appropriate source branch for spec/tests only, with implementation moving to a fresh branch after audit?

### High-risk requirement IDs
P, H, M, AI, SEC plus repository policy boundaries.

---

## Audit 5 — Documentation / Notion / site privacy + analytics alignment

### Goal
Ensure the same product exists in repo docs, Notion, GitHub issues and release/privacy/analytics documentation, without leaking private context into public surfaces.

### Inspect
- Notion Project 114 and 116;
- canonical repo spec/plans;
- `docs/analytics.md`, `docs/yandex-control.md`, `/privacy/`, contact/footer architecture spec;
- editorial copy ownership rules;
- #170 analytics goals;
- current `site-analytics.ts` behavior.

### Must answer
- Do Projects 114/116 agree on Venus, bottom-left, shared shell, drag/hide/collapse and prepared-answer-first routing?
- Are stale `name required` and `mobile fullscreen` statements explicitly superseded?
- Is `i@lookawful.ru` consistently protected as intentional?
- Are form contents/filename/PII excluded from analytics everywhere?
- Is `contact_form_submit` defined only after confirmed backend success?
- Is form independent of analytics consent?
- What exact `/privacy/` changes are required before release, and which must wait until provider/retention decisions are final?
- Is any Notion/private infrastructure detail being copied unnecessarily into public GitHub docs?
- Are site copy changes separated from structural implementation?

### High-risk requirement IDs
PRV-001..006, AN-001..006, F/S delivery copy constraints, documentation/release gates.

---

## Reconciliation gate

After all five outputs exist:

1. merge findings by requirement ID;
2. resolve conflicts in favor of the canonical product contract unless a finding proves the contract impossible/unsafe;
3. amend spec/plan/tests before production code;
4. rerun syntax/RED verification after amendments;
5. declare `FRONTEND READY` only if no audit is `NO-GO` and every blocker has an owner/task/test/manual gate.

Do not begin backend implementation when frontend is merely visually acceptable. Backend starts after frontend request/response interfaces and fake-adapter acceptance are stable.
