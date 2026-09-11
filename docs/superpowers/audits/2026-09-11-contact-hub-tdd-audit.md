# Contact Hub + Venus TDD / Test Architecture Audit

**VERDICT: NO-GO until executable RED is observed; GO WITH FIXES on test design.**

The test design is directionally correct, but strict TDD requires fresh execution evidence that each first implementation slice fails for the intended missing behavior. This environment currently has no connected project runtime and cannot execute the branch; therefore frontend implementation must not start yet.

## BLOCKERS

### T1 — RED has been authored but not executed
Severity: blocking by TDD policy.

Four main pre-implementation suites exist, but no test run has been observed on `contact-hub-contracts`. A syntactically plausible test file is not RED evidence.

**Fix:** in a runnable checkout of the branch, execute:

```text
node --test test/contact-hub-domain-contract.test.mjs
node --test test/portfolio-pet-interaction-contract.test.mjs
node --test test/portfolio-assistant-prepared-contract.test.mjs
node tools/e2e/contact-hub-acceptance.mjs
```

For each, record that failure is an assertion/observable missing behavior, not syntax/import/tooling noise. If browser test reaches the current site without widget implementation, the first failed expectation should be missing Contact Hub/Pet behavior.

### T2 — broad browser suite currently pins several candidate labels/ARIA patterns that are not yet approved authored copy
Severity: medium, fix before permanent classification.

Examples include exact accessible names `Контакты`, `Написать`, `Свернуть`, `Открыть контакты`, `AI думает`. Accessible semantics are legitimate product outcomes, but exact wording is an authored-content contract and should not accidentally be frozen by a structural test before copy approval.

**Fix:** keep these assertions TEMPORARY during early RED if useful, then either:
- replace exact wording with an approved accessibility/copy contract once copy is explicitly locked; or
- assert observable mode/content/result without requiring incidental label wording.

Do not replace them with CSS-class assertions. That would be worse.

### T3 — `role=tab` + `aria-selected` is more specific than the product requirement
Severity: medium.

Product requires an accessible mode switch and an unambiguous active state, not necessarily ARIA tabs. The main acceptance suite currently requires tab semantics.

**Fix:** before implementation, revise the main acceptance to prove the result of switching/opening modes rather than a particular tab implementation. Accessibility semantics get their own focused RED once the exact control model is selected.

## FINDINGS

### T4 — test tiering is correct so far
None of the new tests were added to `fastTests`. Existing `run-tests.mjs` explicitly makes fast tests opt-in, which matches `docs/testing-policy.md`.

Provisional lifecycle:
- `test/contact-hub-domain-contract.test.mjs`: TEMPORARY now; likely portions become CONTRACT after GREEN/refinement.
- `test/portfolio-pet-interaction-contract.test.mjs`: TEMPORARY now; pure gesture/clamp/preference rules are strong CONTRACT candidates.
- `test/portfolio-assistant-prepared-contract.test.mjs`: TEMPORARY now; prepared/generate routing/privacy-safe context are strong CONTRACT candidates.
- `tools/e2e/contact-hub-acceptance.mjs`: AFFECTED/FULL, not `test:fast`.

### T5 — module-existence assertions are RED scaffolding, not permanent behavioral tests
`loadRequired()` uses `existsSync()` so missing feature files fail as assertions instead of loader errors. This is useful for initial RED verification, but after implementation the existence assertion adds little product value.

**Fix:** classify it as temporary scaffolding and remove/simplify during final KEEP review. Preserve behavior assertions, not file-presence assertions.

### T6 — pure domain tests are outcome-oriented enough if their interfaces remain deliberate public seams
State transition, validation, safe-context, gesture classification and prepared-routing tests assert returned decisions, not internal helper calls or mocks. That is appropriate because these pure functions are planned domain boundaries, not random implementation details.

**Guardrail:** if implementation discovers a cleaner public seam, change the plan/spec first and rewrite the still-RED test before production code. Do not contort production architecture merely to satisfy a speculative function name.

### T7 — browser acceptance correctly tests layout isolation as a result
Measuring stable underlying `.hero`, `.projects-grid` and `.contact` rectangles is acceptable because those selectors identify existing public site regions and the assertion is geometry invariance. It does not assert widget CSS implementation.

### T8 — dynamic viewport emulation is only a partial proof and is correctly not treated as Mobile Safari proof
Changing Playwright viewport height can catch clipping/drift bugs but not real Safari toolbar/keyboard behavior. The canonical spec correctly requires focused real-browser evidence later.

### T9 — duplicate-send browser test is a good frontend result but does not prove server delivery idempotency
Counting one intercepted `/api/contact/send` request protects the UI single-flight contract. It cannot prove that a retry after lost response creates only one email.

**Fix:** retain frontend test, add backend idempotency RED in backend phase.

### T10 — prepared-answer browser test correctly measures zero provider calls
Intercepting `/api/assistant/**` and asserting zero requests after a prepared action is an external-boundary outcome and exactly matches the token-economy requirement.

### T11 — not every requirement should become a test before implementation
Creating all granular tests now would violate the intended one-behavior RED -> GREEN rhythm and produce speculative implementation coupling.

**Decision:** current main suites are the skeleton. Remaining tests are created just-in-time at the start of their implementation task. Manual gates remain manual where automation cannot prove the property.

## REQUIREMENT IDS AFFECTED
All, with immediate focus on H-007/H-008, AX-004..008, MV-001..006, S-003/S-013..015, AI-008/016..023, DR-001..007.

## TESTS AFFECTED / TESTS MISSING

Before frontend implementation:
- execute and verify current main RED suites;
- remove `role=tab` implementation assumption from broad acceptance;
- decide whether temporary exact UI labels are approved contracts or temporary selectors.

Just-in-time RED tests still required by plan:
- session draft restore/clear and attachment exclusion;
- reduced-motion pet + thinking states;
- hover hint behavior;
- temporary hide browser behavior and persistent disable;
- AI -> form explicit handoff with non-empty form draft;
- analytics success-only/no-PII;
- attachment selection allowlist/size UI;
- pet teardown/listener/timer cleanup;
- z-index/competing overlay policy if implementation exposes a regression.

Backend later:
- strict payload schema;
- delivery sequencing;
- idempotency concurrency/retry;
- object metadata verification/private links;
- CORS/rate/honeypot;
- provider adapters and real smoke.

## EXACT PRE-IMPLEMENTATION FIXES

1. Revise broad mode-switch assertions away from mandatory tab semantics.
2. Keep exact copy assertions temporary unless copy is explicitly approved.
3. Run all four main suites in a real checkout and record expected RED.
4. Do not add any new tests to `test:fast` yet.
5. Do not implement production code until item 3 is complete.

## QUESTIONS REQUIRING OWNER DECISION
None. Exact final visible/accessible labels can be approved during UI implementation without blocking architecture, provided tests remain temporary until then.
