# Contact Hub + Venus Five-Audit Reconciliation

Date: 2026-09-11

**OVERALL VERDICT: GO for frontend implementation. Backend remains gated until frontend transport contracts stabilize.**

This report combines the five independent audit domains requested before frontend implementation. The intended parallel Custom Agent run could not be performed from the current Notion connection because the connection lacks `interact with agents` capability and workspace agent discovery requires additional Business access. The five work packets remain reusable. The audits below were therefore completed as independent scoped passes in the current session rather than falsely reported as separate agents.

## Audit results

1. **Architecture / state / data flow / PR #724 reuse** — GO WITH FIXES.
   - Preserve narrow foundation seams.
   - Split pet launcher state from Contact Hub state.
   - Remove pet-owned panel architecture.

2. **TDD / test coverage / tiering** — GO.
   - Intended contract RED is now proven in an isolated GitHub Actions cloud runner.
   - `role=tab` and editable-copy assumptions were removed from the reconciled browser suite.
   - Browser acceptance v2 asserts user-visible mode results and uses test hooks only for targeting.

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

## Cloud RED evidence

A temporary branch-only GitHub Actions workflow, `.github/workflows/contact-hub-cloud-red.yml`, creates the required isolated cloud environment for this feature branch. It must be deleted before merge.

Fresh run `34619142083` on commit `eb16730fa0c6dd6a82271434721fe64fab26e416` completed successfully and proved all of the following:

- clean Actions checkout of `contact-hub-contracts`;
- Node 24 setup;
- `npm ci` success;
- the three principal contract suites fail for the intended missing-behavior `RED:` reasons;
- `npm run build:vite` succeeds before feature implementation;
- pinned Chromium headless shell installs successfully;
- `tools/e2e/contact-hub-acceptance-v2.mjs` is RED before implementation as expected.

This closes the previous B1 blocker. Local workstation execution is not required for normal feature development; cloud verification is the canonical execution environment for this work.

## Remaining release evidence

### B2 — real Mobile Safari evidence
Chromium automation can establish generic clipping/overflow/resize behavior. It cannot prove Safari toolbar/keyboard behavior. Record focused real Mobile Safari evidence after the mobile implementation reaches GREEN and before public release.

### B3 — Webvisor privacy
Before the direct form is public, verify visitor-entered fields are not recorded by Webvisor and update public privacy/analytics docs to match deployed processing.

## Frontend execution order

1. Selectively reconcile PR #724 foundation onto current `dev` lineage.
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
- `.github/workflows/contact-hub-cloud-red.yml`: TEMPORARY cloud-development workflow, DELETE before merge.

Frontend implementation may now begin one vertical slice at a time.