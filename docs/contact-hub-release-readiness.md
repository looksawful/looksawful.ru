# Contact Hub / Awful release readiness

Status date: 2026-09-16
PR: #788
Branch: `contact-hub-frontend-current`
Production: unchanged until explicit owner visual approval.

## Implemented and locked

- One shared Contact Hub owns both direct form and AI surfaces.
- The site contact entry opens the Hub directly in `form` mode.
- Direct form entry exposes no obsolete AI/Form mode switch.
- Awful opens the same Hub in `ai` mode on preview.
- Awful is preview-gated; production activation remains blocked by explicit owner visual approval.
- Form copy remains unchanged.
- The `отправить` control is a real button with a >=44 px touch target, visible border and high-contrast fill instead of link-like text.
- Desktop and mobile browser QA now verify that the direct form opens, the obsolete mode switch is absent and the submit control is visibly actionable.
- Preview browser QA additionally requires exactly one Awful launcher and verifies Awful -> shared Hub -> AI mode.
- Browser QA never submits the real contact form.

## Regression coverage

`test/contact-hub-prototype-ui-contract.test.mjs` locks the submit-button visual/touch-target contract and the absence of obsolete mode tabs.

`tools/e2e/run-production.mjs` covers the observable entry paths and geometry on desktop/mobile. On preview hosts it also covers the Awful launcher and single-Hub AI transition.

Any commit changing these paths must re-run exact-head CI and PR Preview. A prior green head is not release evidence for a later commit.

## Release gates that remain external/manual

1. Owner manual visual approval on the exact PR preview: Awful placement, scale, animation/rendering, drag/interaction, mobile behavior and Hub transition.
2. Mobile Safari / WebKit real-device evidence required by the canonical Contact Hub issue before claiming keyboard/browser-toolbar release quality.
3. Production merge/deploy remains forbidden until the owner explicitly approves the live preview.

Canonical unresolved work stays in GitHub issues rather than this document:
- #746 Contact Hub product / release contract.
- #711 Awful launcher / sprite runtime and interaction mechanics.

## Evidence policy

The current exact SHA, workflow conclusions and immutable preview URL are recorded by GitHub Actions and the archive-readiness checkpoint in PR #788. This document records the implementation contract, not a substitute for exact-head CI evidence.