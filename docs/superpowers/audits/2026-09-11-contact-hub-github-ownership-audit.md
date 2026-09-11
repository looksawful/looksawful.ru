# Contact Hub + Venus GitHub / Ownership Audit

**VERDICT: GO WITH FIXES.**

Issue ownership is now mostly coherent. The remaining hard blocker is not issue topology but executable RED evidence. This audit verifies that Contact Hub, Venus, AI routing, knowledge, writer, analytics and backend trust boundaries have distinct owners and that PR #724 is explicitly demoted to foundation evidence rather than visual/product authority.

## FINDINGS

### G1 — #746 is the canonical shared-shell/direct-form owner
#746 owns one Contact Hub overlay, `ai/form` mode lifecycle, direct form UX, mobile collapse/restore, form delivery contract, privacy and frontend TDD gate. It correctly states that name is optional, email/message are required, Venus is draggable, direct form is one action from the visible pet and mobile is not constrained to fullscreen.

### G2 — #709 now matches the canonical pet/product contract
#709 has been reconciled to canonical Venus, pointer/touch drag, direct-form affordance, temporary hide, delayed return, persistent disable, overlay isolation and prepared-answer-first AI routing.

### G3 — #710/#711/#712 ownership is separated correctly
- #710: Venus + AI interaction requirements inside the shared Hub.
- #711: launcher/sprite/drag/hide/preferences only, no dialog ownership.
- #712: deterministic/prepared AI content inside shared Hub, no second shell.

This separation removes the core architectural defect in draft PR #724 where `portfolio-pet.ts` owns both character launcher and its own panel.

### G4 — #713/#714/#715 remain compatible
- #713 owns approved public facts, answer templates and retrieval provenance.
- #714 owns a narrow public Yandex assistant boundary and explicitly excludes private `awful-control`/MCP trust.
- #715 owns draft generation/editing and explicit handoff only; no delivery credentials or attachment ownership.

No duplicate backend owner was found.

### G5 — #170/#747/#750 analytics ownership is compatible
#170 owns Metrika dashboard/privacy details and already reserves `contact_form_submit` for confirmed backend success with no PII. #747/#750 keep Contact Hub events owned by #746 and avoid field-level telemetry.

One documentation drift remains: current `docs/analytics.md` and `/privacy/` describe production behavior only and therefore do not list future Contact Hub events yet. This is correct for now, but becomes a release gate once the form ships.

### G6 — PR #724 has been explicitly superseded
PR #724 has been rewritten to state that it is foundation evidence only. Reusable seams are feature flag, sprite manifest, knowledge approval, deterministic routing concept and cleanup patterns. Its pet-owned panel, combined state, bottom-right geometry, blur/card/action-grid CSS and exact-string-only routing are explicitly non-canonical.

### G7 — private control plane remains private
PR #675 remains private/internal and is not a runtime dependency of anonymous visitors. Contact delivery and public AI each get narrow public boundaries rather than weakening `AWFUL_INTERNAL_TOKEN` protection.

## FIXES APPLIED DURING AUDIT

1. Reconciled #709 with draggable Venus, direct form, hide/disable, mobile collapse and prepared-first routing.
2. Reconciled #710 with current interaction/viewport requirements.
3. Reconciled #711 with drag/hide/persistence/direct-contact ownership.
4. Reconciled #712 with prepared-answer hierarchy and quiet thinking state.
5. Rewrote PR #724 header/body as explicit canonical supersession.

## REMAINING BLOCKERS

### G8 — do not merge PR #724 as-is
It remains draft and diverged from current `dev`. Foundation code must be selectively reconciled on current `dev`; obsolete shell/state/CSS must not be merged then cosmetically repaired.

### G9 — Contact Hub release must synchronize analytics/privacy docs
When production behavior exists, `docs/analytics.md`, `/privacy/`, #170 goal configuration and Webvisor field-recording policy must be updated together. Do not pre-document undeployed processing as if it already exists.

### G10 — no new issue split is required before frontend work
The existing ownership map is sufficient. Creating another family of micro-issues would mostly create administrative sediment. New issues should be created only for defects uncovered during RED/GREEN implementation that have independent scope.

## REQUIREMENT IDS AFFECTED
P-001..012, W-001..010, PET-001..035, H-001..015, M-001..018, AI-001..023, PRV/AN/SEC release contracts.

## TEST IMPACT
- No new test belongs in `test:fast` from this audit.
- PR #724 tests must be classified individually KEEP/MOVE/DELETE when foundation code is reconciled.
- Existing canonical RED skeletons remain the starting evidence.

## QUESTIONS REQUIRING OWNER DECISION
None before RED. Final public copy, Venus art/assets and exact visual composition still require owner approval during the frontend/design integration phase.
