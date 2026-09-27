---
name: to-tickets
description: Use after an approved Spec or clear plan to publish tracer-bullet GitHub work packages with explicit blocking edges under the repository's configured issue-tracker contract.
---

# To Tickets

Read the source Spec/plan and `docs/agents/issue-tracker.md` before decomposing work.

## Slice vertically

Prefer tracer-bullet work packages that make one narrow end-to-end behavior independently verifiable.

Each ticket must:
- fit one fresh implementation context;
- state what it delivers from the user/system perspective;
- contain acceptance criteria;
- declare real blockers only;
- preserve the parent/spec reference when one exists.

Do not create horizontal layer tickets merely because files are organized by layer.

For a genuinely wide mechanical migration that cannot stay green vertically, use expand → migrate batches → contract and keep the blocker graph explicit.

## Publish

Create blockers before dependents so issue identifiers are available.

Use native GitHub sub-issue/dependency relationships when the active authorized surface exposes them. Otherwise use the repository's documented `Parent` and `Blocked by` body fallback. Never pretend a native relationship was written when it was not.

Apply `ready-for-agent` when that configured label exists. Do not close or rewrite the parent Spec merely because tickets were created.

## Frontier

Implementation starts from tickets whose blockers are closed. A parent link is coordination, not an implicit blocker.

## Done

Ticketing is complete when every published work package is independently understandable, executable, verifiable and closable, and the dependency graph reflects only genuine gating edges.
