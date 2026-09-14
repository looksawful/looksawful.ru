# Storybook system expansion plan

> Base: `lab` at `d2fa1a10cefda1be5d7f49e3adb1bfa334fb600c`.
> Target: progressively make Storybook a complete, evidence-backed catalogue of the site's real UI without attempting a bulk migration now.

## Goal

Evolve the existing LAB Storybook into a reliable catalogue of canonical production UI, its meaningful states, responsive variants, hidden/conditional states, compositions and page archetypes. The near-term goal is infrastructure, inventory accuracy and a small representative pilot. The long-term goal is complete site coverage.

## Verified baseline

- Storybook is the official Storybook 10 stack, built with `@storybook/html-vite` from `tools/lab/storybook/`.
- `tools/lab/storybook/main.mjs` loads `src/lab/stories/**/*.stories.@(js|mjs)` and enables Docs, a11y and design-token addons.
- `tools/lab/storybook/preview.mjs` loads canonical site CSS and sorts stories as Foundations, Atoms, Molecules, Organisms, Templates, Pages, Motion, Experimental.
- `tools/lab/storybook/vite.config.mjs` intentionally isolates Storybook from production multi-page Vite orchestration.
- `src/lab/stories/` currently contains four story modules: foundations, before-after, code-block and model-viewer-controls.
- Existing canonical stories already use the preferred pattern: import the production renderer/runtime and real site data instead of duplicating component markup.
- `tools/lab/design-system-inventory.mjs` already generates a JSON/HTML inventory, but currently scans only `src/components`, `src/styles`, `src/templates`, `src/lab/stories` and decides component documentation primarily by matching filename stems.
- The actual UI surface is broader than `src/components`: `src/templates`, `src/site/pages`, `src/site/navigation`, `src/site/renderers`, `src/site/rendering`, `src/site/shell`, page manifests, global interactive/motion entry points and LAB-only experiments also matter.
- `src/site/pages/manifest.ts` is a canonical source for page types and discovery state, including unlisted/non-indexable project routes and the 404 route.

## Integrated milestone (2026-09-14)

Tracks A-F are now combined on `storybook/coverage-ci`. The integrated system has:

- evidence-backed inventory v2 spanning 96 UI-owner sources across components, templates and selected `src/site/**` owners;
- 8 Storybook modules total, including four new canonical pilot stories;
- explicit supporting-source validation so canonical `src/data/**` dependencies can be declared without inflating the UI denominator;
- one canonical state/visibility schema shared with inventory layer, policy and visibility validation;
- LAB review viewports at 1440x1000, 834x1112 and 390x844;
- a Windows-safe Storybook launcher;
- historical audit artifacts pinned to their original baseline rather than presented as current live counts.

The last code-changing integrated head before the audit/roadmap-only merges was `29d3c6c0a8b2d87b9d09430ea4e327e823f546a5`. Fresh verification there produced 16/16 focused Storybook/inventory/schema tests, 0 structural inventory errors, a successful Storybook 10.6.0 static build, and 207/207 fast tests.

Phase 0's truth/denominator exit gate is achieved. Phase 1 is technically established across harness, schema, pilot metadata and inventory, but visual browser parity review is still outstanding, and an explicit hidden/overlay/conditional pilot should be added only when a low-risk canonical owner is selected. Build warnings for `:target-current` parsing and large Storybook chunks remain non-blocking follow-up items rather than coverage failures.

## Architectural decisions

