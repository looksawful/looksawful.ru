# CodebaseDesign scan — looksawful.ru — 2026-09-27

Status: architecture analysis only. No production implementation.

Base evidence: `dev@e85599b1e8621e39502cc929b7429f012b0ec5a1`.

Vocabulary follows the repository-local Matt-derived `codebase-design` skill: **module**, **interface**, **seam**, **adapter**, **depth**, **leverage**, **locality**.

## Scope

The preceding Research phase identified four active clusters. This scan followed recent-change hot spots rather than trying to inspect the full repository uniformly:

1. Site page / renderer / content composition.
2. Editorial / Text Review / approval.
3. Media Catalog / placement / generated delivery.
4. CMS publication / branch topology.
5. Verification routing was inspected only far enough to test whether it is a real deepening candidate.

## Executive result

Three deepening candidates are worth carrying forward.

1. **Production surface registry** — Strong.
2. **Jestei track-filter internal decomposition behind the existing seam** — Strong.
3. **Stable Text Review core with round-specific adapters** — Worth exploring.

Three tempting refactors are currently rejected:

- do not replace the Site page manifest / page renderer seam;
- do not split Media Catalog merely because its implementation is large;
- do not unify CMS editor configuration with publication authorization or auto-discover Fast CI tests.

Those existing separations currently earn their keep.

---

## Candidate 1 — Production surface registry

**Recommendation strength: Strong**

### Files / modules

- `src/content/contracts/content-block.ts`
- `src/content/contracts/sections.ts`
- `src/site/pages/manifest.ts`
- `src/site/renderers/entity/content-block.ts`
- `src/site/renderers/entity/section.ts`
- `src/components/specialized/**`
- `src/lab/storybook/inventory.ts`
- tests around Storybook/component parity
- tracked system audit: GitHub issue #861

### Current friction

Production surface identity is distributed across several authoritative-looking lists:

- `CONTENT_BLOCK_TYPES` owns the ContentBlock union.
- `Section` owns specialized section kinds.
- renderers own the executable dispatch.
- `src/components/specialized/**` owns specialized implementations.
- Storybook inventory derives entity templates/compositions/pages, but specialized production surfaces are not represented through one common production-surface owner.

Issue #861 independently records the same practical failure mode: production can gain a specialized surface that Storybook/Lab does not expose.

The problem is not that each list exists. They serve different roles. The friction is that there is no small **interface** answering the cross-cutting question: “what production UI surfaces exist, who owns their renderer, and what approval/verification surface is required?”

### Deepening direction

Create one production-surface **module** that owns the cross-cutting inventory needed by approval tooling and parity checks, while leaving domain unions and executable render dispatch where they already belong.

The new module should not become a second renderer registry or page manifest. It should derive/validate the facts that Storybook/Lab and parity checks need from production owners.

### Benefits

- **Locality:** adding a genuinely new production surface has one explicit parity owner instead of relying on humans to remember Storybook/CI implications.
- **Leverage:** Storybook inventory, parity tests and audits consume the same production-surface view.
- **Testing:** parity can be tested through one production-surface seam instead of bespoke assertions per new surface.
- **AI navigability:** an agent can discover production UI scope without scanning multiple unions, renderer switches and story files.

### Before

```text
ContentBlock union ─┐
Section kinds ──────┼─> production renderers
specialized files ──┘

Storybook inventory ─────> independently derives only part of production
parity tests ─────────────> bespoke knowledge
```

### After direction

```text
existing production owners
  ├─ ContentBlock
  ├─ Section kinds
  ├─ Site pages
  └─ specialized renderers
          │
          ▼
  Production Surface view
          │
     ┌────┴─────┐
     ▼          ▼
 Storybook   parity/audit
```

No interface shape is selected yet. That belongs in the later Grill/Wayfinder decision phase.

---

## Candidate 2 — Jestei track-filter internal decomposition behind the existing seam

**Recommendation strength: Strong**

### Files / modules

- `src/components/specialized/jestei-track-filter.ts` — ~153 KB, one exported renderer
- `src/components/specialized/jestei-track-filter-canonical.ts` — transitional parity adapter
- `src/site/renderers/entity/section.ts`
- related playlist-filter CSS/runtime/browser tests

### Current friction

The external module is superficially deep: callers learn essentially one interface, `renderJesteiTrackFilter`.

But almost the entire implementation is one enormous embedded HTML artifact. That gives caller leverage but poor maintainer locality:

- one conceptual change requires navigating a 150+ KB template;
- semantic regions, static fixture content, component wiring and migration-era exact HTML are hard to distinguish;
- the canonical adapter performs string replacement over legacy output for stylesheet, heading, indexing and caption normalization;
- the file is expensive for both humans and agents to reason about safely.

The current external seam is valuable and should survive. The problem is inside the implementation.

### Deepening direction

Keep one external Jestei Track Filter renderer **interface**, but introduce internal modules/seams around stable conceptual regions so the implementation becomes navigable and independently characterizable without leaking new caller surface.

The transitional canonical adapter should be treated as migration debt and removed only when its documented preconditions are actually satisfied.

### Benefits

- **Locality:** a filter-region change stops requiring edits inside one giant literal.
- **Leverage:** external callers still know one renderer.
- **Testing:** internal characterization can target meaningful internal seams while public tests continue through the existing renderer interface.
- **AI navigability:** agents can load the relevant filter region instead of a 150 KB source blob.

### Before

```text
Section renderer
      │
      ▼
renderJesteiTrackFilter
      │
      ▼
153 KB embedded implementation
      │
      ▼
canonical string-replacement adapter
```

