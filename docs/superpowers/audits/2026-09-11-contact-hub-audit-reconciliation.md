# Contact Hub + Venus Five-Audit Reconciliation

Date: 2026-09-11

**OVERALL VERDICT: NO-GO for production implementation until intended RED is executed. Architecture/documentation are GO WITH FIXES and have been reconciled.**

This report combines the five independent audit domains requested before frontend implementation. The intended parallel Custom Agent run could not be performed from the current Notion connection because the connection lacks `interact with agents` capability and workspace agent discovery requires additional Business access. The five work packets remain reusable. The audits below were therefore completed as independent scoped passes in the current session rather than falsely reported as separate agents.

## Audit results

1. **Architecture / state / data flow / PR #724 reuse** — GO WITH FIXES.
   - Preserve narrow foundation seams.
   - Split pet launcher state from Contact Hub state.
   - Remove pet-owned panel architecture.

2. **TDD / test coverage / tiering** — NO-GO until executable RED; GO WITH FIXES on design.
   - Current RED skeletons are authored but not run.
   - `role=tab` and editable-copy assumptions were too specific in the first broad browser draft.
   - Reconciled browser suite v2 asserts mode results and uses test hooks only for targeting.

3. **CSS / responsive / visual viewport / overlay isolation** — GO WITH FIXES.
   - Mobile needs visual/dynamic viewport strategy and internal scrolling.
   - Real Mobile Safari remains a release evidence requirement.
   - Existing bottom-left analytics-consent surface creates a real collision with Venus.

4. **GitHub issues / ownership / stale contradictions** — GO WITH FIXES.
   - #709/#710/#711/#712 and PR #724 were reconciled.
   - #713/#714/#715/#170/#747/#750 ownership is compatible.
   - PR #724 remains draft foundation evidence only.

5. **Notion / site docs / privacy / analytics** — GO WITH FIXES pre-implementation; NO-GO for release until privacy gates pass.
   - Projects 114/116 reconciled.
   - Public privacy docs intentionally remain current-production truth.
   - Webvisor field capture, final privacy copy and new goal documentation are release gates.

## Reconciliation changes

- Added normative companion spec `docs/superpowers/specs/2026-09-11-contact-hub-preimplementation-reconciliation.md`.
- Added overlay arbitration requirements OV-001..010.
- Added real-browser evidence requirements MV-007..011.
- Added acceptance-test selector policy TST-001..007.
- Added privacy/analytics release gates REL-PRV/REL-AN.
- Added `tools/e2e/contact-hub-acceptance-v2.mjs`; this supersedes the first broad browser skeleton for implementation planning.
- Updated GitHub #709/#710/#711/#712 and PR #724.
- Reconciled Notion Projects 114 and 116.

## Remaining blocking evidence

### B1 — intended RED not executed
The remote workstation `Titan` is registered but offline. No fresh test output exists for the `contact-hub-contracts` branch. Strict TDD therefore blocks production frontend code.

Required first runnable commands:

```text
node --test test/contact-hub-domain-contract.test.mjs
node --test test/portfolio-pet-interaction-contract.test.mjs
node --test test/portfolio-assistant-prepared-contract.test.mjs
node tools/e2e/contact-hub-acceptance-v2.mjs
```

Expected state: FAIL because required Contact Hub/Venus/prepared-answer behavior is absent, not because of syntax/toolchain/stale checkout failures.

### B2 — real Mobile Safari evidence is a release gate, not initial RED gate
Chromium automation can establish generic clipping/overflow/resize behavior. It cannot prove Safari toolbar/keyboard behavior. Record real-device evidence after the mobile implementation reaches GREEN and before public release.

### B3 — Webvisor privacy is a release gate
Before the direct form is public, verify visitor-entered fields are not recorded by Webvisor and update public privacy/analytics docs to match deployed processing.

## Frontend execution order after RED

1. Selectively reconcile PR #724 foundation onto current `dev`.
2. Shared Contact Hub state + safe context.
3. Form validation + session draft.
4. Pet pure gesture/preferences domain.
5. Prepared-answer routing/domain.
6. Venus launcher runtime + drag/hide/direct form affordance.
7. Shared Contact Hub overlay geometry + overlay arbitration.
8. Form DOM with fake transport.
9. AI DOM + prepared answers + thinking + fake generative transport.
10. Mobile collapse/visual-viewport behavior.
11. AI -> form explicit draft handoff.
12. Analytics/privacy frontend contracts.
13. Attachment UX with fake upload boundary.
14. Affected browser/accessibility/performance/visual review.
15. KEEP/MOVE/DELETE test classification and final frontend gates.

Only after those frontend contracts stabilize does backend implementation begin.

## Test lifecycle status at this gate

- `test/contact-hub-domain-contract.test.mjs`: TEMPORARY RED skeleton; CONTRACT candidate after GREEN/refinement.
- `test/portfolio-pet-interaction-contract.test.mjs`: TEMPORARY RED skeleton; semantic gesture/preferences portions may become CONTRACT.
- `test/portfolio-assistant-prepared-contract.test.mjs`: TEMPORARY RED skeleton; routing/privacy portions may become CONTRACT.
- original `tools/e2e/contact-hub-acceptance.mjs`: superseded TEMPORARY draft, DELETE candidate before completion.
- `tools/e2e/contact-hub-acceptance-v2.mjs`: AFFECTED/FULL candidate, never automatic `test:fast`.

No production completion claim is valid until fresh verification is available.
