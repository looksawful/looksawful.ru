# SetupMatt audit — looksawful.ru — 2026-09-27

Status: configuration repair on research branch; no product/runtime behavior changed.

## Findings

- `AGENTS.md` already existed and remains the canonical agent entrypoint. This workspace uses GPT/OpenClo; `CLAUDE.md` is not used.
- GitHub Issues + Notion already form a deliberate two-layer planning model; generic GitHub-only SetupMatt text would be a regression.
- The five canonical triage roles are configured; `ready-for-agent` is demonstrably in active use.
- The repository is single-context with a real root `CONTEXT.md`.
- `docs/agents/domain.md` was under-specified and implied `docs/adr/` without stating Matt's lazy-file rule.
- Wayfinder had no tracker-specific operations configured.
- PR #1136 and PR #1138 are duplicate/superseded SetupMatt proposals relative to current `dev` and need later reconciliation.
- The current GitHub connector does not expose label creation or native sub-issue/dependency writes. Wayfinder labels therefore remain a real provisioning prerequisite.

## Changes in this audit

- declare `AGENTS.md` as the sole GPT/OpenClo repository entrypoint;
- add the owner-approved Matt Flow orchestration pointer without duplicating local skill text;
- extend the existing issue-tracker contract with Spec/Tickets/Wayfinder operations while preserving the Notion/GitHub split;
- make domain docs explicitly lazy and non-ceremonial;
- expand the triage mapping without creating a second state machine.

## Not changed

- product/runtime code;
- CI/workflows;
- CMS/publication guards;
- branch topology;
- existing local skills;
- `CONTEXT.md`;
- ADRs;
- GitHub labels themselves;
- stale SetupMatt PR state.

## Prerequisites recorded at audit time

1. Verify/provision `wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task`.
2. Reconcile stale duplicate SetupMatt PRs #1136 and #1138.
3. Review this policy/config diff before integration into `dev`.

## Closeout update — 2026-09-27

- Replacement PR #1226 now owns the complete Matt Flow policy/tooling rollout.
- PR #1136 and PR #1138 were closed as superseded after #1226 existed; audit-time prerequisite 2 is satisfied.
- Label verification/provisioning remains capability-dependent and must be checked at first Wayfinder use rather than inferred from this historical audit.
- PR review/CI remains the integration gate before `dev`.
