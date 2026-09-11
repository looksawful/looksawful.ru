# Contact Hub + Venus CSS / Responsive / Overlay Audit

**VERDICT: GO WITH FIXES**

Scope: current site tokens/base/motion/layering, PR #724 pet CSS as negative/technical evidence, canonical widget requirements.

## BLOCKERS

### C1 — existing analytics consent already occupies the same bottom-left territory as canonical Venus
Severity: high for integration.

Current `site-analytics-consent.css` is a fixed surface at bottom-left with z-index 110. Canonical Venus is also bottom-left. A naive fixed pet will overlap the consent control before the visitor makes a choice.

**Fix:** add an explicit collision contract before implementation. Preferred result: when the consent surface is visible, the pet is temporarily offset/clamped outside its bounds or temporarily suppressed; neither surface changes document flow. Contact Hub submission must remain independent of consent. Do not solve this by moving canonical Venus permanently to the right.

Requirements: W-006/W-009, PET-020, PRV-001, AX-009.
Test: focused AFFECTED browser geometry test with consent visible.

### C2 — z-index ownership is currently implicit and conflicting
Severity: medium/high.

Current site navigation uses z-index 100 and analytics consent 110. PR #724 pet uses 80. Media/lightbox establishes its own stacking contexts. Without a documented widget layer rule, close/mode controls can land behind navigation/consent or the pet can appear above an active modal unexpectedly.

**Fix:** define semantic overlay ordering for at least `site content < pet < sticky navigation < consent/nonmodal system notice < Contact Hub active surface`, then define what happens when a real media modal/lightbox is active. Prefer behavior rules over scattering larger magic numbers. If no global z-index token system exists, introduce the smallest component-local custom properties/documented constants rather than a site-wide refactor.

Requirements: W-006, H-014/H-015, AX.

### C3 — viewport resize must not animate sheet height
Severity: high on mobile.

If mobile sheet uses a transition on `height/max-height`, Safari/Chrome toolbar or keyboard changes can create visible shaking even when the computed final bounds are correct.

**Fix:** open/collapse motion should be transform/opacity based. Dynamic viewport size changes update available block-size without size transition. CSS baseline uses `100dvh`/`100dvb` and safe-area insets; `visualViewport` JS is added only for an observed residual keyboard/browser-chrome failure.

Requirements: M-001..018, MV-001..006.
Tests: automated shrink/restore plus real-device evidence.

## FINDINGS

### C4 — current site tokens already cover almost all shared shell visuals
Use existing:
- `--ff-primary` / Inter Variable;
- `--fs-*`, `--lh-*`, `--ls-*`;
- `--size-*` and page spacing aliases;
- `--clr-surface-page`, `--clr-surface-raised`, `--clr-text`, `--clr-text-muted`, `--clr-border`, `--clr-border-strong`;
- `--radius-poster`, `--radius-contained`, `--radius-shell`;
- `--shadow-surface-elevated`;
- existing 2px `:focus-visible` convention.

**Decision:** Contact Hub should consume tokens, not create a parallel palette/radius/shadow system. Pet art may be character-specific, but shell controls are not.

Requirements: V-001..010.

### C5 — PR #724 CSS proves why its visual layer must be replaced
PR #724 currently places the entire widget bottom-right, makes launcher roughly 7rem x 8.5rem, draws the character from CSS anatomy, and owns a 23rem blurred/shadowed panel with two-column quick actions and pill-like controls.

This conflicts with canonical Venus identity/scale, bottom-left placement, shared shell ownership and minimal editorial form direction.

**Decision:** preserve no literal PR #724 layout values. Reuse only runtime ideas that survive the new contract.

### C6 — large Venus should use an overlay transform coordinate model
For drag performance and isolation, represent user displacement with fixed-position overlay geometry plus compositor-friendly translate/custom properties. Do not use margins/padding or document transforms that can affect site flow.

The clamp function should use the actual rendered pet bounds, current visual viewport and safe areas. The product contract is "enough remains grab-able", not "x/y never negative".

