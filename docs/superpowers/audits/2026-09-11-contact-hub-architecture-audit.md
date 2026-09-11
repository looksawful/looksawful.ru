# Contact Hub + Venus Architecture Audit

**VERDICT: GO WITH FIXES**

Scope: current `dev`, canonical Contact Hub spec/plans, PR #724, issues #709/#710/#711/#712/#713/#714/#715/#746.

## BLOCKERS

### A1 — PR #724 state ownership is incompatible with the new shared-shell boundary
Severity: high.

`src/features/portfolio-pet/state.ts` in PR #724 combines `view: closed/home/about/cases/...` with pet animation state. Under the canonical architecture, Contact Hub owns visibility/mode while Pet owns launcher/animation. Preserving that reducer as the production top-level state would recreate pet-owned shell coupling.

**Fix:** do not preserve PR #724 `state.ts` as-is. Split observable ownership into `contact-hub/state.ts` plus pet animation/runtime state. AI content/view state may remain AI-owned but cannot own shell close/collapse/form mode.

Requirements: P-003..009, H-001..015.
Tests: `test/contact-hub-domain-contract.test.mjs`; future focused state tests.

### A2 — PR #724 component owns a complete panel and must be structurally refactored, not visually restyled
Severity: high.

`src/components/portfolio-pet.ts` currently creates launcher, dialog panel, header, quick actions, status and free-chat form. A CSS-only restyle would leave incorrect ownership intact.

**Fix:** reconcile foundation logic onto current `dev`, then make `portfolio-pet.ts` launcher/runtime-only. Create a separate `contact-hub.ts` composition root that receives pet callbacks and site CTA entry.

Requirements: P-003, H-001, PET-014..035.
Tests: main browser acceptance + focused lifecycle tests.

### A3 — server delivery idempotency cannot be satisfied by frontend single-flight alone
Severity: high for backend phase, not a frontend blocker.

A request may be accepted by mail provider while the browser loses the response. A second request after timeout can duplicate mail even if the button was disabled during the first request.

**Fix:** keep frontend logical `submissionId`, and implement a short-lived server-side idempotency ledger with opaque metadata/TTL only. It is explicitly not a submissions database and stores no name/email/message.

Requirements: S-003, S-013..015, SEC-005.
Tests: backend idempotency contract + staging concurrent/retry proof.

## FINDINGS

### A4 — useful PR #724 foundation is cleanly separable
`feature-flag.ts` is independent of visual shell. `intent-router.ts` is a small deterministic exact-route boundary. `knowledge.ts` derives candidates from canonical CV/project data and requires explicit approved IDs. `sprite-manifest.ts` is generic and validates runtime dimensions/anchor/hitbox rather than hardcoding a character.

**Decision:** preserve/refine these seams. Do not blindly cherry-pick component/state/view-model UI ownership.

Requirements: AI-001..015, PET-001..014, PERF-003..008.

### A5 — existing intent router is a useful level-0 router but is insufficient for the prepared-answer target
PR #724 only recognizes exact normalized phrases. Latest product contract requires prepared natural-language variants and conservative fallback.

**Fix:** keep exact routes as highest-confidence aliases, add `prepared-answers.ts` above/beside them, and return `generate` only after local/prepared matching fails. Never solve ambiguity by forcing the nearest prepared answer.

Requirements: AI-002..012.
Tests: `test/portfolio-assistant-prepared-contract.test.mjs`.

### A6 — public AI and public contact must remain separate trust boundaries
Issue #714 correctly keeps anonymous AI traffic out of private `awful-control`. Direct contact should follow the same trust principle and must not be bolted into the private control plane merely because Yandex credentials exist there.

**Decision:** dedicated public contact service/repository is preferred at backend phase; shared server-side provider helpers are acceptable only if deployment identity/permissions remain separate.

Requirements: SEC-001..010, P-001.

### A7 — AI writer ownership is already compatible
Issue #715 owns draft generation/editing and explicit handoff only. Delivery stays in form. This matches the canonical privacy boundary.

**Decision:** preserve.

Requirements: P-007..009, AI-013.

### A8 — direct form one-action pet entry is new and not present in PR #724
PR #724 launcher has one toggle action. New product contract additionally requires a direct-form path from the visible pet in one action.

**Fix:** launcher runtime needs a distinct accessible direct-contact affordance that does not require opening AI first. Exact visual treatment remains design/CSS work, not architecture.

Requirements: P-012, PET direct-form entry, H entry contract.
Tests: browser acceptance direct-form path.

### A9 — drag/hide/collapse require state that is orthogonal to AI view state
Drag position, temporary hide, permanent disable and Hub collapsed state must not be encoded as AI conversation views. Otherwise restoration, routing and accessibility become entangled.

**Fix:** keep `PetPreferenceState`/position state separate from `ContactHubState` and AI conversation state. Persist only the pieces with explicit session/permanent contracts.

Requirements: PET-015..030, M-010..017, DR-001..007.

### A10 — attachment flow is correctly isolated from Cloud Function body
20 MB target cannot be modeled as a normal form JSON body. Frontend needs a two-step interface: authorize private upload, direct browser upload, then send object key. Send service verifies metadata before mail.

**Decision:** backend plan is consistent. Attachment upload is an optional form transport concern, not Contact Hub shell state.

Requirements: A-001..011.

## REQUIREMENT IDS AFFECTED
P-001..012; H-001..015; PET-001..035; M-010..017; AI-001..015; DR-001..007; S-003/S-013..015; PRV-004..005; SEC-001..010.

## TESTS AFFECTED / TESTS MISSING

Existing main tests cover shared entry/state, safe context, drag classification, visibility preference and prepared routing. Browser acceptance covers one-instance shared UI, direct-form path, drag and collapse.

Just-in-time tests still required during implementation:
- state ownership invariant: AI availability cannot remove form;
- explicit AI -> form handoff conflict behavior;
- session persistence boundaries;
- pet runtime teardown/no listener/timer leaks;
- backend idempotency under ambiguous response/retry;
- attachment server metadata verification.

Do not create all of these now. They belong to their RED implementation task.

## EXACT PRE-IMPLEMENTATION FIXES

1. Mark PR #724 `state.ts` as superseded/split in issue/plan language.
2. Treat `portfolio-pet.ts` and `portfolio-pet.css` from PR #724 as scaffolding to refactor, not files to merge unchanged.
3. Preserve `feature-flag`, generic sprite manifest, approved knowledge derivation and exact intent aliases where they remain compatible.
4. Add direct public contact backend ownership issue/repo before backend implementation.
5. Keep server idempotency ledger in backend plan.
6. No production implementation until test RED can be executed in a runnable repo environment.

## QUESTIONS REQUIRING OWNER DECISION
None for frontend architecture. Backend service repository name can be decided immediately before backend work; it does not block frontend.