### After direction

```text
Section renderer
      │
      ▼
same public renderer interface
      │
  ┌───┼─────────┐
  ▼   ▼         ▼
internal region modules / fixture / composition
      │
      ▼
canonical output
```

No split boundaries are selected yet.

---

## Candidate 3 — Stable Text Review core with round-specific adapters

**Recommendation strength: Worth exploring**

### Files / modules

- `tools/supabase/text-review-v2/contract.mjs`
- `tools/supabase/text-review-v2/index.mjs`
- `tools/supabase/text-review-v2/schema.sql`
- `tools/supabase/text-review-v3/contract.mjs`
- `tools/supabase/text-review-v3/schema.sql`
- `tools/supabase/text-review-v3/reconcile-prior-decisions.sql`
- `test/text-review-v2-contract.test.mjs`
- `test/text-review-v3-contract.test.mjs`
- Round 3 issue family #1190–#1203

### Current friction

Round history is intentionally immutable, which is correct. But each round currently grows its own contract/storage implementation.

Round 2 introduced:
- answer normalization;
- carry-forward;
- fact-dependent application blocking;
- persisted review state.

Round 3 introduced:
- explicit material context;
- prior-decision eligibility;
- decision locks;
- inherited/review/answered states;
- reconciliation from historical rounds.

These are not merely old and new copies: Round 3 genuinely has stronger semantics. The architectural risk is that future Round 4+ work may copy another full folder rather than distinguishing stable Text Review concepts from round-specific migration adapters.

### Deepening direction

Investigate a stable Text Review domain **module** for semantics that survive rounds, while keeping each historical round and migration adapter immutable.

Do not retroactively rewrite Round 1/2/3 storage. The goal is a future-facing seam, not historical normalization.

### Benefits

- **Locality:** invariant review semantics evolve in one current owner.
- **Leverage:** future rounds reuse the domain contract while supplying round-specific storage/import adapters.
- **Testing:** durable review behavior can be tested at one seam; migration tests remain specific to their adapters.
- **Domain alignment:** naturally matches existing glossary terms Text review item, Text review option and Fact check.

### Before

```text
Round 2 contract + runtime + schema
Round 3 contract + reconciliation + schema
Round N ? → likely another copied stack
```

### After direction

```text
Stable Text Review semantics
          │
   ┌──────┼──────┐
   ▼      ▼      ▼
R2 adapter R3 adapter future adapter
(history remains immutable)
```

This candidate needs the most care because some duplication is deliberate provenance.

---

## Rejected candidate A — replace Site page / renderer dispatch

### Evidence

- `src/site/pages/manifest.ts` owns route/page identity in one validated manifest.
- `site-pages-plugin.ts` consumes the manifest and performs bounded renderer dispatch.
- entity rendering is routed through `renderStandaloneEntityPage` and deeper renderer modules.
- tests consume the same manifest.

### Deletion test

Deleting this module would redistribute route/build/discovery/renderer decisions across many consumers.

**Conclusion:** it is already a deep module. Do not “genericize” it merely to remove an explicit switch.

---

## Rejected candidate B — split Media Catalog by file size

### Evidence

`src/data/media/catalog.ts` is large, but it concentrates:

- strict source parsing;
- registered-vs-uploaded normalization;
- legacy validation;
- duplicate identity/source rejection;
- typed catalog construction;
- lookup/filter behavior.

It presents a comparatively small set of useful interfaces to callers.

### Deletion test

Removing the module would push validation and origin normalization into Media Desk, renderers, tools and tests.

**Conclusion:** file size is not shallow design. Preserve the module unless a concrete change repeatedly crosses an internal concern.

---

## Rejected candidate C — unify CMS configuration and publication authorization

### Evidence

The same authored paths appear in `.pages.yml`, publication scope rules, docs and tests.

That duplication initially looks like shotgun surgery, but the publication classifier is a trusted fail-closed authorization surface. If publication rights were derived directly from editable CMS configuration, the editor configuration could expand its own authority.

Likewise, `cms-publication-scope.mjs` and `cms-publication-topology.mjs` answer distinct questions:

- is this path class allowed to publish?
- is this dev/prod history/content topology safe?

**Conclusion:** keep the security separation. Revisit only if a trusted immutable manifest can preserve independent authorization.

---

## Rejected candidate D — auto-discover Fast CI tests

`tools/ci/run-tests.mjs` contains a long explicit allowlist, but `docs/testing-policy.md` says Fast CI is intentionally opt-in.

Automatic discovery would erase a deliberate cost/lifecycle policy.

**Conclusion:** the long set is explicit policy, not by itself an architectural smell.

---

## Top recommendation

**Production surface registry** is the first architecture candidate to carry into the decision phase.

Reasons:

1. The current failure is already observed and tracked in #861.
2. It spans real production → Storybook/Lab parity rather than aesthetic cleanup.
3. It can deepen an approval/verification seam without replacing the strong page/content renderer modules.
4. It should reduce future omissions whenever new ContentBlocks or specialized sections ship.
5. It is smaller and safer to decide than rewriting the Jestei filter or evolving the Text Review domain while Round 3 is active.

## Next canonical phase

The requested lifecycle says the next step is **SetupMatt audit**, not implementation of any candidate.

Carry these architecture findings into that audit, then run Domain Modeling only for terminology/decision changes. After SetupMatt is coherent, this repository is large enough that the cross-cutting Matt-Flow adoption effort should use **Wayfinder** rather than immediately creating implementation tickets.