Requirements: PET-015..022, DR-001..005, W-001..003.

### C7 — touch gesture ownership must be narrowly scoped
`touch-action: none` on the entire page or giant invisible widget region would break site scrolling. Apply pointer ownership only to the actual pet drag target while dragging. Normal page scroll must continue everywhere else.

Requirements: PET-016..018, DR-005, AX-010.

### C8 — mobile sheet should be content-bounded and internally scrollable
A useful baseline:
- fixed to viewport edge;
- inline-size constrained by current visual viewport;
- block-size/max-block-size derived from dynamic viewport minus safe areas;
- header/mode/close stays reachable;
- content body scrolls internally when needed;
- form submit remains reachable through that internal scroll;
- no `overflow:hidden` on the content path that can permanently clip validation/error growth.

This satisfies "form is always fully usable" without requiring every field to literally fit simultaneously on a 320x568 screen at 200% zoom.

Requirements: F-022..025, M-001..018.

### C9 — `visualViewport` should be a compatibility adapter, not the primary layout engine
Modern CSS should own the normal geometry. If real iOS/Android evidence shows a residual keyboard/browser-toolbar defect, add a tiny adapter that exposes stable viewport offsets/sizes as CSS variables and updates without restarting open/collapse animation.

Requirements: MV-001..006.

### C10 — collapsed mobile launcher is a different geometry state, not a scaled copy of the whole form
Collapse should transform the shared shell toward an edge and leave a compact, accessible launcher. It must not preserve hidden form dimensions that intercept pointer events.

Requirements: M-010..017, AX-009.

### C11 — reduced motion applies to shell, thinking state and Venus independently
Current site motion already gates animated transitions under `prefers-reduced-motion`. Widget must follow the same principle:
- shell: no decorative travel/bounce;
- thinking: static/minimal indicator;
- Venus: static/minimal idle and no autonomous invite loops;
- functional state changes remain immediate and perceivable.

Requirements: PET-013, AI-020/021, AX, V-009.

### C12 — 44px touch target does not require 44px visible chrome
Minimal text/close icons can preserve editorial appearance using a larger transparent hit box/padding. Do not shrink physical interaction targets merely to keep the interface visually delicate.

Requirements: AX-009.

### C13 — 200% zoom and 320x568 are functional fallback targets
At extreme zoom/small height, internal scrolling is acceptable. The invariant is reachability/no horizontal overflow/no permanent clipping, not maintaining the desktop composition.

Requirements: W-010, M-002, F-022..025.

## REQUIREMENT IDS AFFECTED
W-001..010, PET-003..022, H-009..015, M-001..018, V-001..010, AX-001..012, MV-001..006, PERF-001..007, PRV-001.

## TESTS AFFECTED / TESTS MISSING

Current browser acceptance covers viewport containment, no horizontal overflow, site geometry isolation, pet size, drag and collapse.

Add just-in-time:
- consent-visible vs pet collision geometry;
- reduced-motion pet + shell + thinking behavior;
- compact launcher hit target and safe-area clamp;
- short-height form validation/error growth;
- competing media lightbox/Hub priority if interaction can coexist;
- real Mobile Safari/Android keyboard/browser-chrome evidence.

## EXACT PRE-IMPLEMENTATION FIXES

1. Add consent/pet collision requirement to canonical spec/plan.
2. Add explicit overlay stacking/competing-modal rule to plan before CSS implementation.
3. Ensure mobile plan forbids height transitions during viewport resize.
4. Keep CSS baseline responsible for geometry; gate `visualViewport` adapter behind observed failure.
5. Treat all PR #724 panel/launcher literal dimensions and bottom-right CSS as superseded.

## QUESTIONS REQUIRING OWNER DECISION
None. The exact visual position of Venus while analytics consent is visible can be resolved in implementation/prototype as long as neither overlaps and Venus returns to its canonical bottom-left area afterward.
