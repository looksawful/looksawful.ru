# Portfolio UX / IA rollout

Source spec: `docs/superpowers/specs/2026-09-21-portfolio-ux-ia.md`
Detailed plan: `docs/superpowers/plans/2026-09-21-portfolio-ux-ia-rollout.md`

## Phase 1 — Portfolio model + Work

- [ ] **T1 Portfolio presentation contract**
  - AC: exactly 3 Case-only Flagships; Featured supports Case/Project/Collection; Archive explicit/manual; duplicate/unknown IDs fail closed.
  - Verify: focused contract test; `npm run typecheck`.
  - Depends: none.

- [ ] **T2 Add canonical /work/ SitePage**
  - AC: Vite-built `/work/`; canonical metadata; listed/indexable; canonical SitePage ownership.
  - Verify: focused page tests; `npm run typecheck`; `npm run build:site`.
  - Depends: T1.

- [ ] **T3 Render main Work index**
  - AC: neutral main index; canonical hrefs; Collection-only type label; no copied authored content.
  - Verify: focused renderer test; desktop/mobile browser check.
  - Depends: T1, T2, Editorial A for final membership.

- [ ] **T4 Work Archive disclosure**
  - AC: closed by default; explicit approved entries only; newest-first; semantic no-JS baseline; session-only remembered state.
  - Verify: focused contract + affected browser keyboard/session check.
  - Depends: T1–T3, Editorial A.

### Checkpoint 1
- [ ] `/work/` deep-loads and builds.
- [ ] Archive does not auto-publish hidden Projects.
- [ ] Canonical links only.

## Editorial A — portfolio membership
- [ ] Approve 3–5 Featured page IDs.
- [ ] Approve Archive page IDs.
- [ ] Approve any currently unlisted Project routes for listed/indexable publication.

## Phase 2 — Navigation

- [ ] **T5 Navigation topology/data**
  - AC: primary exactly Work / Gallery / CV; Home label remains available; Work shortcuts = 3 Flagships + Shootings.
  - Verify: navigation model/parser tests; typecheck.
  - Depends: T1, T2.

- [ ] **T6 Responsive navigation UI/runtime**
  - AC: desktop visible primary links + home identity + accessible Work disclosure; mobile AwfulFace menu with nested Work shortcuts; preserve Escape/focus/inert/scroll lock/reduced motion.
  - Verify: `npm run test:e2e:navigation`; `npm run test:ui:responsive`; keyboard check.
  - Depends: T5.

### Checkpoint 2
- [ ] Desktop/mobile navigation matches approved IA.
- [ ] No hover-only essential interaction.
- [ ] Existing AwfulFace/runtime safety preserved.

## Phase 3 — Homepage + entity pages

- [ ] **T7 Homepage hierarchy**
  - AC: Hero → Project index → 3 Flagships → 3–5 Featured; no Archive on homepage; reuse current patterns.
  - Verify: focused homepage order/count test; responsive browser check.
  - Depends: T1, Editorial A.

- [ ] **T8 Entity intro contracts**
  - AC: Case = Role/Task/Contribution/Result; Project = What/Role/Result-or-purpose; Collection = Role/Period/Contents; no fabricated outcomes.
  - Verify: focused structural/escaping tests; `npm run test:e2e:mpa`; `npm run test:e2e:projects`.
  - Depends: structural work none; production copy Editorial B.

## Editorial B — intro copy
- [ ] Approve Jestei Role / Task / Contribution / Result.
- [ ] Approve Styx Role / Task / Contribution / Result.
- [ ] Approve Sensetique Role / Task / Contribution / Result.
- [ ] Approve missing Featured Project/Collection intro copy.

- [ ] **T9 Manual next-Case mapping**
  - AC: each Flagship has explicit public non-self next Case; canonical route resolution.
  - Verify: focused mapping test + project E2E traversal.
  - Depends: T1.

### Checkpoint 3
- [ ] Homepage hierarchy correct.
- [ ] 3 Flagship summaries use approved copy.
- [ ] Manual next-Case links work.

## Phase 4 — Gallery

## Editorial C — Gallery curation
- [ ] Approve exact 20–30 Gallery item IDs.
- [ ] Approve series titles/grouping.
- [ ] Keep every series at max 3 selected frames, including Jestei 3D.

- [ ] **T10 Explicit Gallery curation**
  - AC: 20–30 explicit items; stable order; no duplicate IDs; max 3 per series; catalog flags do not auto-publish.
  - Verify: focused gallery-data contract; typecheck.
  - Depends: Editorial C.

- [ ] **T11 Gallery semantics/UI**
  - AC: visible h1; quiet series context; contextual card accessible names; hover/focus captions; lightbox title/series context + counter.
  - Verify: gallery renderer/affected tests; keyboard open/close/focus return; mobile/reduced-motion check.
  - Depends: T10.

### Checkpoint 4
- [ ] Gallery is curated, not catalog-derived.
- [ ] Visible h1.
- [ ] Contextual accessible labels.
- [ ] Short-series rule enforced.

## Phase 5 — Publication + final verification

- [ ] **T12 Explicit discovery promotion**
  - AC: only owner-approved public entries become listed/indexable; sitemap/meta/local links match manifest.
  - Verify: `npm run build:site`; `npm run check:site-meta`; `npm run check:links`; inspect sitemap.
  - Depends: Editorial A, T2–T4.

- [ ] **T13 Final affected verification + docs sync**
  - AC: canonical docs updated; all relevant checks green; retained tests classified KEEP/MOVE/DELETE.
  - Verify:
    - `npm run typecheck`
    - `npm run test:fast`
    - `npm run build:site`
    - `npm run test:e2e:navigation`
    - `npm run test:e2e:mpa`
    - `npm run test:e2e:projects`
    - relevant Gallery affected/Storybook check
    - `npm run test:ui:responsive`
    - `npm run verify`
  - Depends: T1–T12.

### Checkpoint 5 — Ready for review
- [ ] No unapproved publication.
- [ ] No invented copy/metrics.
- [ ] No duplicate route ownership.
- [ ] No new permanent test without a long-lived contract justification.
- [ ] Ready for review. Merge/release is separate explicit action.