1. Keep official Storybook embedded in LAB. Do not replace it with a second custom component explorer.
2. Keep Storybook's Vite configuration isolated. Add only deliberate preview context/decorators needed to render canonical site UI.
3. A story must prefer canonical production renderer/runtime/data. Do not duplicate product markup or CSS merely to make a story convenient.
4. Do not equate every source file with a story. Canonical story metadata uses the story policies `isolated`, `composition`, `page`, `behavior-fixture`, and `experimental`. Source inventory separately carries exemptions/classification such as `no-story` / `exempt-no-story` and orphan / `needs-classification` states.
5. Do not equate filename-stem matching with coverage. Story ownership must become evidence-backed and able to represent one story using multiple canonical sources.
6. Hidden state is multidimensional. At minimum distinguish breakpoint visibility, conditional/data visibility, disclosure state, overlay/portal state, route discovery visibility, feature/experiment state and reduced-motion behavior.
7. Page discovery flags (`listed`, `indexable`) are not the same thing as visual visibility and must remain separate fields.
8. Coverage must be useful before it is strict. Initial checks report missing/partial coverage but do not block LAB merely because the whole site is not yet migrated.
9. Experimental LAB-only prototypes do not count as canonical production coverage unless they import or are explicitly linked to the production owner.
10. Coverage percentage is not a goal by itself. The denominator must first become trustworthy.

## Shared story metadata direction

New and gradually updated stories should use a consistent custom Storybook parameter namespace without breaking ordinary CSF:

```js
parameters: {
  looksawful: {
    sources: ["src/templates/example.ts", "src/components/example.ts"],
    layer: "molecule",
    policy: "isolated",
    canonical: true,
    state: "default",
    visibility: ["always"],
  },
}
```

Allowed values should be validated centrally rather than copied as unrelated string conventions across stories. Existing stories do not need to be rewritten in bulk during the first phase.

## Coverage dimensions

Coverage is tracked independently across:

- source ownership;
- isolated rendering where appropriate;
- composition coverage;
- page/archetype coverage;
- interaction states;
- responsive states;
- hidden/conditional states;
- async/data states;
- motion and reduced-motion behavior;
- accessibility review status.

A component can therefore be `partial` without pretending to be missing or complete.

## Workstream ownership

### A. Canonical UI inventory audit

Branch: `storybook/audit-inventory`

Audit-only. Enumerate and classify the real UI-producing surface and current Storybook evidence. Produce human-readable and machine-readable audit artifacts. Do not change production UI or Storybook infrastructure.

### B. Storybook harness and site context

Branch: `storybook/harness-context`

Own `tools/lab/storybook/**`, generic preview helpers/decorators and their tests. Make canonical site UI reproducible inside isolated Storybook without importing production build orchestration. Do not mass-create stories.

### C. State and hidden-UI model

Branch: `storybook/state-matrix`

Define and test a shared taxonomy/schema for interaction, responsive, visibility, async and motion states. Audit representative high-risk sources. Do not migrate the full component catalogue.

### D. Representative pilot stories

Branch: `storybook/pilot-stories`

Add only 3-5 carefully selected canonical stories that exercise different architectural classes and expose weaknesses in the harness/state model. Do not touch Storybook core config or attempt broad migration.

### E. Coverage/inventory v2

Branch: `storybook/coverage-ci`

Upgrade the current inventory from stem-based documentation flags toward evidence-backed coverage. Include site/page surfaces and explicit exemptions/policies. Add tests first. Keep initial coverage checks report-only or warning-only, not a whole-site blocking threshold.

### F. Integration and roadmap

Branch: `storybook/integration-roadmap`

Own this plan, shared contracts, conflict resolution, merge order and phase gates. Do not duplicate implementation owned by A-E.

## Phases

### Phase 0: establish truth

Immediate scope.

- Re-run inventory from current `lab` source.
- Audit all relevant UI-producing directories and entry points.
- Identify false positives/false negatives caused by filename-stem matching.
- Separate canonical production, LAB-only experimental, infrastructure and orphan candidates.
- Define story policy and state/visibility vocabulary.
- Verify current Storybook build and existing stories as baseline.

Exit gate: we can explain what is in the denominator and why.

### Phase 1: harden the harness and run a pilot

Immediate scope.

