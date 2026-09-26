# Portfolio UX/IA publication and Gallery research — 2026-09-24

Scope: evidence for continuing PR #1125 from the approved Portfolio UX/IA decision record. This note intentionally contains only repository/public GitHub evidence.

## Primary sources

- Product decision record: `docs/superpowers/specs/2026-09-21-portfolio-ux-ia.md`
- Rollout plan: `docs/superpowers/plans/2026-09-21-portfolio-ux-ia-rollout.md`
- Repository rules: `AGENTS.md`, `docs/testing-policy.md`, `docs/agents/issue-tracker.md`
- Implementation: `src/site/pages/portfolio-presentation.ts`, `src/site/pages/manifest.ts`, `src/site/renderers/work-page.ts`, `src/site/renderers/home/home-slots.ts`, `src/site/renderers/portfolio/portfolio-card.ts`, `src/data/media/gallery.ts`
- Decision map: GitHub issues #1142–#1148
- Gallery accessibility work: PR #1156
- Portfolio implementation: PR #1125

## Findings

### Publication is a separate gate from portfolio membership

Issue #1147 explicitly separates selection into Featured/Archive from approval to make Project routes `listed: true` and `indexable: true`. The current manifest keeps every Project route non-listed/non-indexable until that approval.

Therefore rendering an `enabled` Project in Work, Featured, or Archive is insufficient. Portfolio card rendering on public discovery surfaces must fail closed unless the SitePage is both listed and indexable.

This also matches the product record: existing route/readiness must not automatically publish Archive content.

### Current Archive RED is a product bug, not a stale test

Fast CI on PR #1125 fails `Work page fails closed when Archive contains a non-public entity`: rendering accepts `project:awful-cases` despite its manifest discovery state being false/false.

The correct fix belongs at the shared public portfolio-card seam so Home/Work cannot independently leak a selected but unpublished Project.

### Gallery curation is not decision-complete

Issue #1146 remains open. The current `src/data/media/gallery.ts` derives photographs from project membership plus `showInCatalog`, while T10 requires an explicit 20–30 item selection and says catalog flags must not auto-publish.

The same issue records the current Gallery set as a candidate, not owner approval. Final explicit curation must wait for the owner decision rather than converting the candidate into canonical publication state.

### Gallery accessibility work overlaps PR #1125

PR #1156 changes `src/site/renderers/gallery-page.ts`, `test/gallery-renderer.test.mjs`, and `tools/e2e/run-smoke.mjs`, which are also changed by PR #1125. Its head has green Fast CI, CodeQL, and Dependency Review.

PR #1125 must reconcile this overlap before final Gallery verification so the UX/IA branch does not regress the keyboard-operable 3D viewer work.

### Test lifecycle

Publication fail-closed behavior is a long-lived CONTRACT and is appropriate for permanent cheap coverage. Assertions that merely pin temporary owner-state such as empty Featured/Archive or a temporary five-symbol Gallery candidate must be reclassified before T13 under `docs/testing-policy.md`.

## Implementation order

1. Enforce listed+indexable at the shared public portfolio-card seam.
2. Prove Archive and Featured unpublished Project fixtures fail closed.
3. Reconcile PR #1156 into the Portfolio UX/IA branch before further Gallery changes.
4. Keep #1143–#1148 owner-gated data unresolved until explicit decisions.
5. After decisions, implement explicit Gallery curation, Archive sortable metadata for Collections, intro copy, next-Case mapping, and discovery promotion.
6. Classify changed tests KEEP/MOVE/DELETE and run the T13 verification set.