- Add minimal generic site preview context only where verified necessary.
- Establish canonical viewport presets matching LAB review sizes: desktop `1440x1000`, tablet `834x1112`, mobile `390x844`.
- Add 3-5 representative stories using production renderers/runtimes.
- Cover at least one interactive component, one composition/template, one responsive case and one hidden/overlay/conditional case if the repository offers suitable low-risk candidates.
- Validate state metadata/schema against the pilot.
- Upgrade inventory enough to represent the pilot accurately.

Exit gate: the approach works across several architectural classes without copying product implementations.

### Phase 2: interaction, responsive and hidden-state coverage

Later.

- Expand state matrices for navigation, media, overlays, galleries, disclosures, players and motion-heavy components.
- Add reduced-motion scenarios.
- Add breakpoint visibility scenarios based on real CSS/runtime conditions, not arbitrary Storybook-only CSS.
- Track conditional/data-driven absence separately from breakpoint hiding.

Exit gate: high-risk interaction and visibility behavior is reproducible in Storybook.

### Phase 3: templates and compositions

Later.

- Cover canonical templates and renderer combinations.
- Prefer fixtures built from real typed data shapes.
- Add composition stories where leaf isolation would misrepresent behavior.

Exit gate: major reusable page sections can be reviewed independently of full routes.

### Phase 4: page archetypes

Later.

Use `src/site/pages/manifest.ts` and canonical renderer contracts to cover page types/archetypes rather than blindly cloning every URL. Include discovery-hidden/unlisted routes where they are real product surfaces.

Exit gate: every page type has an explicit Storybook policy and representative fixture where appropriate.

### Phase 5: systematic site migration

Later and incremental.

- Work through remaining `missing` and `partial` inventory entries by risk/usage.
- Add states based on real behavior.
- Mark legitimate no-story infrastructure explicitly.
- Remove obsolete/orphan entries only through separate product decisions, never merely to improve coverage numbers.

Exit gate: every real UI surface is either covered or explicitly classified with a justified non-story policy.

### Phase 6: maintenance gate

Only after the denominator is trusted and broad coverage is achieved.

- New canonical UI source must enter inventory automatically.
- Unknown/unclassified production UI becomes CI-blocking.
- Existing historical coverage may remain threshold-based until backfill is complete.
- Storybook build, inventory generation and focused interaction/a11y checks run in LAB CI.

## Merge order

1. A inventory audit, because it changes understanding but not runtime.
2. C state model, because it defines shared vocabulary.
3. B harness/context, rebased on any agreed state vocabulary if needed.
4. D pilot stories, rebased onto B/C contracts.
5. E inventory/coverage v2, rebased after real pilot metadata exists so it is tested against actual stories rather than theory.
6. F updates the roadmap/contracts after integration evidence.

If an implementation branch depends on a later branch, do not copy code across branches ad hoc. Record the dependency and rebase/cherry-pick after the owner branch lands.

## Required verification

For code-changing branches, use test-first development for new behavior and run fresh verification before completion claims. At minimum consider:

```bash
npm run typecheck
npm run test:fast
npm run lab:system
npm run lab:inventory
npm run build:site
```

Run narrower targeted tests during development; run only the broader commands that are relevant to the changed area before claiming completion. Do not claim a command passes from an earlier agent's report.

## Non-goals for the first iteration

- no bulk creation of stories for every source file;
- no conversion of production architecture merely to satisfy Storybook;
- no replacement of canonical site CSS with Storybook-specific copies;
- no blocking 100% coverage threshold;
- no promotion of LAB-only experimental prototypes into production ownership;
- no change to `prod` or the release path;
- no attempt to represent infrastructure modules as visual stories when their correct policy is `no-story`.

## Long-term definition of complete

The end state is reached when every real UI-producing surface has a canonical inventory entry; every entry has an explicit story policy; all story-required units have appropriate isolated/composition/page coverage; meaningful interaction, responsive, conditional/hidden, async and motion states are represented; page archetypes include unlisted but real routes; experimental/orphan/infrastructure entries are explicitly classified; and new unclassified UI cannot silently enter the site.